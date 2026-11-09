import { api } from "./client";
import type {
    CreateRoutePayload,
    Device,
    DevicePayload,
    RouteGeometryItem,
    RouteItem,
    UpdateRouteGeometryPayload,
} from "./types";

export const routesApi = {
  list: () => api.get<RouteItem[]>("/admin/routes"),
  create: (payload: CreateRoutePayload) =>
    api.post<RouteItem>("/admin/routes", payload),
  remove: (id: number) => api.delete<void>(`/admin/routes/${id}`),
  removeMany: (ids: number[]) => api.delete<void>("/admin/routes", { ids }),
  getGeometry: (id: number) =>
    api.get<RouteGeometryItem>(`/admin/routes/${id}/geometry`),
  updateGeometry: (id: number, payload: UpdateRouteGeometryPayload) =>
    api.patch<RouteGeometryItem>(`/admin/routes/${id}/geometry`, payload),
  removeGeometry: (id: number) =>
    api.delete<void>(`/admin/routes/${id}/geometry`),
};

export const devicesApi = {
  list: () => api.get<Device[]>("/admin/devices"),
  create: (payload: DevicePayload) => api.post<Device>("/admin/devices", payload),
  update: (id: number, payload: Partial<DevicePayload>) =>
    api.patch<Device>(`/admin/devices/${id}`, payload),
  remove: (id: number) => api.delete<void>(`/admin/devices/${id}`),
};
