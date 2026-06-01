import { api } from "./client";
import type { CreateRoutePayload, Device, RouteItem } from "./types";

export const routesApi = {
  list: () => api.get<RouteItem[]>("/admin/routes"),
  create: (payload: CreateRoutePayload) =>
    api.post<RouteItem>("/admin/routes", payload),
  remove: (id: number) => api.delete<void>(`/admin/routes/${id}`),
};

export const devicesApi = {
  list: () => api.get<Device[]>("/admin/devices"),
};
