import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import L, { type LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft,
  Check,
  Crosshair,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { Link, useParams } from "react-router-dom";
import { routesApi } from "../api/routes";
import type { RouteGeometry, UpdateRouteGeometryPayload } from "../api/types";

type Point = { lat: number; lng: number };
type Segment = Point[];
type SelectedPoint = { segmentIndex: number; pointIndex: number };

const DEFAULT_CENTER: Point = { lat: 43.5, lng: 44.9 };
const ROUTE_COLORS = [
  "#E5484D",
  "#2E86DE",
  "#18A572",
  "#E58A18",
  "#8B5CF6",
  "#D946A6",
  "#0891B2",
  "#475569",
];

function parseSegments(geometry: RouteGeometry | null): Segment[] {
  if (!geometry) return [[]];
  const rawSegments =
    geometry.type === "LineString"
      ? [geometry.coordinates]
      : geometry.coordinates;
  const parsed = rawSegments.map((segment) =>
    segment.map(([longitude, latitude]) => ({
      lat: latitude,
      lng: longitude,
    })),
  );
  return parsed.length > 0 ? parsed : [[]];
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (point: LatLng) => void;
}) {
  useMapEvents({ click: (event) => onMapClick(event.latlng) });
  return null;
}

function FitRouteBounds({ routeId, points }: { routeId: number; points: Point[] }) {
  const map = useMap();
  const fittedRoute = useRef<number | null>(null);

  useEffect(() => {
    if (fittedRoute.current === routeId || points.length < 2) return;
    map.fitBounds(
      L.latLngBounds(points.map(({ lat, lng }) => [lat, lng])),
      { padding: [40, 40], maxZoom: 15 },
    );
    fittedRoute.current = routeId;
  }, [map, points, routeId]);

  return null;
}

function InvalidateMapSize() {
  const map = useMap();

  useEffect(() => {
    const frame = requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    return () => cancelAnimationFrame(frame);
  }, [map]);

  return null;
}

function MapZoomControl() {
  const map = useMap();

  useEffect(() => {
    const control = L.control.zoom({ position: "bottomright" }).addTo(map);
    return () => {
      control.remove();
    };
  }, [map]);

  return null;
}

export default function RouteGeometryPage() {
  const { id } = useParams();
  const routeId = Number(id);
  const validRouteId = Number.isSafeInteger(routeId) && routeId > 0;
  const queryClient = useQueryClient();
  const [segments, setSegments] = useState<Segment[]>([[]]);
  const [activeSegment, setActiveSegment] = useState(0);
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(null);
  const [movingPoint, setMovingPoint] = useState(false);
  const [color, setColor] = useState(ROUTE_COLORS[1]);
  const [formError, setFormError] = useState<string | null>(null);

  const geometryQuery = useQuery({
    queryKey: ["admin-route-geometry", routeId],
    queryFn: () => routesApi.getGeometry(routeId),
    enabled: validRouteId,
  });

  useEffect(() => {
    if (!geometryQuery.data) return;
    setSegments(parseSegments(geometryQuery.data.geometry));
    setActiveSegment(0);
    setSelectedPoint(null);
    setColor(geometryQuery.data.color);
  }, [geometryQuery.data]);

  const invalidateRouteData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-route-geometry", routeId] }),
      queryClient.invalidateQueries({ queryKey: ["admin-routes"] }),
    ]);
  };

  const saveMutation = useMutation({
    mutationFn: (payload: UpdateRouteGeometryPayload) =>
      routesApi.updateGeometry(routeId, payload),
    onSuccess: invalidateRouteData,
    onError: (error) =>
      setFormError(error instanceof Error ? error.message : "Не удалось сохранить линию"),
  });

  const clearMutation = useMutation({
    mutationFn: () => routesApi.removeGeometry(routeId),
    onSuccess: async () => {
      setSegments([[]]);
      setActiveSegment(0);
      setSelectedPoint(null);
      setMovingPoint(false);
      await invalidateRouteData();
    },
    onError: (error) =>
      setFormError(error instanceof Error ? error.message : "Не удалось очистить линию"),
  });

  const allPoints = useMemo(() => segments.flat(), [segments]);
  const pointCount = allPoints.length;
  const isPending = saveMutation.isPending || clearMutation.isPending;

  const addPoint = (point: LatLng) => {
    if (movingPoint && selectedPoint) {
      setSegments((current) =>
        current.map((segment, segmentIndex) =>
          segmentIndex === selectedPoint.segmentIndex
            ? segment.map((item, pointIndex) =>
                pointIndex === selectedPoint.pointIndex
                  ? { lat: point.lat, lng: point.lng }
                  : item,
              )
            : segment,
        ),
      );
      setSelectedPoint(null);
      setMovingPoint(false);
      return;
    }

    setSegments((current) =>
      current.map((segment, index) =>
        index === activeSegment
          ? [...segment, { lat: point.lat, lng: point.lng }]
          : segment,
      ),
    );
    setSelectedPoint(null);
  };

  const removeSelectedPoint = () => {
    if (!selectedPoint) return;
    setSegments((current) =>
      current.map((segment, segmentIndex) =>
        segmentIndex === selectedPoint.segmentIndex
          ? segment.filter((_, pointIndex) => pointIndex !== selectedPoint.pointIndex)
          : segment,
      ),
    );
    setSelectedPoint(null);
    setMovingPoint(false);
  };

  const undoLastPoint = () => {
    setSegments((current) =>
      current.map((segment, index) =>
        index === activeSegment ? segment.slice(0, -1) : segment,
      ),
    );
    setSelectedPoint(null);
  };

  const handleSave = () => {
    setFormError(null);
    const incompleteSegment = segments.some(
      (segment) => segment.length === 1,
    );
    const drawableSegments = segments.filter((segment) => segment.length >= 2);
    if (incompleteSegment || drawableSegments.length === 0) {
      setFormError("Для каждого участка линии нужны минимум две точки");
      return;
    }

    saveMutation.mutate({
      geometry: {
        type: "MultiLineString",
        coordinates: drawableSegments.map((segment) =>
          segment.map(({ lat, lng }) => [lng, lat]),
        ),
      },
      color,
    });
  };

  if (!validRouteId) {
    return <p className="text-sm text-red-300">Некорректный ID маршрута</p>;
  }
  if (geometryQuery.isLoading) {
    return <div className="flex justify-center py-24 text-gray-400">Загрузка маршрута...</div>;
  }
  if (geometryQuery.error) {
    return (
      <div role="alert" className="rounded-md bg-red-950 px-4 py-3 text-red-300">
        Ошибка: {geometryQuery.error instanceof Error ? geometryQuery.error.message : "Не удалось загрузить маршрут"}
      </div>
    );
  }

  const route = geometryQuery.data!;

  return (
    <div className="fixed inset-0 z-[60] isolate h-[100dvh] w-screen overflow-hidden bg-gray-950 text-white">
      <div className="absolute inset-0 z-0">
        <MapContainer
          key={routeId}
          center={allPoints[0] ?? DEFAULT_CENTER}
          zoom={11}
          zoomControl={false}
          className="h-full w-full"
          style={{ height: "100%", minHeight: 0, width: "100%" }}
        >
          <InvalidateMapSize />
          <MapZoomControl />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={addPoint} />
          <FitRouteBounds routeId={routeId} points={allPoints} />
          {segments.map((segment, segmentIndex) => (
            <Polyline
              key={`line-${segmentIndex}`}
              positions={segment.map(({ lat, lng }) => [lat, lng] as [number, number])}
              pathOptions={{
                color,
                weight: segmentIndex === activeSegment ? 6 : 4,
                opacity: segmentIndex === activeSegment ? 0.95 : 0.65,
              }}
            />
          ))}
          {segments.flatMap((segment, segmentIndex) =>
            segment.map((point, pointIndex) => {
              const isSelected =
                selectedPoint?.segmentIndex === segmentIndex &&
                selectedPoint.pointIndex === pointIndex;
              return (
                <CircleMarker
                  key={`point-${segmentIndex}-${pointIndex}`}
                  center={point}
                  radius={isSelected ? 8 : 6}
                  bubblingMouseEvents={false}
                  pathOptions={{
                    color: isSelected ? "#ffffff" : color,
                    fillColor: color,
                    fillOpacity: 1,
                    weight: isSelected ? 3 : 2,
                  }}
                  eventHandlers={{
                    click: () => {
                      setSelectedPoint({ segmentIndex, pointIndex });
                      setActiveSegment(segmentIndex);
                      setMovingPoint(false);
                    },
                  }}
                />
              );
            }),
          )}
        </MapContainer>
      </div>

      <Link
        to="/routes"
        title="Вернуться к маршрутам"
        aria-label="Вернуться к маршрутам"
        className="absolute left-3 z-20 inline-flex size-10 items-center justify-center rounded-full border border-white/15 bg-gray-950/70 text-white shadow-lg backdrop-blur-md hover:bg-gray-900/90"
        style={{ top: "max(env(safe-area-inset-top), 0.75rem)" }}
      >
        <ArrowLeft size={19} />
      </Link>

      <div
        className="absolute right-3 z-20 max-w-[60vw] rounded-full border border-white/15 bg-gray-950/70 px-3 py-2 text-right shadow-lg backdrop-blur-md"
        style={{ top: "max(env(safe-area-inset-top), 0.75rem)" }}
      >
        <h1 className="truncate text-sm font-semibold">
          №{route.number} · {route.name}
        </h1>
        <p className="text-xs text-gray-300">Точек: {pointCount}</p>
      </div>

      <aside
        aria-label="Инструменты редактирования маршрута"
        className="absolute z-20 flex w-14 max-w-[calc(100vw-1.5rem)] -translate-y-1/2 flex-col items-center gap-2 overflow-y-auto rounded-2xl border border-white/15 bg-gray-950/65 p-2 shadow-xl backdrop-blur-md"
        style={{
          left: "max(env(safe-area-inset-left), 0.75rem)",
          top: "50%",
          maxHeight: "calc(100dvh - 8rem)",
        }}
      >
        <button
          type="button"
          onClick={undoLastPoint}
          disabled={segments[activeSegment]?.length === 0 || isPending}
          title="Отменить последнюю точку участка"
          aria-label="Отменить последнюю точку участка"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-100 hover:bg-white/15 disabled:opacity-35"
        >
          <RotateCcw size={17} />
        </button>
        <button
          type="button"
          onClick={() => {
            const nextIndex = segments.length;
            setSegments((current) => [...current, []]);
            setActiveSegment(nextIndex);
            setSelectedPoint(null);
          }}
          disabled={isPending}
          title="Начать отдельный участок линии"
          aria-label="Начать отдельный участок линии"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-100 hover:bg-white/15 disabled:opacity-35"
        >
          <Plus size={18} />
        </button>
        <button
          type="button"
          onClick={() => setMovingPoint((current) => !current)}
          disabled={!selectedPoint || isPending}
          title={movingPoint ? "Укажите место для точки" : "Переместить выбранную точку"}
          aria-label={movingPoint ? "Укажите место для точки" : "Переместить выбранную точку"}
          className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl border text-gray-100 disabled:opacity-35 ${movingPoint ? "border-blue-300/50 bg-blue-500/30" : "border-white/10 bg-white/5 hover:bg-white/15"}`}
        >
          <Crosshair size={17} />
        </button>
        <button
          type="button"
          onClick={removeSelectedPoint}
          disabled={!selectedPoint || isPending}
          title="Удалить выбранную точку"
          aria-label="Удалить выбранную точку"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-gray-100 hover:bg-white/15 disabled:opacity-35"
        >
          <X size={17} />
        </button>

        <div className="my-1 h-px w-full shrink-0 bg-white/15" />
        <span className="text-[10px] font-medium text-gray-300">Цвет</span>
        {ROUTE_COLORS.map((routeColor) => (
          <button
            key={routeColor}
            type="button"
            title={`Выбрать цвет ${routeColor}`}
            aria-label={`Выбрать цвет ${routeColor}`}
            aria-pressed={color.toLowerCase() === routeColor.toLowerCase()}
            onClick={() => setColor(routeColor)}
            className={`size-6 shrink-0 rounded-full border-2 ${color.toLowerCase() === routeColor.toLowerCase() ? "border-white ring-2 ring-blue-300/80" : "border-white/40"}`}
            style={{ backgroundColor: routeColor }}
          />
        ))}

        {segments.length > 1 && (
          <label className="mt-1 flex w-full shrink-0 flex-col items-center gap-1 border-t border-white/15 pt-2 text-[10px] text-gray-300">
            Участок
            <select
              value={activeSegment}
              onChange={(event) => {
                setActiveSegment(Number(event.target.value));
                setSelectedPoint(null);
              }}
              aria-label="Активный участок"
              className="w-full rounded-lg border border-white/15 bg-gray-900/90 px-1 py-1.5 text-center text-xs text-white"
            >
              {segments.map((_, index) => (
                <option key={index} value={index}>{index + 1}</option>
              ))}
            </select>
          </label>
        )}
      </aside>

      <footer
        aria-label="Действия редактора"
        className="absolute left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-white/15 bg-gray-950/75 p-2 shadow-xl backdrop-blur-md"
        style={{ bottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
      >
        <button
          type="button"
          disabled={!route.geometry || isPending}
          onClick={() => {
            if (confirm(`Удалить координаты маршрута №${route.number}?`)) {
              setFormError(null);
              clearMutation.mutate();
            }
          }}
          title="Удалить линию"
          aria-label="Удалить линию"
          className="inline-flex size-9 items-center justify-center rounded-xl border border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/25 disabled:opacity-35"
        >
          <Trash2 size={16} />
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            setSegments(parseSegments(route.geometry));
            setActiveSegment(0);
            setSelectedPoint(null);
            setMovingPoint(false);
            setColor(route.color);
            setFormError(null);
          }}
          title="Отменить изменения"
          aria-label="Отменить изменения"
          className="inline-flex size-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-gray-100 hover:bg-white/15 disabled:opacity-35"
        >
          <X size={17} />
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={handleSave}
          title={saveMutation.isPending ? "Сохранение" : "Сохранить линию"}
          aria-label={saveMutation.isPending ? "Сохранение" : "Сохранить линию"}
          className="inline-flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md hover:bg-blue-500 disabled:opacity-50"
        >
          {saveMutation.isPending ? <Check size={16} /> : <Save size={16} />}
        </button>
      </footer>

      {formError && (
        <p
          role="alert"
          className="absolute left-1/2 z-30 w-[min(90vw,28rem)] -translate-x-1/2 rounded-xl border border-red-400/20 bg-red-950/90 px-3 py-2 text-center text-sm text-red-200 shadow-lg backdrop-blur"
          style={{ bottom: "calc(max(env(safe-area-inset-bottom), 0.75rem) + 3.75rem)" }}
        >
          {formError}
        </p>
      )}
    </div>
  );
}