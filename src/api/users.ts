import { api } from "./client";
import type { AdminUser } from "./types";

export const usersApi = {
  list: () => api.get<AdminUser[]>("/admin/users"),
  toggleBlock: (id: number, isBlocked: boolean) =>
    api.patch<AdminUser>(`/admin/users/${id}/block`, { isBlocked }),
};
