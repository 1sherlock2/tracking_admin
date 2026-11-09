import { api } from "./client";
import type { AuthPhone } from "./types";

export const authPhoneApi = {
  list: () => api.get<AuthPhone[]>("/admin/auth/get_all_auth_phones"),
  create: (phone: string) =>
    api.post<AuthPhone>("/admin/auth/add_auth_phone", { phone }),
  update: (id: number, phone: string) =>
    api.patch<AuthPhone>(`/admin/auth/update_auth_phone/${id}`, { phone }),
  delete: (id: number) =>
    api.delete<AuthPhone[]>(`/admin/auth/delete_auth_phone/${id}`),
};
