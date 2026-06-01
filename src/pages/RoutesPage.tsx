import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
} from "@tanstack/react-table";
import {
    ChevronDown,
    ChevronUp,
    ChevronsUpDown,
    Plus,
    Search,
    Trash2,
    X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { routesApi } from "../api/routes";
import type { CreateRoutePayload, RouteItem } from "../api/types";

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ChevronUp size={14} />;
  if (sorted === "desc") return <ChevronDown size={14} />;
  return <ChevronsUpDown size={14} className="opacity-40" />;
}

// ─── Add Route Dialog ─────────────────────────────────────────────────────────

interface AddRouteDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddRouteDialog({ onClose, onSuccess }: AddRouteDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<CreateRoutePayload>({
    number: 0,
    name: "",
    deviceId: 0,
    carrier_first_name: "",
    carrier_last_name: "",
    carrier_phone: "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: routesApi.create,
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (e) =>
      setFormError(e instanceof Error ? e.message : "Ошибка создания"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim()) return setFormError("Введите название маршрута");
    if (!form.number) return setFormError("Введите номер маршрута");
    if (!form.deviceId) return setFormError("Введите ID устройства");
    if (!form.carrier_first_name.trim()) return setFormError("Введите имя перевозчика");
    if (!form.carrier_last_name.trim()) return setFormError("Введите фамилию перевозчика");
    if (!form.carrier_phone.trim()) return setFormError("Введите номер телефона перевозчика");
    mutate(form);
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="w-full max-w-md rounded-t-2xl bg-gray-900 p-6 shadow-2xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Новый маршрут</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Номер маршрута
            </label>
            <input
              type="number"
              min={1}
              value={form.number || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, number: Number(e.target.value) }))
              }
              placeholder="Например: 42"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Название маршрута
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              placeholder="Например: Вокзал — Аэропорт"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              ID устройства (device_id)
            </label>
            <input
              type="number"
              min={1}
              value={form.deviceId || ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, deviceId: Number(e.target.value) }))
              }
              placeholder="Например: 072109952416"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Имя перевозчика
            </label>
            <input
              type="text"
              value={form.carrier_first_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, carrier_first_name: e.target.value }))
              }
              placeholder="Например: Иван"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Фамилия перевозчика
            </label>
            <input
              type="text"
              value={form.carrier_last_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, carrier_last_name: e.target.value }))
              }
              placeholder="Например: Иванов"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Телефон перевозчика
            </label>
            <input
              type="tel"
              value={form.carrier_phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, carrier_phone: e.target.value }))
              }
              placeholder="Например: +7 900 000-00-00"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white placeholder-gray-500 outline-none focus:border-blue-500"
            />
          </div>

          {formError && (
            <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-400">
              {formError}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-700 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-gray-800"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
            >
              {isPending ? "Создаём..." : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── RoutesPage ───────────────────────────────────────────────────────────────

export default function RoutesPage() {
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin-routes"],
    queryFn: routesApi.list,
  });

  const filteredData = useMemo(() => {
    const search = globalFilter.toLowerCase().trim();
    if (!search) return data;
    return data.filter(
      (r) =>
        String(r.number).includes(search) ||
        r.name.toLowerCase().includes(search) ||
        (r.carrier_last_name ?? "").toLowerCase().includes(search) ||
        (r.carrier_first_name ?? "").toLowerCase().includes(search) ||
        (r.carrier_phone ?? "").includes(search) ||
        r.deviceIds.some((id) => String(id).includes(search)),
    );
  }, [data, globalFilter]);

  const { mutate: removeRoute } = useMutation({
    mutationFn: routesApi.remove,
    onSuccess: (_, id) =>
      queryClient.setQueryData<RouteItem[]>(["admin-routes"], (prev) =>
        prev?.filter((r) => r.id !== id),
      ),
  });

  const columns = useMemo<ColumnDef<RouteItem>[]>(
    () => [
      { accessorKey: "number", header: "№", size: 60 },
      { accessorKey: "name", header: "Название" },
      {
        id: "carrier",
        header: "Перевозчик",
        cell: ({ row }) => {
          const r = row.original;
          const name = [r.carrier_last_name, r.carrier_first_name]
            .filter(Boolean)
            .join(" ");
          if (!name && !r.carrier_phone)
            return <span className="text-gray-500">—</span>;
          return (
            <div className="flex flex-col gap-0.5">
              {name && <span className="font-medium text-white">{name}</span>}
              {r.carrier_phone && (
                <a
                  href={`tel:${r.carrier_phone}`}
                  className="text-xs text-blue-400 hover:underline"
                >
                  {r.carrier_phone}
                </a>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "deviceIds",
        header: "Устройства",
        cell: ({ getValue }) => {
          const ids = getValue<number[]>();
          if (!ids.length) return <span className="text-gray-500">—</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {ids.map((id) => (
                <span
                  key={id}
                  className="rounded bg-blue-900/40 px-1.5 py-0.5 font-mono text-xs text-blue-400"
                >
                  {id}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 60,
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => {
              if (confirm(`Удалить маршрут №${row.original.number}?`)) {
                removeRoute(row.original.id);
              }
            }}
            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-red-900/30 hover:text-red-400"
          >
            <Trash2 size={16} />
          </button>
        ),
      },
    ],
    [removeRoute],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        Загрузка...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-900/30 px-4 py-3 text-red-400">
        Ошибка: {error instanceof Error ? error.message : "Неизвестная ошибка"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold">Маршруты и устройства</h1>
        <button
          type="button"
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          <Plus size={16} />
          Новый маршрут
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Поиск по номеру, названию, ID устройства..."
          className="w-full rounded-lg border border-gray-700 bg-gray-900 py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 outline-none focus:border-blue-500"
        />
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-800 md:block">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-800 bg-gray-900">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400"
                  >
                    {header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="flex items-center gap-1"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        <SortIcon sorted={header.column.getIsSorted()} />
                      </button>
                    ) : (
                      flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-800">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-gray-800/40">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-gray-200">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 text-center text-gray-500"
                >
                  Маршруты не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {table.getRowModel().rows.length === 0 ? (
          <p className="py-10 text-center text-gray-500">
            Маршруты не найдены
          </p>
        ) : (
          table.getRowModel().rows.map((row) => {
            const r = row.original;
            return (
              <div
                key={r.id}
                className="rounded-xl border border-gray-800 bg-gray-900 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-white">
                      <span className="mr-2 rounded bg-blue-900/40 px-1.5 py-0.5 text-xs text-blue-400">
                        №{r.number}
                      </span>
                      {r.name}
                    </p>
                    {(r.carrier_first_name || r.carrier_last_name || r.carrier_phone) && (
                      <div className="mt-1.5">
                        {(r.carrier_first_name || r.carrier_last_name) && (
                          <p className="text-xs text-gray-300">
                            {[r.carrier_last_name, r.carrier_first_name]
                              .filter(Boolean)
                              .join(" ")}
                          </p>
                        )}
                        {r.carrier_phone && (
                          <a
                            href={`tel:${r.carrier_phone}`}
                            className="text-xs text-blue-400 hover:underline"
                          >
                            {r.carrier_phone}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Удалить маршрут №${r.number}?`)) {
                        removeRoute(r.id);
                      }
                    }}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-red-900/30 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                {r.deviceIds.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {r.deviceIds.map((id) => (
                      <span
                        key={id}
                        className="rounded bg-blue-900/40 px-1.5 py-0.5 font-mono text-xs text-blue-400"
                      >
                        {id}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-center justify-between gap-3 text-sm text-gray-400 sm:flex-row">
        <span>
          Страница {table.getState().pagination.pageIndex + 1} из{" "}
          {table.getPageCount()}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs transition hover:bg-gray-800 disabled:opacity-40"
          >
            ← Назад
          </button>
          <button
            type="button"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            className="rounded-lg border border-gray-700 px-3 py-1.5 text-xs transition hover:bg-gray-800 disabled:opacity-40"
          >
            Вперёд →
          </button>
        </div>
      </div>

      {/* Dialog */}
      {showDialog && (
        <AddRouteDialog
          onClose={() => setShowDialog(false)}
          onSuccess={() =>
            queryClient.invalidateQueries({ queryKey: ["admin-routes"] })
          }
        />
      )}
    </div>
  );
}
