import { api } from "./client";
import type { AdminUser } from "./types";

export const usersApi = {
  list: () => api.get<AdminUser[]>("/admin/users"),
  toggleBlock: (id: number, isBlocked: boolean) =>
    api.patch<AdminUser>(`/admin/users/${id}/block`, { isBlocked }),
  changePhone: (id: number, phone: string) =>
    api.patch<AdminUser>(`/admin/users/${id}/phone`, { phone }),
  addAuthPhone: (id: number, authPhone: string) =>
    api.post<AdminUser>(`/admin/users/${id}/auth-phone`, { authPhone }),
  updateAuthPhone: (id: number, authPhone: string) =>
    api.patch<AdminUser>(`/admin/users/${id}/auth-phone`, { authPhone }),
  deleteAuthPhone: (id: number) =>
    api.delete<AdminUser>(`/admin/users/${id}/auth-phone`),
};
