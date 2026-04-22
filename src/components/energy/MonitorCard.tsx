"use client";

import { useState, useEffect } from "react";

interface MonitorCardProps {
  title: string;
  value: number | null | undefined;
  unit: string;
  lastUpdate: string;
  color?: "yellow" | "blue" | "green" | "purple" | "orange" | "red" | "gray";
  icon: "voltage" | "current" | "power" | "total" | "frequency" | "pf" | "energy" | "co2";
  highlight?: boolean;
}

export default function MonitorCard({
  title,
  value,
  unit,
  lastUpdate,
  color = "gray",
  icon,
  highlight = false,
}: MonitorCardProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  const colorMap = {
    yellow:  { border: "border-yellow-400",  bg: "bg-yellow-50",  text: "text-yellow-700",  badge: "bg-yellow-100 text-yellow-600" },
    blue:    { border: "border-blue-400",    bg: "bg-blue-50",    text: "text-blue-700",    badge: "bg-blue-100 text-blue-600" },
    green:   { border: "border-green-400",   bg: "bg-green-50",   text: "text-green-700",   badge: "bg-green-100 text-green-600" },
    purple:  { border: "border-purple-400",  bg: "bg-purple-50",  text: "text-purple-700",  badge: "bg-purple-100 text-purple-600" },
    orange:  { border: "border-orange-400",  bg: "bg-orange-50",  text: "text-orange-700",  badge: "bg-orange-100 text-orange-600" },
    red:     { border: "border-red-400",     bg: "bg-red-50",     text: "text-red-700",     badge: "bg-red-100 text-red-600" },
    gray:    { border: "border-gray-200",    bg: "bg-white",      text: "text-gray-600",    badge: "bg-gray-100 text-gray-500" },
  };

  const c = colorMap[color] ?? colorMap.gray;
  const displayValue = value != null && !isNaN(Number(value)) ? Number(value).toFixed(2) : "—";

  const getIconPath = () => {
    switch (icon) {
      case "voltage":
        return <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
      case "current":
        return <><circle cx="12" cy="12" r="9" strokeWidth="2" /><path d="M8 12h8M14 9l3 3-3 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>;
      case "power":
        return <><circle cx="12" cy="12" r="9" strokeWidth="2" /><path d="M12 6v6l4 2" strokeWidth="2" strokeLinecap="round" /></>;
      case "total":
        return <><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" /><path d="M9 9h6M9 12h6M9 15h4" strokeWidth="2" strokeLinecap="round" /></>;
      case "frequency":
        return <path d="M2 12h4l3-8 4 16 3-8h4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
      case "pf":
        return <><circle cx="12" cy="12" r="9" strokeWidth="2" /><path d="M9 12l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>;
      case "energy":
      case "co2":
        return <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM8 12c0-2.2 1.8-4 4-4s4 1.8 4 4" strokeWidth="2" strokeLinecap="round" />;
      default:
        return null;
    }
  };

  return (
    <div className={`rounded-xl border-2 ${c.border} ${c.bg} p-4 transition-all hover:shadow-md hover:-translate-y-0.5 duration-200`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <p className={`text-xs font-semibold uppercase tracking-wide ${c.text} leading-tight`}>{title}</p>
        <span className={`p-1.5 rounded-lg ${c.badge}`}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">{getIconPath()}</svg>
        </span>
      </div>

      {/* Value */}
      <div className="mb-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-gray-900 tabular-nums">{displayValue}</span>
        {unit && <span className={`text-sm font-medium ${c.text}`}>{unit}</span>}
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-xs text-gray-400">
          {lastUpdate ? (isClient ? new Date(lastUpdate).toLocaleTimeString() : '--:--:--') : "Live"}
        </span>
      </div>
    </div>
  );
}
