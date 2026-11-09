import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Phone, Plus, Trash2, X } from "lucide-react";
import { useRef, useState } from "react";
import { authPhoneApi } from "../api/authPhone";
import type { AuthPhone } from "../api/types";

interface AddPhoneDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AddPhoneDialog({ onClose, onSuccess }: AddPhoneDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    const phoneValue = phone.trim();
    if (!phoneValue) {
      setError("Введите номер телефона");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await authPhoneApi.create(phoneValue);
      setPhone("");
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка при добавлении номера");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCreate();
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold">Добавить номер для авторизации</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400">Номер телефона</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="+7 (999) 999-99-99"
              disabled={loading}
              className="mt-2 w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white outline-none focus:border-blue-500 disabled:opacity-50"
              autoFocus
            />
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-600 px-4 py-2 transition hover:bg-gray-800 disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Добавление..." : "Добавить"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthPhoneRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: AuthPhone;
  onUpdate: (id: number, phone: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(item.phone);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEdit = () => {
    setValue(item.phone);
    setError(null);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSave = async () => {
    const phoneValue = value.trim();
    if (!phoneValue) {
      setError("Введите номер");
      return;
    }
    if (phoneValue === item.phone) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onUpdate(item.id, phoneValue);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Вы уверены? Номер будет удален.")) return;
    setSaving(true);
    setError(null);
    try {
      await onDelete(item.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") setEditing(false);
  };

  if (editing) {
    return (
      <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="tel"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              disabled={saving}
              className="flex-1 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-white outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg p-2 text-green-400 transition hover:bg-green-900/30 disabled:opacity-50"
              title="Сохранить"
            >
              <Check size={18} />
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-800 disabled:opacity-50"
              title="Отмена"
            >
              <X size={18} />
            </button>
          </div>
          {error && <div className="text-sm text-red-400">{error}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-900 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Phone size={20} className="text-blue-400" />
          <div>
            <p className="font-mono text-lg text-white">{item.phone}</p>
            <p className="text-xs text-gray-500">
              {new Date(item.createdAt).toLocaleDateString("ru-RU", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleEdit}
            disabled={saving}
            className="rounded-lg bg-blue-600/20 px-3 py-2 text-xs font-medium text-blue-400 transition hover:bg-blue-600/30 disabled:opacity-50"
          >
            Редактировать
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="rounded-lg bg-red-600/20 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-600/30 disabled:opacity-50"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AuthPhonePage() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["auth-phones"],
    queryFn: authPhoneApi.list,
  });

  const { mutate: updatePhone } = useMutation({
    mutationFn: ({ id, phone }: { id: number; phone: string }) =>
      authPhoneApi.update(id, phone),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-phones"] });
    },
  });

  const { mutate: deletePhone } = useMutation({
    mutationFn: (id: number) => authPhoneApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-phones"] });
    },
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["auth-phones"] });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Номера для авторизации</h1>
          <p className="mt-1 text-sm text-gray-400">
            Управление номерами телефонов для звонков при авторизации
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Добавить номер
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 text-gray-400">
          Загрузка...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-900/30 p-4 text-red-400">
          Ошибка: {error instanceof Error ? error.message : "Неизвестная ошибка"}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && data.length === 0 && (
        <div className="rounded-lg border border-gray-700 bg-gray-900/50 p-12 text-center">
          <Phone size={48} className="mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400">Номера для авторизации еще не добавлены</p>
          <button
            type="button"
            onClick={() => setShowDialog(true)}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-medium transition hover:bg-blue-700"
          >
            Добавить первый номер
          </button>
        </div>
      )}

      {/* Phone list */}
      {!isLoading && data.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm text-gray-400">
            Всего номеров: {data.length}
          </div>
          {data.map((item) => (
            <AuthPhoneRow
              key={item.id}
              item={item}
              onUpdate={(id, phone) =>
                new Promise((resolve, reject) => {
                  updatePhone(
                    { id, phone },
                    {
                      onSuccess: () => resolve(),
                      onError: reject,
                    },
                  );
                })
              }
              onDelete={(id) =>
                new Promise((resolve, reject) => {
                  deletePhone(id, {
                    onSuccess: () => resolve(),
                    onError: reject,
                  });
                })
              }
            />
          ))}
        </div>
      )}

      {/* Add dialog */}
      {showDialog && (
        <AddPhoneDialog
          onClose={() => setShowDialog(false)}
          onSuccess={handleRefresh}
        />
      )}
    </div>
  );
}
