"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { convertUsdCentsToCzkHalere, formatMoney } from "@/lib/money/money";
import type { HistoryRange } from "@/modules/prices/domain/history";

type Point = {
  priceMinor: number;
  currency: string;
  observedAt: string;
  storeId: string;
  storeName: string;
};
type Unit = "CZK" | "USD";
const ranges: Array<[HistoryRange, string]> = [
  ["30d", "30 dní"],
  ["3m", "3 měsíce"],
  ["6m", "6 měsíců"],
  ["1y", "1 rok"],
  ["all", "Vše"],
];
const colors = ["#37d8bd", "#78e08f", "#f5a451", "#7aa7ff", "#c78cff", "#f06d78"];

export function PriceHistoryChart({ gameId, rate }: { gameId: string; rate: string | null }) {
  const [range, setRange] = useState<HistoryRange>("3m");
  const [unit, setUnit] = useState<Unit>(rate ? "CZK" : "USD");
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/history/${gameId}?range=${range}`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("history"))))
      .then((data: { points: Point[] }) => setPoints(data.points))
      .catch((error) => {
        if (error instanceof Error && error.name !== "AbortError") setPoints([]);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [gameId, range]);

  const stores = useMemo(
    () => [...new Map(points.map((point) => [point.storeId, point.storeName])).entries()],
    [points],
  );
  const rows = useMemo(() => {
    const byTime = new Map<string, Record<string, number | string>>();
    for (const point of points) {
      const row = byTime.get(point.observedAt) ?? { observedAt: point.observedAt };
      row[point.storeId] =
        unit === "CZK" && rate
          ? convertUsdCentsToCzkHalere(point.priceMinor, rate)
          : point.priceMinor;
      byTime.set(point.observedAt, row);
    }
    return [...byTime.values()];
  }, [points, rate, unit]);
  const lowest = points.length
    ? points.reduce((a, b) => (a.priceMinor <= b.priceMinor ? a : b))
    : null;

  return (
    <section className="history-panel" aria-labelledby="history-title">
      <div className="panel-heading">
        <div>
          <p className="kicker">Vlastní data GameRadar CZ</p>
          <h2 id="history-title">Cenová historie</h2>
        </div>
        <div className="chart-controls">
          <div className="segmented" aria-label="Rozsah grafu">
            {ranges.map(([value, label]) => (
              <button
                className={range === value ? "active" : ""}
                onClick={() => {
                  if (value !== range) {
                    setLoading(true);
                    setRange(value);
                  }
                }}
                key={value}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="segmented" aria-label="Měna grafu">
            <button className={unit === "USD" ? "active" : ""} onClick={() => setUnit("USD")}>
              USD
            </button>
            {rate && (
              <button className={unit === "CZK" ? "active" : ""} onClick={() => setUnit("CZK")}>
                CZK
              </button>
            )}
          </div>
        </div>
      </div>
      {loading ? (
        <div className="chart-loading skeleton" />
      ) : points.length < 2 ? (
        <div className="history-empty">
          <strong>Cenovou historii teprve sbíráme.</strong>
          <p>
            {points[0]
              ? `Vlastní sledování začalo ${new Intl.DateTimeFormat("cs-CZ").format(new Date(points[0].observedAt))}.`
              : "První záznam vznikne po uložení nabídky."}
          </p>
        </div>
      ) : (
        <>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rows} margin={{ top: 20, right: 18, bottom: 8, left: 5 }}>
                <CartesianGrid stroke="#263438" strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="observedAt"
                  tickFormatter={(value) =>
                    new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "short" }).format(
                      new Date(value),
                    )
                  }
                  stroke="#718582"
                  fontSize={11}
                />
                <YAxis
                  stroke="#718582"
                  fontSize={11}
                  tickFormatter={(value) =>
                    unit === "CZK"
                      ? `${Math.round(value / 100)} Kč`
                      : `$${(value / 100).toFixed(0)}`
                  }
                />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="chart-tooltip">
                        <strong>
                          {new Intl.DateTimeFormat("cs-CZ", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(String(label)))}
                        </strong>
                        {payload.map((item) => (
                          <span key={String(item.dataKey)}>
                            {stores.find(([id]) => id === item.dataKey)?.[1]}:{" "}
                            {formatMoney({ minor: Number(item.value), currency: unit })}
                          </span>
                        ))}
                      </div>
                    ) : null
                  }
                />
                {stores.map(
                  ([id], index) =>
                    !hidden.has(id) && (
                      <Line
                        key={id}
                        dataKey={id}
                        type="monotone"
                        connectNulls={false}
                        stroke={colors[index % colors.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ),
                )}
                {lowest && (
                  <ReferenceDot
                    x={lowest.observedAt}
                    y={
                      unit === "CZK" && rate
                        ? convertUsdCentsToCzkHalere(lowest.priceMinor, rate)
                        : lowest.priceMinor
                    }
                    r={6}
                    fill="#78e08f"
                    stroke="#07110e"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-legend">
            {stores.map(([id, name], index) => (
              <button
                className={hidden.has(id) ? "muted" : ""}
                onClick={() =>
                  setHidden((current) => {
                    const next = new Set(current);
                    if (next.has(id)) next.delete(id);
                    else next.add(id);
                    return next;
                  })
                }
                key={id}
              >
                <span style={{ background: colors[index % colors.length] }} />
                {name}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
