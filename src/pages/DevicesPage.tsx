import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { devicesApi, routesApi } from "../api/routes";
import type { Device, DevicePayload, RouteItem } from "../api/types";

type DeviceForm = {
  deviceId: string;
  routeId: string;
  carrierFirstName: string;
  carrierLastName: string;
  carrierPhone: string;
  status: boolean;
};

const EMPTY_FORM: DeviceForm = {
  deviceId: "",
  routeId: "",
  carrierFirstName: "",
  carrierLastName: "",
  carrierPhone: "",
  status: true,
};

function getDeviceForm(device?: Device): DeviceForm {
  if (!device) return EMPTY_FORM;
  return {
    deviceId: String(device.deviceId),
    routeId: device.routeId == null ? "" : String(device.routeId),
    carrierFirstName: device.carrierFirstName ?? "",
    carrierLastName: device.carrierLastName ?? "",
    carrierPhone: device.carrierPhone ?? "",
    status: device.status ?? true,
  };
}

function DeviceDialog({
  device,
  routes,
  onClose,
}: {
  device?: Device;
  routes: RouteItem[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => getDeviceForm(device));
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (payload: DevicePayload) =>
      device
        ? devicesApi.update(device.id, payload)
        : devicesApi.create(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-devices"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-routes"] }),
      ]);
      onClose();
    },
    onError: (cause) =>
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить устройство"),
  });

  const setField = <K extends keyof DeviceForm>(key: K, value: DeviceForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const deviceId = Number(form.deviceId);
    const routeId = Number(form.routeId);
    if (!Number.isSafeInteger(deviceId) || deviceId <= 0) {
      setError("Введите корректный ID устройства");
      return;
    }
    if (!Number.isInteger(routeId) || routeId <= 0) {
      setError("Выберите маршрут");
      return;
    }
    mutation.mutate({
      deviceId,
      routeId,
      carrierFirstName: form.carrierFirstName.trim(),
      carrierLastName: form.carrierLastName.trim(),
      carrierPhone: form.carrierPhone.trim(),
      status: form.status,
    });
  };

  const inputClass =
    "w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="device-dialog-title"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto border border-gray-800 bg-gray-900 p-5 shadow-2xl sm:rounded-lg"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="device-dialog-title" className="text-lg font-semibold">
            {device ? "Изменить устройство" : "Новое устройство"}
          </h2>
          <button type="button" title="Закрыть" onClick={onClose} className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5 text-sm text-gray-300">
            <span>ID устройства</span>
            <input
              autoFocus
              required
              min={1}
              type="number"
              value={form.deviceId}
              onChange={(event) => setField("deviceId", event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block space-y-1.5 text-sm text-gray-300">
            <span>Маршрут</span>
            <select
              required
              value={form.routeId}
              onChange={(event) => setField("routeId", event.target.value)}
              className={inputClass}
            >
              <option value="">Выберите маршрут</option>
              {routes.map((route) => (
                <option key={route.id} value={route.id}>
                  №{route.number} · {route.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm text-gray-300">
              <span>Имя перевозчика</span>
              <input value={form.carrierFirstName} onChange={(event) => setField("carrierFirstName", event.target.value)} className={inputClass} />
            </label>
            <label className="block space-y-1.5 text-sm text-gray-300">
              <span>Фамилия перевозчика</span>
              <input value={form.carrierLastName} onChange={(event) => setField("carrierLastName", event.target.value)} className={inputClass} />
            </label>
          </div>
          <label className="block space-y-1.5 text-sm text-gray-300">
            <span>Телефон перевозчика</span>
            <input type="tel" value={form.carrierPhone} onChange={(event) => setField("carrierPhone", event.target.value)} className={inputClass} />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={form.status}
              onChange={(event) => setField("status", event.target.checked)}
              className="size-4 accent-blue-500"
            />
            Устройство активно
          </label>
          {error && <p role="alert" className="rounded bg-red-950 px-3 py-2 text-sm text-red-300">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-gray-800 pt-4">
            <button type="button" onClick={onClose} className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">
              Отмена
            </button>
            <button type="submit" disabled={mutation.isPending} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">
              {mutation.isPending ? "Сохранение..." : device ? "Сохранить" : "Добавить"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function DevicesPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { deviceId: routeDeviceId } = useParams();
  const [search, setSearch] = useState("");
  const [dialogDevice, setDialogDevice] = useState<Device | null | undefined>(undefined);
  const devicesQuery = useQuery({ queryKey: ["admin-devices"], queryFn: devicesApi.list });
  const routesQuery = useQuery({ queryKey: ["admin-routes"], queryFn: routesApi.list });
  const devices = devicesQuery.data ?? [];
  const routes = routesQuery.data ?? [];
  const selectedDevice = routeDeviceId
    ? devices.find((device) => String(device.deviceId) === routeDeviceId)
    : undefined;
  const filteredDevices = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return devices;
    return devices.filter((device) => {
      const route = routes.find((item) => item.id === device.routeId);
      return [
        device.deviceId,
        device.carrierFirstName,
        device.carrierLastName,
        device.carrierPhone,
        route?.number,
        route?.name,
      ].some((value) => String(value ?? "").toLowerCase().includes(needle));
    });
  }, [devices, routes, search]);

  const deleteMutation = useMutation({
    mutationFn: devicesApi.remove,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-devices"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-routes"] }),
      ]);
      navigate("/devices");
    },
  });

  if (devicesQuery.isLoading || routesQuery.isLoading) {
    return <div className="flex items-center justify-center py-24 text-gray-400">Загрузка...</div>;
  }
  if (devicesQuery.error || routesQuery.error) {
    const error = devicesQuery.error ?? routesQuery.error;
    return <div role="alert" className="rounded-md bg-red-950 px-4 py-3 text-red-300">Ошибка: {error instanceof Error ? error.message : "Не удалось загрузить данные"}</div>;
  }

  if (routeDeviceId) {
    if (!selectedDevice) {
      return (
        <div className="space-y-4">
          <Link to="/devices" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"><ArrowLeft size={16} /> Все устройства</Link>
          <p className="py-12 text-center text-gray-400">Устройство с ID {routeDeviceId} не найдено</p>
        </div>
      );
    }
    const route = routes.find((item) => item.id === selectedDevice.routeId);
    const carrierName = [selectedDevice.carrierFirstName, selectedDevice.carrierLastName].filter(Boolean).join(" ");
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Link to="/devices" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"><ArrowLeft size={16} /> Все устройства</Link>
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-800 pb-5">
          <div>
            <p className="mb-1 text-xs font-medium uppercase text-gray-500">Устройство</p>
            <h1 className="font-mono text-2xl font-semibold">{selectedDevice.deviceId}</h1>
          </div>
          <div className="flex gap-2">
            <button type="button" title="Изменить устройство" onClick={() => setDialogDevice(selectedDevice)} className="inline-flex items-center gap-2 rounded-md border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:bg-gray-800"><Pencil size={15} /> Изменить</button>
            <button
              type="button"
              title="Удалить устройство"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (confirm(`Удалить устройство ${selectedDevice.deviceId}?`)) deleteMutation.mutate(selectedDevice.id);
              }}
              className="inline-flex items-center gap-2 rounded-md border border-red-900/70 px-3 py-2 text-sm text-red-300 hover:bg-red-950 disabled:opacity-50"
            ><Trash2 size={15} /> Удалить</button>
          </div>
        </div>
        {deleteMutation.error && <p role="alert" className="text-sm text-red-300">{deleteMutation.error instanceof Error ? deleteMutation.error.message : "Не удалось удалить устройство"}</p>}
        <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          <Detail label="Маршрут" value={route ? <Link to="/routes" className="text-blue-400 hover:underline">№{route.number} · {route.name}</Link> : "Не назначен"} />
          <Detail label="Статус" value={<span className={selectedDevice.status ? "text-emerald-400" : "text-gray-400"}>{selectedDevice.status ? "Активно" : "Неактивно"}</span>} />
          <Detail label="Перевозчик" value={carrierName || "—"} />
          <Detail label="Телефон" value={selectedDevice.carrierPhone || "—"} />
          <Detail label="Добавлено" value={selectedDevice.createdAt ? new Date(selectedDevice.createdAt).toLocaleString("ru-RU") : "—"} />
          <Detail label="Внутренний ID" value={selectedDevice.id} />
        </dl>
        {dialogDevice && <DeviceDialog device={dialogDevice} routes={routes} onClose={() => setDialogDevice(undefined)} />}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Устройства</h1>
          <p className="mt-1 text-sm text-gray-500">Всего: {devices.length}</p>
        </div>
        <button type="button" onClick={() => setDialogDevice(null)} className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">
          <Plus size={16} /> Добавить устройство
        </button>
      </div>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по ID, перевозчику, маршруту..." className="w-full rounded-md border border-gray-700 bg-gray-900 py-2 pl-9 pr-4 text-sm text-white outline-none placeholder:text-gray-500 focus:border-blue-500" />
      </div>
      <div className="overflow-x-auto rounded-md border border-gray-800">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-gray-800 bg-gray-900 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">ID устройства</th>
              <th className="px-4 py-3 font-medium">Маршрут</th>
              <th className="px-4 py-3 font-medium">Перевозчик</th>
              <th className="px-4 py-3 font-medium">Телефон</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredDevices.map((device) => {
              const route = routes.find((item) => item.id === device.routeId);
              const carrier = [device.carrierLastName, device.carrierFirstName].filter(Boolean).join(" ");
              return (
                <tr key={device.id} className="hover:bg-gray-900/70">
                  <td className="px-4 py-3 font-mono"><Link to={`/devices/${device.deviceId}`} className="text-blue-400 hover:underline">{device.deviceId}</Link></td>
                  <td className="px-4 py-3">{route ? <Link to="/routes" className="text-gray-200 hover:text-blue-400">№{route.number} · {route.name}</Link> : <span className="text-gray-500">—</span>}</td>
                  <td className="px-4 py-3">{carrier || <span className="text-gray-500">—</span>}</td>
                  <td className="px-4 py-3">{device.carrierPhone || <span className="text-gray-500">—</span>}</td>
                  <td className="px-4 py-3"><span className={device.status ? "text-emerald-400" : "text-gray-500"}>{device.status ? "Активно" : "Неактивно"}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button type="button" title="Изменить" onClick={() => setDialogDevice(device)} className="rounded p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"><Pencil size={15} /></button>
                      <button type="button" title="Удалить" onClick={() => {
                        if (confirm(`Удалить устройство ${device.deviceId}?`)) deleteMutation.mutate(device.id);
                      }} className="rounded p-1.5 text-gray-500 hover:bg-red-950 hover:text-red-300"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredDevices.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Устройства не найдены</td></tr>}
          </tbody>
        </table>
      </div>
      {dialogDevice !== undefined && <DeviceDialog device={dialogDevice ?? undefined} routes={routes} onClose={() => setDialogDevice(undefined)} />}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b border-gray-800 pb-3">
      <dt className="mb-1 text-xs uppercase text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-100">{value}</dd>
    </div>
  );
}