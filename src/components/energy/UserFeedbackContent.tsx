'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/lib/LocaleContext';
import { useSite } from '@/lib/SiteContext';
import { Star, Users, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function UserFeedbackContent() {
  const { t, locale } = useLocale();
  const { selectedSite } = useSite();
  const lang = ['th', 'ko', 'en'].includes(locale) ? locale : 'th';

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('energy_system_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.name) setName(u.name);
        else if (u?.username) setName(u.username);
      }
    } catch {
      /* ignore */
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/kenergy/user-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: t('generalFeedback'),
          subject: subject.trim() || t('briefSummary'),
          message: name.trim()
            ? `${t('account')}: ${name.trim()}\n\n${message.trim()}`
            : message.trim(),
          rating,
          branch: selectedSite,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.success === false) {
        throw new Error(json.error || 'Failed');
      }

      setSuccess(true);
      setSubject('');
      setMessage('');
      setRating(5);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : lang === 'th'
            ? 'ส่งไม่สำเร็จ'
            : lang === 'ko'
              ? '제출 실패'
              : 'Submit failed'
      );
    } finally {
      setSubmitting(false);
    }
  }

  const displayRating = hoverRating || rating;

  return (
    <div className="energy-page max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
          <Users className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-emerald-900">{t('userFeedback')}</h1>
          <p className="text-sm text-slate-500">{t('weValueYourFeedbackDesc')}</p>
        </div>
      </div>

      {success && (
        <div className="mb-4 flex items-center gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {t('feedbackSubmittedSuccessfully')}
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm space-y-5"
      >
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">{t('rateYourExperience')}</p>
          <p className="text-xs text-slate-400 mb-3">{t('clickToRate')}</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 rounded transition-transform hover:scale-110"
                aria-label={`${n}`}
              >
                <Star
                  className={`h-8 w-8 ${
                    n <= displayRating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <label className="block text-xs font-semibold text-slate-600">
          {t('account')} / {lang === 'th' ? 'ชื่อ' : lang === 'ko' ? '이름' : 'Name'}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
          />
        </label>

        <label className="block text-xs font-semibold text-slate-600">
          {t('subject')}
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('briefSummary')}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
          />
        </label>

        <label className="block text-xs font-semibold text-slate-600">
          {t('description')}
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('feedbackDescription')}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none resize-y"
          />
        </label>

        <button
          type="submit"
          disabled={submitting || !message.trim()}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? t('submitting') : t('submitFeedback')}
        </button>
      </form>
    </div>
  );
}
