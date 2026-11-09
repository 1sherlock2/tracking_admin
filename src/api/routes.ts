import { api } from "./client";
import type { CreateRoutePayload, Device, DevicePayload, RouteItem } from "./types";

export const routesApi = {
  list: () => api.get<RouteItem[]>("/admin/routes"),
  create: (payload: CreateRoutePayload) =>
    api.post<RouteItem>("/admin/routes", payload),
  remove: (id: number) => api.delete<void>(`/admin/routes/${id}`),
  removeMany: (ids: number[]) => api.delete<void>("/admin/routes", { ids }),
};

export const devicesApi = {
  list: () => api.get<Device[]>("/admin/devices"),
  create: (payload: DevicePayload) => api.post<Device>("/admin/devices", payload),
  update: (id: number, payload: Partial<DevicePayload>) =>
    api.patch<Device>(`/admin/devices/${id}`, payload),
  remove: (id: number) => api.delete<void>(`/admin/devices/${id}`),
};
