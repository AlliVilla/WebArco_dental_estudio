import api from '../../../services/api';
import type { ApiResponse } from '../../../types/api';
import type {
  CreateInventoryItemInput,
  CreateInventoryMovementInput,
  InventoryItem,
  InventoryListResponse,
  InventoryMovement,
  InventoryStats,
} from '../types';

export const inventoryService = {
  getAll: async (params?: {
    search?: string;
    categoria?: string;
    estado?: string;
    estadoRegistro?: string;
  }): Promise<ApiResponse<InventoryListResponse>> => {
    return api.get('/inventory', { params }) as Promise<ApiResponse<InventoryListResponse>>;
  },

  getStats: async (): Promise<ApiResponse<InventoryStats>> => {
    return api.get('/inventory/stats') as Promise<ApiResponse<InventoryStats>>;
  },

  create: async (data: CreateInventoryItemInput): Promise<ApiResponse<InventoryItem>> => {
    return api.post('/inventory', data) as Promise<ApiResponse<InventoryItem>>;
  },

  update: async (id: number, data: Partial<CreateInventoryItemInput>): Promise<ApiResponse<InventoryItem>> => {
    return api.put(`/inventory/${id}`, data) as Promise<ApiResponse<InventoryItem>>;
  },

  delete: async (id: number): Promise<ApiResponse<{ id_insumo: number; message: string }>> => {
    return api.delete(`/inventory/${id}`) as Promise<ApiResponse<{ id_insumo: number; message: string }>>;
  },

  restore: async (id: number): Promise<ApiResponse<InventoryItem & { message: string }>> => {
    return api.patch(`/inventory/${id}/restore`) as Promise<ApiResponse<InventoryItem & { message: string }>>;
  },

  getMovements: async (): Promise<ApiResponse<InventoryMovement[]>> => {
    return api.get('/inventory/movements') as Promise<ApiResponse<InventoryMovement[]>>;
  },

  createMovement: async (data: CreateInventoryMovementInput): Promise<ApiResponse<InventoryMovement>> => {
    return api.post('/inventory/movements', data) as Promise<ApiResponse<InventoryMovement>>;
  },
};

export default inventoryService;
