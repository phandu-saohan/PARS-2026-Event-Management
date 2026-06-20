/**
 * Real-time Notifications module using Supabase Realtime (WebSockets)
 * Hỗ trợ push notification thời gian thực giữa các máy trạm quản trị và đăng ký
 */
import { supabase, isSupabaseConfigured } from './supabase';

export interface RealtimeNotification {
  id: string;
  title: string;
  message: string;
  category: 'info' | 'success' | 'warning' | 'system' | 'badge';
  timestamp: string;
  read: boolean;
}

let localNotifications: RealtimeNotification[] = [];

/**
 * Đăng ký lắng nghe thông báo đẩy thời gian thực
 */
export function subscribeToNotifications(
  onNotification: (notif: RealtimeNotification) => void,
  onHistory?: (history: RealtimeNotification[]) => void
) {
  // Load local history from localStorage
  try {
    const stored = localStorage.getItem('pars_push_notifications');
    if (stored) {
      localNotifications = JSON.parse(stored);
      if (onHistory) onHistory(localNotifications);
    }
  } catch (e) {
    console.error('Error loading notification history:', e);
  }

  // Handle local fallback events (single-tab)
  const handleLocalNotif = (e: Event) => {
    const notif = (e as CustomEvent).detail as RealtimeNotification;
    onNotification(notif);
  };

  const handleLocalClear = () => {
    if (onHistory) onHistory([]);
  };

  window.addEventListener('local-notification', handleLocalNotif);
  window.addEventListener('local-clear-notifications', handleLocalClear);

  // Setup BroadcastChannel for cross-tab local communication
  let bc: BroadcastChannel | null = null;
  try {
    bc = new BroadcastChannel('pars-notifications-local');
    bc.onmessage = (event) => {
      if (event.data && event.data.type === 'clear') {
        localNotifications = [];
        localStorage.setItem('pars_push_notifications', JSON.stringify([]));
        if (onHistory) onHistory([]);
      } else {
        const notif = event.data as RealtimeNotification;
        if (!localNotifications.some(n => n.id === notif.id)) {
          localNotifications = [notif, ...localNotifications].slice(0, 50);
          localStorage.setItem('pars_push_notifications', JSON.stringify(localNotifications));
        }
        onNotification(notif);
      }
    };
  } catch (e) {
    console.error('Error setting up BroadcastChannel in listener:', e);
  }

  if (!isSupabaseConfigured()) {
    return () => {
      window.removeEventListener('local-notification', handleLocalNotif);
      window.removeEventListener('local-clear-notifications', handleLocalClear);
      if (bc) bc.close();
    };
  }

  // Connect to Supabase Realtime channel
  const channel = supabase.channel('pars-notifications');

  channel
    .on('broadcast', { event: 'new-notification' }, (payload) => {
      const notif = payload.payload as RealtimeNotification;
      // Append to history
      if (!localNotifications.some(n => n.id === notif.id)) {
        localNotifications = [notif, ...localNotifications].slice(0, 50);
        localStorage.setItem('pars_push_notifications', JSON.stringify(localNotifications));
      }
      onNotification(notif);
    })
    .on('broadcast', { event: 'clear-notifications' }, () => {
      localNotifications = [];
      localStorage.setItem('pars_push_notifications', JSON.stringify([]));
      if (onHistory) onHistory([]);
    })
    .subscribe((status) => {
      console.log('Supabase Realtime subscription status:', status);
    });

  return () => {
    window.removeEventListener('local-notification', handleLocalNotif);
    window.removeEventListener('local-clear-notifications', handleLocalClear);
    if (bc) bc.close();
    supabase.removeChannel(channel);
  };
}

/**
 * Gửi thông báo đẩy thời gian thực tới tất cả các máy trạm đang mở
 */
export async function sendRealtimeNotification(
  title: string,
  message: string,
  category: 'info' | 'success' | 'warning' | 'system' | 'badge' = 'info'
): Promise<boolean> {
  const notif: RealtimeNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title,
    message,
    category,
    timestamp: new Date().toISOString(),
    read: false,
  };

  // Add to local history
  localNotifications = [notif, ...localNotifications].slice(0, 50);
  localStorage.setItem('pars_push_notifications', JSON.stringify(localNotifications));

  // Dispatch via BroadcastChannel for multi-tab local communication
  try {
    const bc = new BroadcastChannel('pars-notifications-local');
    bc.postMessage(notif);
    setTimeout(() => {
      bc.close();
    }, 50);
  } catch (e) {
    console.error('Error broadcasting via BroadcastChannel:', e);
  }

  // Local event dispatch (single-tab)
  const event = new CustomEvent('local-notification', { detail: notif });
  window.dispatchEvent(event);

  // Trigger OneSignal push notification and await it to prevent browser cancelling the request on component unmount
  try {
    const res = await fetch('/api/onesignal/send-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, message }),
    });
    const data = await res.json();
    console.log('[OneSignal] background push status:', data);
  } catch (e) {
    console.error('Error triggering OneSignal push:', e);
  }

  if (!isSupabaseConfigured()) {
    return true;
  }

  return new Promise<boolean>((resolve) => {
    const channel = supabase.channel('pars-notifications');

    const triggerBroadcast = async () => {
      try {
        const res = await channel.send({
          type: 'broadcast',
          event: 'new-notification',
          payload: notif,
        });
        console.log('Supabase Realtime broadcast sent:', res);
        resolve(true);
      } catch (err) {
        console.error('Error in channel.send:', err);
        resolve(false);
      }
    };

    const isSubscribed = (channel as any).state === 'joined' || (channel as any).status === 'joined';

    if (isSubscribed) {
      triggerBroadcast();
    } else {
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await triggerBroadcast();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Supabase Realtime subscribe failed:', status);
          resolve(false);
        }
      });
    }

    // Set a safety timeout of 3.5 seconds
    setTimeout(() => {
      resolve(false);
    }, 3500);
  });
}

/**
 * Xóa lịch sử thông báo đẩy
 */
export async function clearServerNotifications(): Promise<boolean> {
  localNotifications = [];
  localStorage.setItem('pars_push_notifications', JSON.stringify([]));
  
  // Local event dispatch
  window.dispatchEvent(new CustomEvent('local-clear-notifications'));
  
  // Dispatch via BroadcastChannel for multi-tab
  try {
    const bc = new BroadcastChannel('pars-notifications-local');
    bc.postMessage({ type: 'clear' });
    setTimeout(() => bc.close(), 50);
  } catch (e) {
    console.error(e);
  }

  if (!isSupabaseConfigured()) {
    return true;
  }

  return new Promise<boolean>((resolve) => {
    const channel = supabase.channel('pars-notifications');
    const isSubscribed = (channel as any).state === 'joined' || (channel as any).status === 'joined';

    const triggerClear = async () => {
      try {
        await channel.send({
          type: 'broadcast',
          event: 'clear-notifications',
          payload: {},
        });
        resolve(true);
      } catch (err) {
        console.error('Error clearing via Supabase:', err);
        resolve(false);
      }
    };

    if (isSubscribed) {
      triggerClear();
    } else {
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await triggerClear();
        } else {
          resolve(false);
        }
      });
    }

    setTimeout(() => resolve(false), 3000);
  });
}
