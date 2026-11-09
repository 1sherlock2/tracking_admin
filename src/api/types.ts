export interface AdminUser {
  id: number;
  phone: string;
  authPhone: string | null;
  deviceId: string | null;
  trialExpireAt: string;
  preferredPaymentMethod: string;
  isBlocked: boolean;
  createdAt: string;
}

export interface AuthPhone {
  id: number;
  phone: string;
  createdAt: string;
}

export interface RouteItem {
  id: number;
  number: number;
  name: string;
  deviceIds: number[];
  busCount: number;
  carrier_first_name: string;
  carrier_last_name: string;
  carrier_phone: string;
}

export type RouteGeometry =
  | { type: "LineString"; coordinates: number[][] }
  | { type: "MultiLineString"; coordinates: number[][][] };

export interface RouteGeometryItem {
  id: number;
  number: number;
  name: string;
  color: string;
  geometry: RouteGeometry | null;
}

export interface UpdateRouteGeometryPayload {
  geometry: Extract<RouteGeometry, { type: "MultiLineString" }>;
  color: string;
}

export interface Device {
  id: number;
  deviceId: number;
  routeId: number | null;
  carrierFirstName: string | null;
  carrierLastName: string | null;
  carrierPhone: string | null;
  status: boolean | null;
  createdAt: string;
}

export interface DevicePayload {
  deviceId: number;
  routeId: number;
  carrierFirstName?: string;
  carrierLastName?: string;
  carrierPhone?: string;
  status?: boolean;
}

export interface CreateRoutePayload {
  number: number;
  name: string;
  deviceId?: number;
  carrier_first_name: string;
  carrier_last_name: string;
  carrier_phone: string;
}
