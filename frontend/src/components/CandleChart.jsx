import React, { useMemo } from "react";

export default function CandleChart({ data = [], height = 360, accent = "var(--accent-cyan)", prevClose = null }) {
  const chartData = useMemo(() => {
    if (!data.length) return [];

    return data.map((item, index) => {
      const open = Number(item.open ?? item.value ?? item.close ?? 0);
      const close = Number(item.close ?? item.value ?? open);
      const high = Number(item.high ?? Math.max(open, close));
      const low = Number(item.low ?? Math.min(open, close));
      const rising = close >= open;

      return {
        ...item,
        index,
        open,
        close,
        high,
        low,
        rising,
      };
    });
  }, [data]);

  if (!chartData.length) {
    return (
      <div style={{ height: "100%", display: "grid", placeItems: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}>
        Loading candle view…
      </div>
    );
  }

  const width = 1000;
  const left = 12;
  const right = 84;
  const top = 24;
  const priceBottom = height * 0.71;
  const volumeTop = height * 0.79;
  const dateY = height - 8;
  const innerWidth = width - left - right;
  const innerHeight = priceBottom - top;
  const minPrice = Math.min(...chartData.map((d) => d.low));
  const maxPrice = Math.max(...chartData.map((d) => d.high));
  const pricePadding = (maxPrice - minPrice || maxPrice * 0.01 || 1) * 0.08;
  const scaleMin = minPrice - pricePadding;
  const scaleMax = maxPrice + pricePadding;
  const priceRange = scaleMax - scaleMin || 1;
  const maxVolume = Math.max(...chartData.map((d) => Number(d.volume || 0)), 1);
  const candleWidth = Math.max(3, Math.min(12, innerWidth / chartData.length * 0.56));

  const toY = (value) => top + ((scaleMax - value) / priceRange) * innerHeight;
  const toX = (index) => left + (index / Math.max(chartData.length - 1, 1)) * innerWidth;

  const prevY = prevClose !== null && Number.isFinite(prevClose) ? toY(prevClose) : null;
  const last = chartData[chartData.length - 1];
  const lastY = toY(last.close);
  const priceLabels = Array.from({ length: 5 }, (_, index) => scaleMax - (priceRange * index) / 4);
  const timeLabelEvery = Math.max(1, Math.ceil(chartData.length / 7));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Live candlestick price chart" style={{ width: "100%", height: "100%", display: "block" }}>
      {priceLabels.map((value, index) => {
        const y = toY(value);
        return <g key={`grid-${index}`}>
          <line x1={left} x2={width - right + 8} y1={y} y2={y} stroke="var(--border)" strokeDasharray="3 5" opacity={0.8} />
          <text x={width - right + 14} y={y + 3} fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-mono)">₹{value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</text>
        </g>;
      })}

      {prevY !== null && (
        <line x1={left} x2={width - right + 8} y1={prevY} y2={prevY} stroke="var(--text-dim)" strokeDasharray="5 5" opacity={0.9} />
      )}

      {chartData.map((d, i) => {
        const x = toX(i);
        const highY = toY(d.high);
        const lowY = toY(d.low);
        const bodyTopY = toY(Math.max(d.open, d.close));
        const bodyBottomY = toY(Math.min(d.open, d.close));
        const bodyHeight = Math.max(2, bodyBottomY - bodyTopY);
        const color = d.rising ? "#16A34A" : "#DC2626";
        const volumeHeight = (Number(d.volume || 0) / maxVolume) * (height * 0.13);

        return (
          <g key={`${d.date || i}-${i}`}>
            <line x1={x} x2={x} y1={highY} y2={lowY} stroke={color} strokeWidth={1.3} opacity={0.9} />
            <rect
              x={x - candleWidth / 2}
              y={bodyTopY}
              width={candleWidth}
              height={bodyHeight}
              rx={2}
              fill={color}
              opacity={0.9}
            />
            <rect x={x - candleWidth / 2} y={height * 0.94 - volumeHeight} width={candleWidth} height={volumeHeight} fill={color} opacity={0.22} />
          </g>
        );
      })}

      <line x1={left} x2={width - right + 8} y1={volumeTop} y2={volumeTop} stroke="var(--border)" />
      <line x1={left} x2={width - right + 8} y1={lastY} y2={lastY} stroke={last.rising ? "#16A34A" : "#DC2626"} strokeDasharray="4 4" opacity={0.8} />
      <rect x={width - right + 10} y={lastY - 10} width={right - 12} height={20} rx={4} fill={last.rising ? "#16A34A" : "#DC2626"} />
      <text x={width - right + 14} y={lastY + 4} fill="#FFFFFF" fontSize="10" fontWeight="700" fontFamily="var(--font-mono)">₹{last.close.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</text>

      {chartData.filter((_, i) => i % timeLabelEvery === 0 || i === chartData.length - 1).map((d, idx) => {
        const x = toX(d.index);
        const label = d.date ? (d.date.includes(":") ? d.date : d.date.slice(5)) : `T${d.index + 1}`;
        return (
          <text
            key={`label-${d.date || idx}`}
            x={x}
            y={dateY}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize="9"
            fontFamily="var(--font-mono)"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}
