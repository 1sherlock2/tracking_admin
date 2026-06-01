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
import { ChevronDown, ChevronUp, ChevronsUpDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { AdminUser } from "../api/types";
import { usersApi } from "../api/users";

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ChevronUp size={14} />;
  if (sorted === "desc") return <ChevronDown size={14} />;
  return <ChevronsUpDown size={14} className="opacity-40" />;
}

function BlockButton({
  user,
  onToggle,
}: {
  user: AdminUser;
  onToggle: (id: number, blocked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(user.id, !user.isBlocked)}
      className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
        user.isBlocked
          ? "bg-green-700/30 text-green-400 hover:bg-green-700/50"
          : "bg-red-700/30 text-red-400 hover:bg-red-700/50"
      }`}
    >
      {user.isBlocked ? "Разблокировать" : "Заблокировать"}
    </button>
  );
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: usersApi.list,
  });

  const { mutate: toggleBlock } = useMutation({
    mutationFn: ({ id, isBlocked }: { id: number; isBlocked: boolean }) =>
      usersApi.toggleBlock(id, isBlocked),
    onSuccess: (updated) => {
      queryClient.setQueryData<AdminUser[]>(["admin-users"], (prev) =>
        prev?.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)),
      );
    },
  });

  const columns = useMemo<ColumnDef<AdminUser>[]>(
    () => [
      { accessorKey: "id", header: "ID", size: 60 },
      { accessorKey: "phone", header: "Телефон" },
      {
        accessorKey: "deviceId",
        header: "Устройство",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs text-gray-400">
            {getValue<string | null>() ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "trialExpireAt",
        header: "Пробный до",
        cell: ({ getValue }) =>
          new Date(getValue<string>()).toLocaleDateString("ru-RU"),
      },
      {
        accessorKey: "preferredPaymentMethod",
        header: "Оплата",
        cell: ({ getValue }) => (
          <span className="rounded bg-gray-800 px-1.5 py-0.5 text-xs">
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "isBlocked",
        header: "Статус",
        cell: ({ getValue }) => {
          const blocked = getValue<boolean>();
          return (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                blocked
                  ? "bg-red-900/40 text-red-400"
                  : "bg-green-900/40 text-green-400"
              }`}
            >
              {blocked ? "Заблокирован" : "Активен"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <BlockButton
            user={row.original}
            onToggle={(id, isBlocked) => toggleBlock({ id, isBlocked })}
          />
        ),
      },
    ],
    [toggleBlock],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
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
        <h1 className="text-xl font-bold">Пользователи</h1>
        <span className="text-sm text-gray-400">Всего: {data.length}</span>
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
          placeholder="Поиск по телефону, устройству..."
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
                        <SortIcon
                          sorted={header.column.getIsSorted()}
                        />
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
              <tr
                key={row.id}
                className="transition-colors hover:bg-gray-800/40"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-gray-200">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {table.getRowModel().rows.map((row) => {
          const u = row.original;
          return (
            <div
              key={u.id}
              className="rounded-xl border border-gray-800 bg-gray-900 p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-white">{u.phone}</p>
                  <p className="mt-0.5 font-mono text-xs text-gray-400">
                    {u.deviceId ?? "Нет устройства"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    u.isBlocked
                      ? "bg-red-900/40 text-red-400"
                      : "bg-green-900/40 text-green-400"
                  }`}
                >
                  {u.isBlocked ? "Заблокирован" : "Активен"}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-400">
                <span>ID: {u.id}</span>
                <span>·</span>
                <span>
                  Пробный до:{" "}
                  {new Date(u.trialExpireAt).toLocaleDateString("ru-RU")}
                </span>
                <span>·</span>
                <span>{u.preferredPaymentMethod}</span>
              </div>
              <div className="mt-3">
                <BlockButton
                  user={u}
                  onToggle={(id, isBlocked) => toggleBlock({ id, isBlocked })}
                />
              </div>
            </div>
          );
        })}
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
    </div>
  );
}
