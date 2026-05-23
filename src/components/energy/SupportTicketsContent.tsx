'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocale } from '@/lib/LocaleContext';
import { useSite } from '@/lib/SiteContext';
import {
  MessageSquare,
  Plus,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const STORAGE_KEY = 'energy_support_tickets';

type TicketStatus = 'open' | 'in_progress' | 'resolved';
type TicketPriority = 'low' | 'medium' | 'high';

type Ticket = {
  id: string;
  subject: string;
  message: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  site?: string;
};

const statusStyle: Record<TicketStatus, string> = {
  open: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-blue-100 text-blue-800',
  resolved: 'bg-emerald-100 text-emerald-800',
};

function loadLocalTickets(): Ticket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalTickets(tickets: Ticket[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function newId() {
  return `TKT-${Date.now().toString(36).toUpperCase()}`;
}

export default function SupportTicketsContent() {
  const { t, locale } = useLocale();
  const { selectedSite } = useSite();
  const lang = ['th', 'ko', 'en'].includes(locale) ? locale : 'th';

  const statusLabel: Record<TicketStatus, string> = useMemo(
    () => ({
      open: lang === 'th' ? 'เปิด' : lang === 'ko' ? '열림' : 'Open',
      in_progress: lang === 'th' ? 'ดำเนินการ' : lang === 'ko' ? '진행 중' : 'In progress',
      resolved: lang === 'th' ? 'เสร็จสิ้น' : lang === 'ko' ? '완료' : 'Resolved',
    }),
    [lang]
  );

  const priorityLabel: Record<TicketPriority, string> = useMemo(
    () => ({
      low: lang === 'th' ? 'ต่ำ' : lang === 'ko' ? '낮음' : 'Low',
      medium: lang === 'th' ? 'ปานกลาง' : lang === 'ko' ? '보통' : 'Medium',
      high: lang === 'th' ? 'สูง' : lang === 'ko' ? '높음' : 'High',
    }),
    [lang]
  );

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    message: '',
    category: 'general',
    priority: 'medium' as TicketPriority,
  });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setApiUnavailable(false);
    try {
      const res = await fetch(
        `/api/kenergy/support-tickets?site=${encodeURIComponent(selectedSite)}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const json = await res.json();
        const list = json?.tickets ?? json?.data ?? [];
        if (Array.isArray(list) && list.length > 0) {
          setTickets(list);
          return;
        }
      }
      setApiUnavailable(true);
      setTickets(loadLocalTickets());
    } catch {
      setApiUnavailable(true);
      setTickets(loadLocalTickets());
    } finally {
      setLoading(false);
    }
  }, [selectedSite]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter(
      (tk) =>
        tk.id.toLowerCase().includes(q) ||
        tk.subject.toLowerCase().includes(q) ||
        tk.message.toLowerCase().includes(q)
    );
  }, [tickets, search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;

    setSubmitting(true);
    setSuccess(false);

    const ticket: Ticket = {
      id: newId(),
      subject: form.subject.trim(),
      message: form.message.trim(),
      category: form.category,
      priority: form.priority,
      status: 'open',
      createdAt: new Date().toISOString(),
      site: selectedSite,
    };

    try {
      const res = await fetch('/api/kenergy/support-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket),
      });
      if (res.ok) {
        const json = await res.json();
        const saved = json?.ticket ?? json?.data ?? ticket;
        setTickets((prev) => [saved, ...prev]);
      } else {
        throw new Error('api');
      }
    } catch {
      const next = [ticket, ...loadLocalTickets()];
      saveLocalTickets(next);
      setTickets(next);
      setApiUnavailable(true);
    }

    setForm({ subject: '', message: '', category: 'general', priority: 'medium' });
    setShowForm(false);
    setSuccess(true);
    setSubmitting(false);
    setTimeout(() => setSuccess(false), 4000);
  }

  return (
    <div className="energy-page max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
            <MessageSquare className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-emerald-900">{t('supportTickets')}</h1>
            <p className="text-sm text-slate-500">
              {lang === 'th'
                ? 'แจ้งปัญหาและติดตามสถานะตั๋วสนับสนุน'
                : lang === 'ko'
                  ? '문제를 보고하고 티켓 상태를 추적합니다'
                  : 'Report issues and track support tickets'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('newTicket')}
        </button>
      </div>

      {apiUnavailable && (
        <p className="mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {lang === 'th'
            ? 'บันทึกตั๋วในเครื่องของคุณ (API ยังไม่พร้อม) — จะซิงค์เมื่อ backend พร้อม'
            : lang === 'ko'
              ? '로컬에 티켓 저장 (API 미연결)'
              : 'Tickets saved locally until API is available'}
        </p>
      )}

      {success && (
        <div className="mb-4 flex items-center gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {lang === 'th' ? 'ส่งตั๋วเรียบร้อยแล้ว' : lang === 'ko' ? '티켓이 제출되었습니다' : 'Ticket submitted'}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm space-y-4"
        >
          <h2 className="text-sm font-bold text-emerald-900">{t('createTicket')}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-600">
              {t('subject')}
              <input
                required
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder={t('enterSubject')}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              {t('priority')}
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priority: e.target.value as TicketPriority }))
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 outline-none"
              >
                <option value="low">{priorityLabel.low}</option>
                <option value="medium">{priorityLabel.medium}</option>
                <option value="high">{priorityLabel.high}</option>
              </select>
            </label>
          </div>
          <label className="block text-xs font-semibold text-slate-600">
            {t('topic')}
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 outline-none"
            >
              <option value="general">{t('generalFeedback')}</option>
              <option value="bug">{t('bugReport')}</option>
              <option value="feature">{t('featureRequest')}</option>
              <option value="device">{t('devicesSetting')}</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600">
            {t('description')}
            <textarea
              required
              rows={4}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              placeholder={t('pleaseProvideDetails')}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-y"
            />
          </label>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? t('submitting') : t('submitTicket')}
            </button>
          </div>
        </form>
      )}

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchTickets')}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-emerald-100 bg-white text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none"
        />
      </div>

      <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-emerald-50 bg-emerald-50/60 flex items-center justify-between">
          <h2 className="text-sm font-bold text-emerald-900">{t('myTickets')}</h2>
          <span className="text-xs text-slate-500">{filtered.length}</span>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500 text-sm">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            {t('loading')}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-slate-500">
            {lang === 'th' ? 'ยังไม่มีตั๋ว — กดสร้างตั๋วใหม่' : lang === 'ko' ? '티켓 없음' : 'No tickets yet'}
          </p>
        )}

        {!loading && filtered.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {filtered.map((tk) => (
              <li key={tk.id} className="px-4 py-4 hover:bg-emerald-50/30 transition-colors">
                <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400">{tk.id}</span>
                    <h3 className="text-sm font-semibold text-slate-800">{tk.subject}</h3>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusStyle[tk.status]}`}>
                      {statusLabel[tk.status]}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {priorityLabel[tk.priority]}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{tk.message}</p>
                <p className="text-[10px] text-slate-400 mt-2">
                  {new Date(tk.createdAt).toLocaleString(
                    lang === 'th' ? 'th-TH' : lang === 'ko' ? 'ko-KR' : 'en-US'
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
