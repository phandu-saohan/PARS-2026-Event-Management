/**
 * EmailQueue — Hàng đợi gửi email thông minh chống Spam
 *
 * Cơ chế hoạt động:
 *  - Xếp hàng (FIFO) các job email, xử lý tuần tự (không song song)
 *  - Delay cố định giữa mỗi lần gửi (mặc định 2 000ms) để tránh rate-limit SMTP
 *  - Batch size: sau mỗi BATCH_SIZE email tự nghỉ BATCH_PAUSE ms để tránh bị block
 *  - Retry tối đa MAX_RETRY lần với Exponential Backoff khi gặp lỗi tạm thời
 *  - Phân loại lỗi: lỗi vĩnh viễn (invalid recipient) không retry
 *  - EventEmitter-style callback để UI observe tiến trình real-time
 */

// ─── Hằng số điều chỉnh tốc độ ─────────────────────────────────────────────
const SEND_DELAY_MS   = 2_000;   // delay giữa mỗi email (ms) — tránh flood SMTP
const BATCH_SIZE      = 20;      // sau N email thì nghỉ
const BATCH_PAUSE_MS  = 8_000;   // nghỉ bao nhiêu ms sau mỗi batch (giúp tránh block)
const MAX_RETRY       = 2;       // số lần retry tối đa khi gặp lỗi tạm thời
const RETRY_BASE_MS   = 5_000;   // backoff cơ sở (ms), nhân đôi mỗi lần: 5s, 10s

// ─── Types ──────────────────────────────────────────────────────────────────

/** Payload một email job cần gửi */
export interface EmailJob {
  jobId: string;
  recipientName: string;
  recipientEmail: string;
  /** Hàm gọi thực tế để gửi email — trả về Promise<void>, ném Error khi thất bại */
  send: () => Promise<void>;
  /** Metadata tuỳ ý (attendeeId, templateId...) */
  meta?: Record<string, unknown>;
}

/** Kết quả của từng job sau khi xử lý */
export interface EmailJobResult {
  jobId: string;
  recipientName: string;
  recipientEmail: string;
  status: 'success' | 'failed' | 'skipped';
  attempts: number;
  error?: string;
  completedAt: string;
}

/** Trạng thái tổng thể của Queue */
export interface QueueStatus {
  state: 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentIndex: number;
  /** Index trong batch hiện tại (0..BATCH_SIZE-1) */
  batchIndex: number;
  /** ms còn lại trong lần delay hiện tại (để render countdown) */
  delayRemaining: number;
  results: EmailJobResult[];
}

export type QueueEventType =
  | 'start'
  | 'job_start'
  | 'job_done'
  | 'job_retry'
  | 'batch_pause'
  | 'delay_tick'
  | 'complete'
  | 'cancel';

export type QueueEventHandler = (status: QueueStatus) => void;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Phân loại lỗi không cần retry (lỗi vĩnh viễn) */
function isPermanentError(errMsg: string): boolean {
  const PERMANENT_PATTERNS = [
    /550/,           // mailbox not found
    /5\.1\.\d/,      // invalid recipient
    /invalid.*email/i,
    /user.*not.*found/i,
    /does not exist/i,
    /no such user/i,
  ];
  return PERMANENT_PATTERNS.some(p => p.test(errMsg));
}

/** Chờ N ms, resolve một phần mỗi 250ms để có thể phát tick event */
function delayWithTick(ms: number, onTick: (remaining: number) => void): Promise<void> {
  return new Promise(resolve => {
    let remaining = ms;
    const interval = setInterval(() => {
      remaining -= 250;
      if (remaining <= 0) {
        clearInterval(interval);
        onTick(0);
        resolve();
      } else {
        onTick(remaining);
      }
    }, 250);
  });
}

// ─── EmailQueue Class ─────────────────────────────────────────────────────────

export class EmailQueue {
  private queue: EmailJob[] = [];
  private status: QueueStatus = EmailQueue.makeInitialStatus();
  private listeners: Map<QueueEventType, QueueEventHandler[]> = new Map();
  private cancelFlag = false;

  private static makeInitialStatus(): QueueStatus {
    return {
      state: 'idle',
      total: 0,
      processed: 0,
      succeeded: 0,
      failed: 0,
      currentIndex: 0,
      batchIndex: 0,
      delayRemaining: 0,
      results: [],
    };
  }

  // ── Event API ──────────────────────────────────────────────────────────────

  on(event: QueueEventType, handler: QueueEventHandler) {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(handler);
    return this; // chainable
  }

  off(event: QueueEventType, handler: QueueEventHandler) {
    const handlers = this.listeners.get(event) ?? [];
    this.listeners.set(event, handlers.filter(h => h !== handler));
    return this;
  }

  private emit(event: QueueEventType) {
    const snapshot = { ...this.status, results: [...this.status.results] };
    (this.listeners.get(event) ?? []).forEach(h => h(snapshot));
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Xóa queue cũ và nạp danh sách jobs mới */
  load(jobs: EmailJob[]) {
    this.queue = [...jobs];
    this.status = {
      ...EmailQueue.makeInitialStatus(),
      total: jobs.length,
    };
    this.cancelFlag = false;
    return this;
  }

  /** Lấy snapshot trạng thái hiện tại */
  getStatus(): QueueStatus {
    return { ...this.status, results: [...this.status.results] };
  }

  /** Hủy queue đang chạy */
  cancel() {
    this.cancelFlag = true;
  }

  /**
   * Bắt đầu xử lý queue.
   * Promise resolve khi queue hoàn thành (completed hoặc cancelled).
   */
  async run(): Promise<QueueStatus> {
    if (this.status.state === 'running') {
      throw new Error('[EmailQueue] Queue đang chạy, không thể gọi run() lần nữa.');
    }

    this.cancelFlag = false;
    this.status.state = 'running';
    this.status.processed = 0;
    this.status.succeeded = 0;
    this.status.failed = 0;
    this.status.results = [];
    this.emit('start');

    for (let i = 0; i < this.queue.length; i++) {
      // ── Kiểm tra hủy ──────────────────────────────────────────────────────
      if (this.cancelFlag) {
        this.status.state = 'cancelled';
        this.emit('cancel');
        return this.getStatus();
      }

      const job = this.queue[i];
      this.status.currentIndex = i;
      this.status.batchIndex = i % BATCH_SIZE;
      this.emit('job_start');

      // ── Gửi có retry ──────────────────────────────────────────────────────
      let lastError = '';
      let succeeded = false;
      let attempts = 0;

      for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
        attempts = attempt + 1;

        if (attempt > 0) {
          // Exponential backoff trước khi retry
          const backoffMs = RETRY_BASE_MS * Math.pow(2, attempt - 1);
          this.status.state = 'paused';
          this.status.delayRemaining = backoffMs;
          this.emit('job_retry');

          await delayWithTick(backoffMs, remaining => {
            this.status.delayRemaining = remaining;
            this.emit('delay_tick');
          });
          this.status.state = 'running';
        }

        try {
          await job.send();
          succeeded = true;
          break; // thoát retry loop khi thành công
        } catch (err: unknown) {
          lastError = err instanceof Error ? err.message : String(err);
          // Nếu lỗi vĩnh viễn, không retry
          if (isPermanentError(lastError)) break;
        }
      }

      // ── Ghi kết quả ───────────────────────────────────────────────────────
      const result: EmailJobResult = {
        jobId: job.jobId,
        recipientName: job.recipientName,
        recipientEmail: job.recipientEmail,
        status: succeeded ? 'success' : 'failed',
        attempts,
        error: succeeded ? undefined : lastError,
        completedAt: new Date().toISOString(),
      };

      this.status.results.push(result);
      this.status.processed++;
      if (succeeded) this.status.succeeded++;
      else this.status.failed++;
      this.emit('job_done');

      // ── Batch pause sau mỗi BATCH_SIZE email ──────────────────────────────
      const isLastJob = i === this.queue.length - 1;
      const isBatchEnd = (i + 1) % BATCH_SIZE === 0;

      if (!isLastJob && isBatchEnd && !this.cancelFlag) {
        this.status.state = 'paused';
        this.status.delayRemaining = BATCH_PAUSE_MS;
        this.emit('batch_pause');

        await delayWithTick(BATCH_PAUSE_MS, remaining => {
          this.status.delayRemaining = remaining;
          this.emit('delay_tick');
        });
        this.status.state = 'running';
      } else if (!isLastJob && !this.cancelFlag) {
        // ── Delay thông thường giữa mỗi email ──────────────────────────────
        this.status.delayRemaining = SEND_DELAY_MS;

        await delayWithTick(SEND_DELAY_MS, remaining => {
          this.status.delayRemaining = remaining;
          this.emit('delay_tick');
        });
        this.status.delayRemaining = 0;
      }
    }

    // ── Kết thúc ──────────────────────────────────────────────────────────
    this.status.state = this.cancelFlag ? 'cancelled' : 'completed';
    this.status.delayRemaining = 0;
    this.emit(this.cancelFlag ? 'cancel' : 'complete');
    return this.getStatus();
  }
}

/**
 * Singleton instance dùng chung toàn app.
 * Mỗi lần gửi hàng loạt mới: gọi emailQueue.load(jobs) rồi emailQueue.run().
 */
export const emailQueue = new EmailQueue();
