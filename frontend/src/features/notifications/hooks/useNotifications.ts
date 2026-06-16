import { create } from 'zustand';
import { notificationService } from '../services/notificationService';
import type {
  Notificacion,
  ConfiguracionNotificaciones,
} from '../types';

interface NotificationState {
  notifications: Notificacion[];
  total: number;
  page: number;
  totalPages: number;
  unreadCount: number;
  order: 'asc' | 'desc';
  config: ConfiguracionNotificaciones;
  latestNew: Notificacion | null; // para el toast
  isLoading: boolean;
  isSavingConfig: boolean;

  // Actions
  fetchNotifications: (page?: number, order?: 'asc' | 'desc') => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchConfig: () => Promise<void>;
  saveConfig: (config: Pick<ConfiguracionNotificaciones, 'minutos_anticipacion' | 'email_notificaciones'>) => Promise<void>;
  clearToast: () => void;
  setOrder: (order: 'asc' | 'desc') => void;
  startPolling: () => () => void;
}

const DEFAULT_CONFIG: ConfiguracionNotificaciones = {
  id_usuario: 0,
  minutos_anticipacion: 60,
  email_notificaciones: true,
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  total: 0,
  page: 1,
  totalPages: 1,
  unreadCount: 0,
  order: 'desc',
  config: DEFAULT_CONFIG,
  latestNew: null,
  isLoading: false,
  isSavingConfig: false,

  fetchNotifications: async (page = 1, order?: 'asc' | 'desc') => {
    const currentOrder = order ?? get().order;
    set({ isLoading: true });
    try {
      const res = await notificationService.getNotificaciones(page, 10, currentOrder);
      if (res.success && res.data) {
        const incoming = res.data.notificaciones;
        const prevIds = new Set(get().notifications.map((n) => n.id));

        // Detectar nuevas notificaciones no leídas para el toast
        const newUnread = incoming.find((n) => !n.leida && !prevIds.has(n.id));

        set({
          notifications: incoming,
          total: res.data.total,
          page: res.data.page,
          totalPages: res.data.totalPages,
          unreadCount: res.data.unreadCount,
          order: currentOrder,
          latestNew: newUnread ?? get().latestNew,
          isLoading: false,
        });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: number) => {
    await notificationService.markAsRead(id);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, leida: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: async () => {
    await notificationService.markAllAsRead();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, leida: true })),
      unreadCount: 0,
    }));
  },

  fetchConfig: async () => {
    try {
      const res = await notificationService.getConfig();
      if (res.success && res.data) {
        set({ config: res.data });
      }
    } catch {
      // fallback to defaults
    }
  },

  saveConfig: async (config) => {
    set({ isSavingConfig: true });
    try {
      const res = await notificationService.updateConfig(config);
      if (res.success && res.data) {
        set({ config: res.data });
      }
    } finally {
      set({ isSavingConfig: false });
    }
  },

  clearToast: () => set({ latestNew: null }),

  setOrder: (order) => {
    get().fetchNotifications(1, order);
  },

  startPolling: () => {
    // Initial fetch
    get().fetchNotifications(1);
    get().fetchConfig();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      get().fetchNotifications(get().page, get().order);
    }, 30_000);

    return () => clearInterval(interval);
  },
}));
