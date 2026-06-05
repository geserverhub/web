"use client";

import Link from "next/link";
import { Bell, RefreshCw, X, CheckCheck, AlertTriangle, Info, Zap, Home } from "lucide-react";
import { useSite } from "@/lib/SiteContext";
import { useLocale } from "@/lib/LocaleContext";
import { useState, useRef, useEffect, useCallback } from "react";
import EnergyLangSwitcher from "./EnergyLangSwitcher";
import { formatEnergyDisplayUser, type EnergySessionUser } from "@/lib/energy/display-user";

type EnergyUser = EnergySessionUser;

function readEnergyUser(): EnergyUser | null {
  try {
    const raw = localStorage.getItem('energy_system_user');
    if (!raw) return null;
    return JSON.parse(raw) as EnergyUser;
  } catch {
    return null;
  }
}

export default function Header() {
  const { selectedSite } = useSite();
  const { locale, t } = useLocale();
  const lang = ["th", "ko", "en"].includes(locale) ? locale : "th";
  const backMainMenu =
    t("backMainMenu") !== "backMainMenu"
      ? t("backMainMenu")
      : lang === "th"
        ? "กลับหน้าเมนูหลัก"
        : lang === "ko"
          ? "메인 메뉴"
          : "Main menu";
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [energyUser, setEnergyUser] = useState<EnergyUser | null>(null);

  const { displayName, displayRole } = formatEnergyDisplayUser(energyUser);

  const fetchNotifications = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setLoading(true);
      const site = encodeURIComponent(selectedSite);
      const res = await fetch(`/api/ge-energy/notifications?site=${site}&limit=10`, {
        cache: 'no-store',
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data.notifications);
        setUnreadCount(json.data.unreadCount);
      }
    } catch (error) {
      const benign =
        (error instanceof DOMException && error.name === 'AbortError') ||
        (error instanceof Error &&
          (error.name === 'AbortError' || error.message === 'Failed to fetch'));
      if (!benign) {
        console.warn('Notifications unavailable:', error);
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [selectedSite]);

  // Mark all as read
  const markAllRead = async () => {
    try {
      const res = await fetch('/api/ge-energy/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true })
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Mark single notification as read
  const markRead = async (id: number) => {
    try {
      const res = await fetch('/api/ge-energy/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id })
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  useEffect(() => {
    setMounted(true);
    setEnergyUser(readEnergyUser());

    const onStorage = (event: StorageEvent) => {
      if (event.key === "energy_system_user" || event.key === null) {
        setEnergyUser(readEnergyUser());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Poll notifications (no shared AbortSignal — avoids Strict Mode / site-change noise)
  useEffect(() => {
    let cancelled = false;

    const poll = () => {
      if (cancelled || document.visibilityState === 'hidden') return;
      void fetchNotifications({ silent: true });
    };

    poll();
    const interval = setInterval(poll, 30000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') poll();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="energy-header px-4 sm:px-8 py-4 overflow-visible">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/energy-dashboard/dashboard"
          className="energy-header-btn inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-emerald-800 shrink-0"
        >
          <Home className="w-4 h-4 shrink-0" strokeWidth={2} />
          <span className="hidden sm:inline">{backMainMenu}</span>
        </Link>

        <div className="flex items-center justify-end gap-2 min-w-0">
          {mounted && displayName && (
            <Link
              href="/energy-dashboard/profile"
              className="energy-header-btn hidden sm:flex items-center gap-2 max-w-[220px] rounded-xl px-3 py-2 shrink min-w-0"
              title={displayName}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex flex-col leading-tight">
                <span className="truncate text-sm font-semibold text-gray-800">{displayName}</span>
                {displayRole && (
                  <span className="truncate text-[10px] font-medium uppercase tracking-wide text-emerald-600">
                    {displayRole}
                  </span>
                )}
              </span>
            </Link>
          )}

          {mounted && displayName && (
            <Link
              href="/energy-dashboard/profile"
              className="sm:hidden flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white"
              title={displayName}
              aria-label={displayName}
            >
              {displayName.charAt(0).toUpperCase()}
            </Link>
          )}

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 hover:bg-emerald-50 rounded-lg transition-all duration-200 hover:shadow-sm relative group"
            >
              <Bell className={`w-5 h-5 transition-colors ${showNotifications ? "text-emerald-600" : "text-gray-500 group-hover:text-emerald-600"}`} />
              {mounted && unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="energy-notif-panel absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-gray-800">Notifications</span>
                    {mounted && unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition">
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                    <button onClick={() => setShowNotifications(false)} className="p-1 rounded hover:bg-gray-200 transition">
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>

                {/* Notification List */}
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notif) => {
                    const iconMap = {
                      alert: <AlertTriangle className="w-4 h-4 text-red-500" />,
                      warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
                      info: <Info className="w-4 h-4 text-blue-500" />,
                      success: <Zap className="w-4 h-4 text-green-500" />,
                    } as Record<string, React.ReactNode>;
                    return (
                      <button
                        key={notif.id}
                        onClick={() => markRead(notif.id)}
                        className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition border-b border-gray-100 last:border-0 ${
                          !notif.read ? "bg-blue-50/40" : ""
                        }`}
                      >
                        <div className="mt-0.5 flex-shrink-0">{iconMap[notif.type]}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${!notif.read ? "text-gray-900" : "text-gray-600"}`}>{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-snug">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                        </div>
                        {!notif.read && <span className="mt-1 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>}
                      </button>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t bg-gray-50">
                  <a href="/energy-dashboard/notifications" className="text-xs text-emerald-600 hover:text-emerald-800 font-medium transition">View all notifications →</a>
                </div>
              </div>
            )}
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={() => fetchNotifications()}
            disabled={loading}
            className="p-2.5 hover:bg-emerald-50 rounded-lg transition-all duration-200 hover:shadow-sm group disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-gray-500 group-hover:text-emerald-600 group-hover:rotate-180 transition-all duration-500" />
          </button>

          <EnergyLangSwitcher />
        </div>
      </div>
    </header>
  );
}
