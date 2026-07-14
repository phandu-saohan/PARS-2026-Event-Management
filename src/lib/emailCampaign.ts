/**
 * EmailCampaign — Quản lý chiến dịch gửi email nhiều đợt qua nhiều ngày
 *
 * Giải quyết bài toán: 8.000 email, 700/ngày → ~12 ngày
 *
 * Cơ chế:
 *  - Lưu trạng thái vào localStorage (bền vững qua browser session)
 *  - Mỗi ngày chỉ cho gửi 1 đợt (giới hạn bởi DAILY_LIMIT)
 *  - Sau khi gửi xong đợt hôm nay → lock 24h (dựa vào ngày, không phải giờ)
 *  - Tự động chia danh sách thành các batch theo dailyLimit
 *  - Lưu lịch sử từng đợt: ngày, số thành công, số thất bại
 *  - Email thất bại vĩnh viễn bị bỏ qua (không lặp lại)
 *  - Email thất bại tạm thời được đưa vào đợt kế tiếp
 */

const LS_KEY = 'pars_email_campaign_v1';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CampaignBatch {
  batchNo: number;        // Số thứ tự đợt (bắt đầu từ 1)
  date: string;           // Ngày gửi 'YYYY-MM-DD'
  attendeeIds: string[];  // IDs trong đợt này
  sent: number;           // Số email gửi thành công
  failed: number;         // Số email thất bại
  completedAt: string;    // ISO timestamp hoàn thành
}

export interface CampaignState {
  id: string;                // Unique campaign ID
  name: string;              // Tên chiến dịch
  templateId: string;        // Template email sử dụng
  allIds: string[];          // Toàn bộ attendee IDs ban đầu
  pendingIds: string[];      // IDs chưa gửi (chưa thành công)
  sentIds: string[];         // IDs đã gửi thành công
  permanentFailIds: string[]; // IDs lỗi vĩnh viễn (bỏ qua)
  dailyLimit: number;        // Số email tối đa/ngày
  batches: CampaignBatch[];  // Lịch sử các đợt đã gửi
  lastBatchDate: string | null; // Ngày gửi đợt cuối 'YYYY-MM-DD'
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  estimatedDays: number;     // Số ngày dự kiến hoàn thành
}

export interface CampaignStats {
  totalCount: number;
  sentCount: number;
  pendingCount: number;
  failedCount: number;
  batchesCompleted: number;
  estimatedDaysLeft: number;
  progressPercent: number;
  canSendToday: boolean;
  todayDate: string;
  nextBatchSize: number;
  nextBatchNo: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayString(): string {
  return new Date().toLocaleDateString('en-CA'); // 'YYYY-MM-DD'
}

function generateId(): string {
  return 'campaign-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
}

// ─── EmailCampaignManager ─────────────────────────────────────────────────────

export class EmailCampaignManager {

  // ── Tạo chiến dịch mới ────────────────────────────────────────────────────

  create(params: {
    name: string;
    templateId: string;
    allIds: string[];
    dailyLimit?: number;
  }): CampaignState {
    const dailyLimit = params.dailyLimit ?? 700;
    const campaign: CampaignState = {
      id: generateId(),
      name: params.name,
      templateId: params.templateId,
      allIds: [...params.allIds],
      pendingIds: [...params.allIds],
      sentIds: [],
      permanentFailIds: [],
      dailyLimit,
      batches: [],
      lastBatchDate: null,
      status: 'active',
      createdAt: new Date().toISOString(),
      estimatedDays: Math.ceil(params.allIds.length / dailyLimit),
    };
    this.save(campaign);
    return campaign;
  }

  // ── Load / Save từ localStorage ───────────────────────────────────────────

  load(): CampaignState | null {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as CampaignState;
    } catch {
      return null;
    }
  }

  save(campaign: CampaignState): void {
    localStorage.setItem(LS_KEY, JSON.stringify(campaign));
  }

  delete(): void {
    localStorage.removeItem(LS_KEY);
  }

  // ── Logic nghiệp vụ ───────────────────────────────────────────────────────

  /** Lấy danh sách IDs cho đợt hôm nay */
  getTodaysBatch(campaign: CampaignState): string[] {
    return campaign.pendingIds.slice(0, campaign.dailyLimit);
  }

  /** Kiểm tra có thể gửi hôm nay không */
  canSendToday(campaign: CampaignState): boolean {
    if (campaign.status !== 'active') return false;
    if (campaign.pendingIds.length === 0) return false;
    return campaign.lastBatchDate !== todayString();
  }

  /** Lấy thống kê chiến dịch */
  getStats(campaign: CampaignState): CampaignStats {
    const today = todayString();
    const canSend = this.canSendToday(campaign);
    const nextBatchIds = this.getTodaysBatch(campaign);
    const batchesCompleted = campaign.batches.length;
    const estimatedDaysLeft = Math.ceil(campaign.pendingIds.length / campaign.dailyLimit);

    return {
      totalCount: campaign.allIds.length,
      sentCount: campaign.sentIds.length,
      pendingCount: campaign.pendingIds.length,
      failedCount: campaign.permanentFailIds.length,
      batchesCompleted,
      estimatedDaysLeft,
      progressPercent: campaign.allIds.length > 0
        ? Math.round((campaign.sentIds.length / campaign.allIds.length) * 100)
        : 0,
      canSendToday: canSend,
      todayDate: today,
      nextBatchSize: nextBatchIds.length,
      nextBatchNo: batchesCompleted + 1,
    };
  }

  /**
   * Ghi nhận kết quả đợt gửi vừa hoàn thành.
   * @param campaign - trạng thái hiện tại
   * @param batchIds - danh sách IDs đã gửi trong đợt này
   * @param results - map từ attendeeId → 'success' | 'failed' | 'permanent_fail'
   */
  recordBatchResult(
    campaign: CampaignState,
    batchIds: string[],
    results: Record<string, 'success' | 'failed' | 'permanent_fail'>
  ): CampaignState {
    const today = todayString();
    let successCount = 0;
    let failCount = 0;

    const newSentIds = [...campaign.sentIds];
    const newPermanentFailIds = [...campaign.permanentFailIds];
    // IDs mà bị lỗi tạm thời sẽ giữ lại trong pendingIds (không bị xóa)
    const idsToRemoveFromPending = new Set<string>();

    for (const id of batchIds) {
      const result = results[id] ?? 'failed';
      if (result === 'success') {
        newSentIds.push(id);
        idsToRemoveFromPending.add(id);
        successCount++;
      } else if (result === 'permanent_fail') {
        newPermanentFailIds.push(id);
        idsToRemoveFromPending.add(id);
        failCount++;
      } else {
        // 'failed' (tạm thời) → giữ trong pending để thử lại đợt sau
        failCount++;
        idsToRemoveFromPending.add(id); // vẫn xóa khỏi đầu queue, thêm vào cuối
      }
    }

    // Tạm thời failed: đẩy xuống cuối pending queue
    const temporaryFailedIds = batchIds.filter(
      id => results[id] === 'failed'
    );

    const newPendingIds = [
      ...campaign.pendingIds.filter(id => !idsToRemoveFromPending.has(id)),
      ...temporaryFailedIds, // thêm vào cuối
    ];

    const batchRecord: CampaignBatch = {
      batchNo: campaign.batches.length + 1,
      date: today,
      attendeeIds: batchIds,
      sent: successCount,
      failed: failCount,
      completedAt: new Date().toISOString(),
    };

    const updated: CampaignState = {
      ...campaign,
      sentIds: newSentIds,
      pendingIds: newPendingIds,
      permanentFailIds: newPermanentFailIds,
      batches: [...campaign.batches, batchRecord],
      lastBatchDate: today,
      status: newPendingIds.length === 0 ? 'completed' : 'active',
    };

    this.save(updated);
    return updated;
  }

  /** Tạm dừng / tiếp tục chiến dịch */
  setPaused(campaign: CampaignState, paused: boolean): CampaignState {
    const updated = { ...campaign, status: paused ? 'paused' as const : 'active' as const };
    this.save(updated);
    return updated;
  }
}

/** Singleton instance */
export const campaignManager = new EmailCampaignManager();
