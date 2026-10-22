import { PushNotification } from '../types';
import { sound } from './sound';

type ToastListener = (notification: PushNotification) => void;

class NotificationService {
  private listeners: Set<ToastListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private hasRequestedPermission: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('yizhen_shanhai_realtime');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'PUSH_NOTIFICATION') {
            this.dispatchLocal(event.data.payload, false);
          }
        };
      } catch {
        // Fallback gracefully
      }
    }
  }

  public getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  public async requestPushPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    this.hasRequestedPermission = true;
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return 'denied';
    }
  }

  public subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public sendPushNotification(notification: Omit<PushNotification, 'id' | 'createdAt' | 'read'>) {
    const fullNotification: PushNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
      read: false,
    };

    // 1. Play audio chime
    sound.playNotification();

    // 2. Dispatch to local toast listeners
    this.dispatchLocal(fullNotification, true);

    // 3. Broadcast to other open browser tabs
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'PUSH_NOTIFICATION',
          payload: fullNotification,
        });
      } catch {
        // Ignore
      }
    }

    // 4. Trigger Native Web Push if granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const nativeNotif = new Notification(fullNotification.title, {
          body: fullNotification.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: fullNotification.id,
        });
        nativeNotif.onclick = () => {
          window.focus();
        };
      } catch {
        // In iframe or sandboxed environments, native notification might throw
      }
    }

    return fullNotification;
  }

  private dispatchLocal(notif: PushNotification, saveToStorage: boolean = true) {
    if (saveToStorage && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('shanhai_notifications');
        const list: PushNotification[] = stored ? JSON.parse(stored) : [];
        const updated = [notif, ...list.slice(0, 49)];
        localStorage.setItem('shanhai_notifications', JSON.stringify(updated));
      } catch {
        // LocalStorage quota or access error
      }
    }

    this.listeners.forEach((fn) => {
      try {
        fn(notif);
      } catch {
        // Safe dispatch
      }
    });
  }

  public getStoredNotifications(): PushNotification[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem('shanhai_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  public markAsRead(id: string) {
    if (typeof window === 'undefined') return;
    try {
      const list = this.getStoredNotifications();
      const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem('shanhai_notifications', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }

  public markAllAsRead() {
    if (typeof window === 'undefined') return;
    try {
      const list = this.getStoredNotifications();
      const updated = list.map((n) => ({ ...n, read: true }));
      localStorage.setItem('shanhai_notifications', JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }
}

export const notificationService = new NotificationService();
