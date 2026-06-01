export interface AdminUser {
  id: number;
  phone: string;
  deviceId: string | null;
  trialExpireAt: string;
  preferredPaymentMethod: string;
  isBlocked: boolean;
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

export interface Device {
  id: number;
  deviceId: number;
  status: boolean | null;
  createdAt: string;
}

export interface CreateRoutePayload {
  number: number;
  name: string;
  deviceId: number;
  carrier_first_name: string;
  carrier_last_name: string;
  carrier_phone: string;
}
