'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale } from '@/lib/LocaleContext';
import { useSite } from '@/lib/SiteContext';
import { formatCurrencyBySite, getCurrencyCodeBySite, getCurrencySymbolBySite } from '@/lib/currency';
import { formatEnergyDisplayUser } from '@/lib/energy/display-user';
import { GE_ADMIN_USER_KEY } from '@/lib/ge-storage-keys';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Zap, TrendingDown, DollarSign, Leaf, Phone,
  CheckCircle, Send, Activity, Cpu, Wifi, WifiOff, RefreshCw,
  Thermometer, ChevronDown, BarChart2, Users, Sprout, Download,
  AlertCircle, BrainCircuit, Lightbulb, ShieldAlert, TrendingUp, Table2,
} from 'lucide-react';
import { generateMonthlyEnergyExcel, exportToExcel } from '@/lib/excel-export';

function L(locale, th, ko, en) {
  if (locale === 'th') return th;
  if (locale === 'ko') return ko;
  return en;
}
function fmt(n) { return n.toLocaleString(); }

function readStoredCustomerUser() {
  try {
    const raw = localStorage.getItem(GE_ADMIN_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildCustomerDashboardQuery(user, deviceId) {
  const params = new URLSearchParams();
  if (user?.userId) params.set('userId', String(user.userId));
  if (user?.clientId) params.set('clientId', String(user.clientId));
  if (user?.email) params.set('email', String(user.email));
  if (user?.phone) params.set('phone', String(user.phone));
  if (user?.username) params.set('username', String(user.username));
  if (deviceId) params.set('deviceId', String(deviceId));
  return params.toString();
}

function AiAnalysisTab({ snapshot, liveData, monthlyData, savingPct, locale }) {
  const analysis = (() => {
    const alerts = [];
    const behaviors = [];
    const isOnline = snapshot?.status === 'online';
    const power  = snapshot?.totalPower ?? 0;
    const c1     = snapshot?.currentL1 ?? 0;
    const c2     = snapshot?.currentL2 ?? 0;
    const c3     = snapshot?.currentL3 ?? 0;
    const pf     = snapshot?.powerFactor ?? 0;
    const pfB    = snapshot?.powerFactorBefore ?? 0;
    const pfA    = snapshot?.powerFactorAfter  ?? pf;
    const freq   = snapshot?.frequency ?? 0;
    const freqB  = snapshot?.frequencyBefore ?? 0;
    const freqA  = snapshot?.frequencyAfter  ?? freq;
    const thdB   = snapshot?.thdBefore ?? 0;
    const thdA   = snapshot?.thdAfter ?? 0;
    const totalC = c1 + c2 + c3;

    let energyLevel = 'normal', energyScore = 0;
    if (isOnline) {
      if      (totalC > 200 || power > 200) { energyLevel = 'critical'; energyScore = 92; }
      else if (totalC > 100 || power > 100) { energyLevel = 'high';     energyScore = 70; }
      else if (totalC > 15  || power > 5)   { energyLevel = 'normal';   energyScore = 42; }
      else                                   { energyLevel = 'low';      energyScore = 12; }
    }

    if (!isOnline && snapshot) alerts.push({ type: 'err',  text: L(locale, 'อุปกรณ์ออฟไลน์ — ไม่มีข้อมูลเรียลไทม์', '기기 오프라인 — 실시간 데이터 없음', 'Device offline — no live data') });
    if (isOnline && pf > 0 && pf < 0.85) alerts.push({ type: 'warn', text: L(locale, `Power Factor ต่ำ (${pf.toFixed(3)}) ควรแก้ไข Reactive Power`, `역률 낮음 (${pf.toFixed(3)}) — 무효전력 보상 필요`, `Low PF (${pf.toFixed(3)}) — reactive power compensation needed`) });
    if (isOnline && totalC > 0) {
      const avgC = totalC / 3;
      const imb = (Math.max(Math.abs(c1-avgC), Math.abs(c2-avgC), Math.abs(c3-avgC)) / avgC) * 100;
      if (imb > 15) alerts.push({ type: 'warn', text: L(locale, `กระแสไม่สมดุล ${imb.toFixed(0)}% — อาจเกิดความร้อนสะสม`, `전류 불균형 ${imb.toFixed(0)}% — 과열 위험`, `Current imbalance ${imb.toFixed(0)}% — overheating risk`) });
    }
    if (isOnline && freq > 0 && (freq < 49.5 || freq > 50.5)) alerts.push({ type: 'warn', text: L(locale, `ความถี่ผิดปกติ ${freq.toFixed(2)} Hz (ปกติ 50 Hz)`, `주파수 이상 ${freq.toFixed(2)} Hz`, `Frequency anomaly ${freq.toFixed(2)} Hz`) });
    if (isOnline && thdA > 8)       alerts.push({ type: 'err',  text: L(locale, `THD หลังติดตั้งสูงมาก (${thdA.toFixed(1)}%) — ต้องแก้ไขด่วน`, `설치 후 THD 매우 높음 (${thdA.toFixed(1)}%) — 즉시 조치 필요`, `Critical post-install THD (${thdA.toFixed(1)}%) — urgent action needed`) });
    else if (isOnline && thdA > 5)  alerts.push({ type: 'warn', text: L(locale, `THD หลังติดตั้งสูง (${thdA.toFixed(1)}%) — ตรวจสอบฮาร์มอนิก`, `설치 후 THD 높음 (${thdA.toFixed(1)}%) — 고조파 점검`, `High post-install THD (${thdA.toFixed(1)}%) — check harmonics`) });
    if (isOnline && thdB > 0 && thdA > 0 && thdA >= thdB) alerts.push({ type: 'warn', text: L(locale, `THD ไม่ลดลงหลังติดตั้ง (ก่อน ${thdB.toFixed(1)}% / หลัง ${thdA.toFixed(1)}%)`, `설치 후 THD 미감소 (전 ${thdB.toFixed(1)}% / 후 ${thdA.toFixed(1)}%)`, `THD not reduced after install (before ${thdB.toFixed(1)}% / after ${thdA.toFixed(1)}%)`) });
    if (isOnline && energyLevel === 'critical') alerts.push({ type: 'err', text: L(locale, 'โหลดวิกฤต! ตรวจอุปกรณ์ที่ใช้กระแสไฟสูงทันที', '임계 부하! 즉시 고부하 기기 점검', 'Critical load! Check high-draw equipment immediately') });
    if (alerts.length === 0 && isOnline) alerts.push({ type: 'ok', text: L(locale, 'ระบบทำงานปกติ ไม่พบปัญหา', '시스템 정상 — 이상 없음', 'System operating normally — no issues') });

    let peakPower = 0, peakTime = '';
    liveData.forEach(d => { const p = d.totalPower ?? 0; if (p > peakPower) { peakPower = p; peakTime = d.time ? String(d.time).slice(11, 16) : ''; } });

    const savingNum = parseFloat(savingPct) || 0;
    if      (savingNum >= 20) behaviors.push({ type: 'ok',   text: L(locale, `ประสิทธิภาพดีเยี่ยม ประหยัดได้ ${savingNum}%`, `절약 우수 ${savingNum}% — 최적 운전`, `Excellent efficiency — saving ${savingNum}%`) });
    else if (savingNum >= 10) behaviors.push({ type: 'info', text: L(locale, `ประหยัดได้ ${savingNum}% — ยังมีพื้นที่พัฒนาได้`, `절약 양호 ${savingNum}% — 개선 가능`, `Saving ${savingNum}% — room for improvement`) });
    else if (savingNum > 0)   behaviors.push({ type: 'warn', text: L(locale, `ประหยัดได้น้อย ${savingNum}% — แนะนำตรวจสอบระบบ`, `절약 낮음 ${savingNum}% — 시스템 점검 권장`, `Low saving ${savingNum}% — review settings`) });
    if (energyLevel === 'high')     behaviors.push({ type: 'warn', text: L(locale, 'โหลดสูง — แนะนำตรวจอุปกรณ์ที่ใช้กระแสไฟมาก', '부하 높음 — 고소비 기기 점검', 'High load — inspect high-consumption equipment') });
    if (energyLevel === 'critical') behaviors.push({ type: 'err',  text: L(locale, 'โหลดวิกฤต — ควรปิดอุปกรณ์ที่ไม่จำเป็นทันที', '임계 부하 — 불필요한 기기 즉시 차단', 'Critical — shut off non-essential equipment') });
    if (energyLevel === 'low')      behaviors.push({ type: 'info', text: L(locale, 'โหลดต่ำ — ระบบพักหรือใช้งานน้อย', '저부하 — 대기/저사용 상태', 'Low load — system idle or lightly used') });
    if (monthlyData.length >= 2) {
      const last = monthlyData[monthlyData.length - 1], prev = monthlyData[monthlyData.length - 2];
      if (prev?.before > 0) {
        const t = ((last.before - prev.before) / prev.before) * 100;
        if      (t > 10)  behaviors.push({ type: 'warn', text: L(locale, `การใช้ไฟเพิ่ม ${t.toFixed(0)}% เทียบเดือนก่อน`,  `전월 대비 ${t.toFixed(0)}% 증가`,             `Usage up ${t.toFixed(0)}% vs last month`) });
        else if (t < -10) behaviors.push({ type: 'ok',   text: L(locale, `การใช้ไฟลด ${Math.abs(t).toFixed(0)}% เทียบเดือนก่อน`, `전월 대비 ${Math.abs(t).toFixed(0)}% 감소`, `Usage down ${Math.abs(t).toFixed(0)}% vs last month`) });
      }
    }
    if (behaviors.length === 0) behaviors.push({ type: 'info', text: L(locale, 'รูปแบบการใช้ไฟปกติ ไม่พบพฤติกรรมผิดปกติ', '정상 사용 패턴', 'Normal usage pattern — no anomalies') });

    let forecast = '';
    if (monthlyData.length >= 3) {
      const last3 = monthlyData.slice(-3);
      const avgB = last3.reduce((s, d) => s + d.before, 0) / 3;
      const avgA = last3.reduce((s, d) => s + d.after,  0) / 3;
      const pct  = avgB > 0 ? ((avgB - avgA) / avgB * 100).toFixed(1) : '0.0';
      const kwh  = (avgB - avgA).toFixed(0);
      forecast = L(locale, `จากแนวโน้ม 3 เดือนล่าสุด คาดการณ์เดือนหน้าจะประหยัดได้ ~${pct}% (${kwh} kWh)`, `최근 3개월 추세 기준 다음달 약 ${pct}% 절약 예상 (${kwh} kWh)`, `3-month trend → next month forecast ~${pct}% saving (${kwh} kWh)`);
    }
    return { isOnline, energyLevel, energyScore, alerts, behaviors, forecast, peakPower, peakTime, pf, pfB, pfA, freq, freqB, freqA, power, thdB, thdA };
  })();

  const { isOnline, energyLevel, energyScore, alerts, behaviors, forecast, peakPower, peakTime, pf, pfB, pfA, freq, freqB, freqA, power, thdB, thdA } = analysis;
  const levelLabel = { low: L(locale,'ต่ำ','낮음','Low'), normal: L(locale,'ปกติ','정상','Normal'), high: L(locale,'สูง','높음','High'), critical: L(locale,'วิกฤต','위험','Critical') }[energyLevel];
  const dotClass   = { ok: '--ok', warn: '--warn', info: '--info', err: '--err' };

  return (
    <div className="cd-stack">
      <div className="cd-ai-tab-header">
        <div className="cd-ai-tab-icon"><BrainCircuit className="w-5 h-5" /></div>
        <div className="flex-1 min-w-0">
          <h2 className="cd-ai-tab-title">{L(locale,'AI วิเคราะห์พลังงาน','AI 에너지 분석','AI Energy Analysis')}</h2>
          <p className="cd-ai-tab-sub">{L(locale,'วิเคราะห์เรียลไทม์ · คาดการณ์ · แจ้งเตือน','실시간 분석 · 예측 · 알림','Real-time analysis · Forecast · Alerts')}</p>
        </div>
        {isOnline && <span className="cd-ai-live-chip"><span className="cd-ai-live-chip-dot" />LIVE</span>}
      </div>

      <div className="cd-ai-level-row">
        <div className="cd-ai-metric-card">
          <p className="cd-ai-metric-label">{L(locale,'ระดับการใช้ไฟ','부하 수준','Energy Level')}</p>
          <p className="cd-ai-metric-val">{power > 0 ? `${power.toFixed(1)} kW` : '—'}</p>
          <span className={`cd-ai-level-pill cd-ai-level-pill--${energyLevel}`}>{levelLabel}</span>
          <div className="cd-ai-level-bar-wrap"><div className={`cd-ai-level-bar cd-ai-level-bar--${energyLevel}`} style={{ width: `${energyScore}%` }} /></div>
        </div>
        <div className="cd-ai-metric-card">
          <p className="cd-ai-metric-label">{L(locale,'Peak Load วันนี้','오늘 피크','Today\'s Peak')}</p>
          <p className="cd-ai-metric-val">{peakPower > 0 ? `${peakPower.toFixed(1)} kW` : '—'}</p>
          <p className="cd-ai-metric-sub">{peakTime ? `${L(locale,'เวลา','시각','At')} ${peakTime}` : L(locale,'ยังไม่มีข้อมูล','데이터 없음','No data yet')}</p>
        </div>
        <div className="cd-ai-metric-card">
          <p className="cd-ai-metric-label">{L(locale,'Power Factor','역률','Power Factor')}</p>
          <div className="cd-ai-thd-row">
            <div>
              <p className="cd-ai-thd-tag">{L(locale,'ก่อน','전','Before')}</p>
              <p className="cd-ai-metric-val" style={{ fontSize: '0.875rem' }}>{pfB > 0 ? pfB.toFixed(3) : '—'}</p>
            </div>
            <div className="cd-ai-thd-arrow">→</div>
            <div>
              <p className="cd-ai-thd-tag">{L(locale,'หลัง','후','After')}</p>
              <p className="cd-ai-metric-val" style={{ fontSize: '0.875rem', color: pfA >= 0.95 ? '#059669' : pfA >= 0.85 ? '#065f46' : pfA > 0 ? '#d97706' : undefined }}>
                {pfA > 0 ? pfA.toFixed(3) : '—'}
              </p>
            </div>
          </div>
          <p className="cd-ai-metric-sub">{pfA > 0 ? (pfA >= 0.95 ? '✅ Excellent' : pfA >= 0.85 ? '✅ Good' : '⚠️ Low') : ''}</p>
        </div>
        <div className="cd-ai-metric-card">
          <p className="cd-ai-metric-label">{L(locale,'ความถี่','주파수','Frequency')}</p>
          <div className="cd-ai-thd-row">
            <div>
              <p className="cd-ai-thd-tag">{L(locale,'ก่อน','전','Before')}</p>
              <p className="cd-ai-metric-val" style={{ fontSize: '0.875rem' }}>{freqB > 0 ? `${freqB.toFixed(2)}` : '—'}</p>
            </div>
            <div className="cd-ai-thd-arrow">→</div>
            <div>
              <p className="cd-ai-thd-tag">{L(locale,'หลัง','후','After')}</p>
              <p className="cd-ai-metric-val" style={{ fontSize: '0.875rem', color: freqA > 0 && Math.abs(freqA - 50) <= 0.3 ? '#059669' : freqA > 0 ? '#d97706' : undefined }}>
                {freqA > 0 ? `${freqA.toFixed(2)} Hz` : '—'}
              </p>
            </div>
          </div>
          <p className="cd-ai-metric-sub">{freqA > 0 ? (Math.abs(freqA - 50) <= 0.3 ? '✅ Stable' : '⚠️ Check') : ''}</p>
        </div>
        <div className="cd-ai-metric-card">
          <p className="cd-ai-metric-label">{L(locale,'THD วิเคราะห์','THD 분석','THD Analysis')}</p>
          <div className="cd-ai-thd-row">
            <div>
              <p className="cd-ai-thd-tag">{L(locale,'ก่อน','전','Before')}</p>
              <p className="cd-ai-metric-val" style={{ fontSize: '0.875rem' }}>{thdB > 0 ? `${thdB.toFixed(1)}%` : '—'}</p>
            </div>
            <div className="cd-ai-thd-arrow">→</div>
            <div>
              <p className="cd-ai-thd-tag">{L(locale,'หลัง','후','After')}</p>
              <p className="cd-ai-metric-val" style={{ fontSize: '0.875rem', color: thdA > 5 ? '#dc2626' : thdA > 0 ? '#059669' : '#065f46' }}>
                {thdA > 0 ? `${thdA.toFixed(1)}%` : '—'}
              </p>
            </div>
          </div>
          <p className="cd-ai-metric-sub">
            {thdB > 0 && thdA > 0
              ? thdA < thdB
                ? `✅ ${L(locale,`ลด ${(thdB - thdA).toFixed(1)}%`,`${(thdB - thdA).toFixed(1)}% 감소`,`Reduced ${(thdB - thdA).toFixed(1)}%`)}`
                : `⚠️ ${L(locale,'ไม่ลดลง','미감소','Not reduced')}`
              : L(locale,'ไม่มีข้อมูล','데이터 없음','No data')}
          </p>
        </div>
        <div className="cd-ai-metric-card">
          <p className="cd-ai-metric-label">{L(locale,'กระแส L1 / L2 / L3','전류 L1/L2/L3','Current L1 / L2 / L3')}</p>
          {[
            { phase: 'L1', before: snapshot?.voltageL1 ?? 0, after: snapshot?.currentL1 ?? 0 },
            { phase: 'L2', before: snapshot?.voltageL2 ?? 0, after: snapshot?.currentL2 ?? 0 },
            { phase: 'L3', before: snapshot?.voltageL3 ?? 0, after: snapshot?.currentL3 ?? 0 },
          ].map(({ phase, before, after }) => (
            <div key={phase} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#6366f1', minWidth: '1.25rem' }}>{phase}</span>
              <div className="cd-ai-thd-row" style={{ flex: 1 }}>
                <div>
                  <p className="cd-ai-thd-tag">{L(locale,'ก่อน','전','Before')}</p>
                  <p className="cd-ai-metric-val" style={{ fontSize: '0.8rem' }}>{before > 0 ? `${before.toFixed(1)} A` : '—'}</p>
                </div>
                <div className="cd-ai-thd-arrow">→</div>
                <div>
                  <p className="cd-ai-thd-tag">{L(locale,'หลัง','후','After')}</p>
                  <p className="cd-ai-metric-val" style={{ fontSize: '0.8rem', color: after > 0 && before > 0 ? (after < before ? '#059669' : after > before * 1.05 ? '#d97706' : '#1e293b') : undefined }}>
                    {after > 0 ? `${after.toFixed(1)} A` : '—'}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <p className="cd-ai-metric-sub">
            {(() => {
              const vals = [
                { b: snapshot?.voltageL1 ?? 0, a: snapshot?.currentL1 ?? 0 },
                { b: snapshot?.voltageL2 ?? 0, a: snapshot?.currentL2 ?? 0 },
                { b: snapshot?.voltageL3 ?? 0, a: snapshot?.currentL3 ?? 0 },
              ];
              const all = vals.filter(v => v.b > 0 && v.a > 0);
              if (!all.length) return L(locale,'ไม่มีข้อมูล','데이터 없음','No data');
              const totalB = all.reduce((s, v) => s + v.b, 0);
              const totalA = all.reduce((s, v) => s + v.a, 0);
              const avgB = totalB / all.length, avgA = totalA / all.length;
              const imb = avgA > 0
                ? (Math.max(...vals.map(v => Math.abs((v.a || avgA) - avgA))) / avgA * 100).toFixed(1)
                : null;
              return imb !== null
                ? `${Number(imb) > 10 ? '⚠️' : '✅'} ${L(locale,`ไม่สมดุล ${imb}%`,`불균형 ${imb}%`,`Imbalance ${imb}%`)}`
                : L(locale,'ไม่มีข้อมูล','데이터 없음','No data');
            })()}
          </p>
        </div>
      </div>

      <div className="cd-ai-two-col">
        <div className="cd-ai-section-card">
          <div className="cd-ai-section-head"><ShieldAlert className="w-4 h-4 text-amber-500" />{L(locale,'สิ่งที่ควรระวัง','주의 사항','Alerts & Warnings')}</div>
          {alerts.map((a, i) => (
            <div key={i} className="cd-ai-alert-item">
              <span className={`cd-ai-alert-dot cd-ai-alert-dot${dotClass[a.type]}`} />{a.text}
            </div>
          ))}
        </div>
        <div className="cd-ai-section-card">
          <div className="cd-ai-section-head"><Lightbulb className="w-4 h-4 text-amber-500" />{L(locale,'ประเมินพฤติกรรมการใช้ไฟ','전력 사용 패턴 분석','Behavior Assessment')}</div>
          {behaviors.map((b, i) => (
            <div key={i} className="cd-ai-alert-item">
              <span className={`cd-ai-alert-dot cd-ai-alert-dot${dotClass[b.type]}`} />{b.text}
            </div>
          ))}
        </div>
      </div>

      {forecast && (
        <div className="cd-ai-forecast-strip">
          <div className="cd-ai-forecast-strip-icon"><TrendingUp className="w-4 h-4" /></div>
          <div>
            <p className="cd-ai-forecast-strip-label">{L(locale,'การคาดการณ์','예측','Forecast')}</p>
            <p className="cd-ai-forecast-strip-text">{forecast}</p>
          </div>
        </div>
      )}

      {monthlyData.length > 0 && (
        <div className="cd-card">
          <div className="cd-card-accent cd-card-accent--energy" />
          <div className="cd-card-body">
            <h3 className="cd-card-title">{L(locale,'แนวโน้มรายเดือน (kWh)','월별 추세 (kWh)','Monthly Trend (kWh)')}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData.map(d => {
                const th = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
                const en = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                const ko = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
                const idx = Math.max(0, Math.min(11, d.monthIndex - 1));
                return { name: locale === 'th' ? th[idx] : locale === 'ko' ? ko[idx] : en[idx], before: d.before, after: d.after };
              })}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <Tooltip formatter={v => Number(v).toLocaleString()} />
                <Legend />
                <Line type="monotone" dataKey="before" name={L(locale,'ก่อนติดตั้ง','설치 전','Before')} stroke="#b45309" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="after"  name={L(locale,'หลังติดตั้ง','설치 후','After')}  stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {!snapshot && (
        <div className="cd-ai-empty">
          <div className="cd-ai-empty-icon"><BrainCircuit className="w-6 h-6 text-gray-400" /></div>
          <p className="text-sm">{L(locale,'กำลังโหลดข้อมูลอุปกรณ์...','기기 데이터 로딩 중...','Loading device data...')}</p>
        </div>
      )}
    </div>
  );
}

function AiEnergyInsightPanel({ monthlyData, locale, site }) {
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    if (!monthlyData || monthlyData.length === 0) {
      setAiInsights(null);
      return;
    }

    const fetchAiInsights = async () => {
      setAiLoading(true);
      setAiError(null);
      try {
        const response = await fetch('/api/ge-energy/ai-energy-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monthly: monthlyData, locale, site }),
        });

        const json = await response.json();
        if (json.success && json.data?.insights) {
          setAiInsights(json.data);
        } else {
          setAiError(json.error || 'Failed to load AI insights');
        }
      } catch (err) {
        setAiError(err instanceof Error ? err.message : 'Error loading insights');
      } finally {
        setAiLoading(false);
      }
    };

    fetchAiInsights();
  }, [monthlyData, locale, site]);

  if (aiLoading) {
    return (
      <div className="cd-card cd-ai-panel">
        <div className="cd-card-accent cd-card-accent--energy" />
        <div className="cd-card-body">
          <h2 className="cd-card-title">{L(locale, 'AI วิเคราะห์แนวโน้มไฟ', 'AI 전력 분석', 'AI Energy Analysis')}</h2>
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-emerald-600" />
            <p>{L(locale, 'กำลังวิเคราะห์...', '분석 중...', 'Analyzing...')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!aiInsights) return null;

  const { insights, aiAvailable, ruleBasedFallback } = aiInsights;
  const fallbackLabel = ruleBasedFallback ? ` (${L(locale, 'วิเคราะห์อัตโนมัติ', '자동 분석', 'Auto Analysis')})` : '';

  return (
    <div className="cd-card cd-ai-panel">
      <div className="cd-card-accent cd-card-accent--energy" />
      <div className="cd-card-body">
        <h2 className="cd-card-title">
          {L(locale, 'AI วิเคราะห์แนวโน้มไฟ', 'AI 전력 분석', 'AI Energy Analysis')}
          {fallbackLabel}
        </h2>

        {/* Trend Summary */}
        <div className="cd-ai-section">
          <div className="cd-ai-badge-trend">
            <TrendingDown className="w-4 h-4" />
            <span>{insights.trend}</span>
          </div>
        </div>

        {/* Problems */}
        {insights.problems && insights.problems.length > 0 && (
          <div className="cd-ai-section">
            <h3 className="cd-ai-subtitle">{L(locale, 'ปัญหาที่พบ', '발견된 문제', 'Issues Detected')}</h3>
            <div className="space-y-2">
              {insights.problems.map((prob, i) => (
                <div key={i} className="cd-ai-problem-card">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{prob}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Load Patterns */}
        <div className="cd-ai-load-patterns">
          <div className="cd-ai-load-card cd-ai-load-heavy">
            <Activity className="w-5 h-5" />
            <div>
              <p className="cd-ai-load-label">{L(locale, 'โหลดหนัก', '무거운 부하', 'Heavy Load')}</p>
              <p className="cd-ai-load-months">
                {insights.heavyLoad?.months?.length > 0
                  ? insights.heavyLoad.months.join(', ')
                  : L(locale, 'ไม่มี', '없음', 'None')}
              </p>
              <p className="cd-ai-load-reason">{insights.heavyLoad?.reason}</p>
            </div>
          </div>

          <div className="cd-ai-load-card cd-ai-load-light">
            <Sprout className="w-5 h-5" />
            <div>
              <p className="cd-ai-load-label">{L(locale, 'โหลดเบา', '가벼운 부하', 'Light Load')}</p>
              <p className="cd-ai-load-months">
                {insights.lightLoad?.months?.length > 0
                  ? insights.lightLoad.months.join(', ')
                  : L(locale, 'ไม่มี', '없음', 'None')}
              </p>
              <p className="cd-ai-load-reason">{insights.lightLoad?.reason}</p>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {insights.recommendations && insights.recommendations.length > 0 && (
          <div className="cd-ai-section">
            <h3 className="cd-ai-subtitle">{L(locale, 'ข้อเสนอแนะ', '권장 사항', 'Recommendations')}</h3>
            <ul className="space-y-2">
              {insights.recommendations.map((rec, i) => (
                <li key={i} className="cd-ai-rec-item">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Forecast */}
        {insights.forecast && (
          <div className="cd-ai-forecast">
            <Zap className="w-4 h-4" />
            <div>
              <p className="cd-ai-forecast-label">{L(locale, 'การพยากรณ์', '예측', 'Forecast')}</p>
              <p>{insights.forecast}</p>
            </div>
          </div>
        )}

        {aiError && <p className="cd-error">{aiError}</p>}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const { locale } = useLocale();
  const { selectedSite, setSelectedSite } = useSite();
  const [activeTab, setActiveTab] = useState('energy');
  const [monthlyData, setMonthlyData] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [monthlyError, setMonthlyError] = useState(null);
  const [customerUser, setCustomerUser] = useState(null);
  const [customerMeters, setCustomerMeters] = useState([]);
  const [selectedMeterDeviceId, setSelectedMeterDeviceId] = useState('');
  const [billingSite, setBillingSite] = useState('thailand');
  const [electricityRate, setElectricityRate] = useState(null);

  // ── Live monitoring state ──
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [liveData, setLiveData] = useState([]);
  const [snapshot, setSnapshot] = useState(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveMetric, setLiveMetric] = useState('current');
  const [deviceDetails, setDeviceDetails] = useState(null);
  const liveTimer = useRef(null);
  const monitorTimer = useRef(null);
  const [monitorSeries, setMonitorSeries] = useState([]);
  const [monitorSnapshot, setMonitorSnapshot] = useState(null);
  const [monitorLoading, setMonitorLoading] = useState(false);
  const [monitorError, setMonitorError] = useState(null);
  const [lastMonitorAt, setLastMonitorAt] = useState(null);
  const [monitorMinutes, setMonitorMinutes] = useState(30);
  const [monitorMetric, setMonitorMetric] = useState('current');
  const [isLivePulse, setIsLivePulse] = useState(false);

  const monitorMetricOptions = [
    { key: 'current', label: L(locale, 'กระแสไฟ', '전류', 'Current') },
    { key: 'power', label: L(locale, 'กำลังไฟ', '전력', 'Power') },
    { key: 'voltage', label: L(locale, 'แรงดัน', '전압', 'Voltage') },
    { key: 'frequency', label: L(locale, 'ความถี่', '주파수', 'Frequency') },
    { key: 'stability', label: L(locale, 'ความเสถียร', '안정성', 'Stability') },
    { key: 'reactive', label: L(locale, 'การกักเก็บกระแสไฟ', '무효전력', 'Reactive') },
  ];
  const [sendingContact, setSendingContact] = useState(false);
  const [contactError, setContactError] = useState(null);
  const [welcomeName, setWelcomeName] = useState('');

  const totalBefore = monthlyData.reduce((s, d) => s + d.before, 0);
  const totalAfter = monthlyData.reduce((s, d) => s + d.after, 0);
  const totalSavedKwh = totalBefore - totalAfter;
  const totalCostBefore = monthlyData.reduce((s, d) => s + d.costBefore, 0);
  const totalCostAfter = monthlyData.reduce((s, d) => s + d.costAfter, 0);
  const totalSavedCost = totalCostBefore - totalCostAfter;
  const savingPct = totalBefore > 0 ? ((totalSavedKwh / totalBefore) * 100).toFixed(1) : '0.0';
  const co2Saved = (totalSavedKwh * 0.5313).toFixed(0);
  const currencySymbol = getCurrencySymbolBySite(billingSite, locale);
  const currencyCode = getCurrencyCodeBySite(billingSite, locale);
  const formatCost = (n) =>
    formatCurrencyBySite(n, billingSite, locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const labelCostBefore = L(locale, `ก่อน (${currencySymbol})`, `이전 (${currencySymbol})`, `Before (${currencyCode})`);
  const labelCostAfter = L(locale, `หลัง (${currencySymbol})`, `이후 (${currencySymbol})`, `After (${currencyCode})`);
  const labelCostSaved = L(locale, `ประหยัด (${currencySymbol})`, `절약 (${currencySymbol})`, `Saved (${currencyCode})`);
  const labelMonthlyCost = L(
    locale,
    `ค่าใช้จ่ายรายเดือน (${currencyCode})`,
    `월별 전기 요금 (${currencyCode})`,
    `Monthly Cost (${currencyCode})`,
  );
  const labelMonthlyEnergy = L(locale, 'การใช้ไฟฟ้ารายเดือน (kWh)', '월별 전력 사용량 (kWh)', 'Monthly Energy (kWh)');

  const normalizeSnapshot = (raw, connection) => {
    const payload = raw;
    const metrics = payload?.metrics ?? (raw) ?? {};
    const toNumber = (value) => {
      const n = Number(value);
      return Number.isFinite(n) ? n : 0;
    };

    return {
      status: String(connection || '').toUpperCase() === 'ONLINE' ? 'online' : 'offline',
      totalPower: toNumber(metrics.totalPower),
      currentL1: toNumber(Array.isArray(metrics.current) ? metrics.current[0] : metrics.currentL1),
      currentL2: toNumber(Array.isArray(metrics.current) ? metrics.current[1] : metrics.currentL2),
      currentL3: toNumber(Array.isArray(metrics.current) ? metrics.current[2] : metrics.currentL3),
      powerFactor: toNumber(metrics.powerFactor),
      powerFactorBefore: toNumber(metrics.powerFactorBefore ?? metrics.pfBefore ?? 0),
      powerFactorAfter:  toNumber(metrics.powerFactorAfter  ?? metrics.pfAfter  ?? metrics.powerFactor ?? 0),
      voltageL1: toNumber(Array.isArray(metrics.voltageLL) ? metrics.voltageLL[0] : metrics.voltageL1),
      voltageL2: toNumber(Array.isArray(metrics.voltageLL) ? metrics.voltageLL[1] : metrics.voltageL2),
      voltageL3: toNumber(Array.isArray(metrics.voltageLL) ? metrics.voltageLL[2] : metrics.voltageL3),
      frequency: toNumber(metrics.frequency),
      frequencyBefore: toNumber(metrics.frequencyBefore ?? metrics.freqBefore ?? 0),
      frequencyAfter:  toNumber(metrics.frequencyAfter  ?? metrics.freqAfter  ?? metrics.frequency ?? 0),
      reactivePower: toNumber(metrics.reactivePower),
      thdBefore: toNumber(metrics.thdBefore),
      thdAfter: toNumber(metrics.thdAfter),
      energySaved: toNumber(metrics.energySaved),
      co2Saved: toNumber(metrics.co2Saved),
    };
  };

  useEffect(() => {
    const parsed = readStoredCustomerUser();
    setCustomerUser(parsed);
    const { displayName } = formatEnergyDisplayUser(parsed || {});
    setWelcomeName(displayName || '');
  }, []);

  useEffect(() => {
    let active = true;
    setMonthlyLoading(true);

    const user = customerUser || readStoredCustomerUser();
    const query = buildCustomerDashboardQuery(user, selectedMeterDeviceId || undefined);

    fetch(`/api/ge-energy/customer-dashboard?${query}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(j => {
        if (!active) return;
        if (j.success && Array.isArray(j.data?.monthly)) {
          setMonthlyData(j.data.monthly);
          setCustomerMeters(Array.isArray(j.data.meters) ? j.data.meters : []);
          const site = j.data.primarySite || 'thailand';
          setBillingSite(site);
          setSelectedSite(site);
          setElectricityRate(j.data.summary?.electricityRate ?? null);
          setMonthlyError(null);

          const meterDevices = (j.data.meters || []).map((m) => ({
            deviceID: m.deviceId,
            deviceName: m.deviceName || m.label,
            connection: 'ONLINE',
          }));
          if (meterDevices.length > 0) {
            setDevices(meterDevices);
            const keepId = selectedMeterDeviceId || selectedDeviceId;
            const allowed = meterDevices.some((d) => String(d.deviceID) === String(keepId));
            const nextId = allowed ? String(keepId) : String(meterDevices[0].deviceID);
            if (!selectedDeviceId || !allowed) setSelectedDeviceId(nextId);
          }
        } else {
          setMonthlyError(j.error || 'Failed to load monthly comparison data');
        }
      })
      .catch(() => {
        if (active) setMonthlyError('Failed to load monthly comparison data');
      })
      .finally(() => {
        if (active) setMonthlyLoading(false);
      });

    return () => {
      active = false;
    };
  }, [customerUser, selectedMeterDeviceId, setSelectedSite]);

  useEffect(() => {
    if (!selectedDeviceId) return;
    fetchLive();
    if (liveTimer.current) clearInterval(liveTimer.current);
    liveTimer.current = setInterval(fetchLiveSnapshot, 30000);
    return () => { if (liveTimer.current) clearInterval(liveTimer.current); };
  }, [selectedDeviceId]);

  async function fetchCustomerMonitor() {
    if (!selectedDeviceId) return;
    setMonitorLoading(true);
    setMonitorError(null);
    try {
      const res = await fetch(
        `/api/ge-energy/customer-live-monitor?site=${encodeURIComponent(selectedSite)}&deviceId=${encodeURIComponent(selectedDeviceId)}&minutes=${monitorMinutes}`,
        { cache: 'no-store' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to load monitor data');
      }
      if (Array.isArray(json.devices) && json.devices.length > 0) {
        setDevices(json.devices);
      }
      setMonitorSeries(json.series || []);
      setMonitorSnapshot(json.snapshot || null);
      setLastMonitorAt(json.timestamp || new Date().toISOString());
      setIsLivePulse(Boolean(json.snapshot?.isOnline));
    } catch (err) {
      setMonitorError(err instanceof Error ? err.message : 'Failed to load monitor data');
      setMonitorSeries([]);
      setMonitorSnapshot(null);
      setIsLivePulse(false);
    } finally {
      setMonitorLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab !== 'monitor' || !selectedDeviceId) return undefined;
    fetchCustomerMonitor();
    if (monitorTimer.current) clearInterval(monitorTimer.current);
    monitorTimer.current = setInterval(fetchCustomerMonitor, 10000);
    return () => {
      if (monitorTimer.current) clearInterval(monitorTimer.current);
    };
  }, [activeTab, selectedDeviceId, selectedSite, monitorMinutes]);

  async function fetchLive() {
    setLiveLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [histRes, snapRes, devRes] = await Promise.all([
        fetch(`/api/ge-energy/device-history?deviceId=${selectedDeviceId}&period=hour&from=${today}&to=${today}&limit=24`),
        fetch(`/api/ge-energy/device-monitoring?deviceId=${selectedDeviceId}`),
        fetch(`/api/ge-energy/devices-setting?site=all`),
      ]);
      const histJson = await histRes.json();
      const snapJson = await snapRes.json();
      const devJson  = await devRes.json();
      if (histJson.success) {
        const history = Array.isArray(histJson.history)
          ? histJson.history
          : Array.isArray(histJson.data)
            ? histJson.data
            : [];
        setLiveData(history);
      }

      let found = null;
      if (devJson.success) {
        found = devJson.devices?.find(d => String(d.deviceID) === String(selectedDeviceId));
        if (found) setDeviceDetails(found);
      }
      if (snapJson.success) setSnapshot(normalizeSnapshot(snapJson.data, found?.connection));
    } catch {}
    setLiveLoading(false);
  }

  async function fetchLiveSnapshot() {
    if (!selectedDeviceId) return;
    try {
      const r = await fetch(`/api/ge-energy/device-monitoring?deviceId=${selectedDeviceId}`);
      const j = await r.json();
      if (j.success) setSnapshot(normalizeSnapshot(j.data, deviceDetails?.connection));
    } catch {}
  }
  const [chartType, setChartType] = useState('bar');
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const monthLabel = (d) => {
    const th = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const en = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const ko = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const idx = Math.max(0, Math.min(11, d.monthIndex - 1));
    return locale === 'th' ? th[idx] : locale === 'ko' ? ko[idx] : en[idx];
  };

  const chartData = monthlyData.map(d => ({
    name: monthLabel(d),
    [L(locale,'ก่อนติดตั้ง','설치 전','Before')]: d.before,
    [L(locale,'หลังติดตั้ง','설치 후','After')]: d.after,
    [labelCostBefore]: d.costBefore,
    [labelCostAfter]: d.costAfter,
  }));

  const keyBefore  = L(locale,'ก่อนติดตั้ง','설치 전','Before');
  const keyAfter   = L(locale,'หลังติดตั้ง','설치 후','After');
  const keyCostB   = labelCostBefore;
  const keyCostA   = labelCostAfter;

  async function handleSend(e) {
    e.preventDefault();

    setSendingContact(true);
    setContactError(null);

    try {
      const response = await fetch('/api/ge-energy/user-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'General Feedback',
          subject: `Customer Dashboard Contact - ${contactForm.name}`,
          message: `Name: ${contactForm.name}\nPhone: ${contactForm.phone}\nEmail: ${contactForm.email || '-'}\n\n${contactForm.message}`,
          rating: 5,
          branch: selectedSite
        })
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to send message');
      }

      setSent(true);
      setContactForm({ name: '', phone: '', email: '', message: '' });
    } catch (error) {
      setContactError(error instanceof Error ? error.message : 'Failed to send message');
      setSent(false);
    } finally {
      setSendingContact(false);
    }
  }

  const tabs = [
    { key: 'energy',  label: L(locale,'กราฟไฟฟ้า','전력 그래프','Energy'),   icon: BarChart2 },
    { key: 'cost',    label: L(locale,'กราฟค่าไฟ','비용 그래프','Cost'),      icon: DollarSign },
    { key: 'ai',      label: L(locale,'AI วิเคราะห์','AI 분석','AI Analysis'), icon: BrainCircuit },
    { key: 'live',    label: L(locale,'ไฟปัจจุบัน','실시간','Live'),          icon: Activity },
    { key: 'monitor', label: L(locale,'มอนิเตอร์เรียลไทม์','실시간 모니터','Real-time Monitor'), icon: Cpu },
    { key: 'compare', label: L(locale,'เปรียบเทียบ','비교표','Compare'),      icon: Table2 },
    { key: 'contact', label: L(locale,'ติดต่อ','연락','Contact'),             icon: Users },
  ];

  const kpiItems = [
    { icon: Zap, val: `${fmt(totalSavedKwh)} kWh`, label: L(locale,'ไฟฟ้าที่ประหยัด','절약 전력량','Energy Saved'), tone: 'energy' },
    { icon: DollarSign, val: formatCost(totalSavedCost), label: L(locale,`ค่าไฟที่ประหยัด (${currencySymbol})`,`절약 비용 (${currencySymbol})`,`Cost Saved (${currencyCode})`), tone: 'cost' },
    { icon: TrendingDown, val: `${savingPct}%`, label: L(locale,'% ที่ประหยัด','절약률','Saving Rate'), tone: 'rate' },
    { icon: Leaf, val: `${fmt(Number(co2Saved))} kg`, label: L(locale,'CO₂ ที่ลดได้','CO₂ 절감량','CO₂ Reduced'), tone: 'co2' },
  ];

  return (
    <div className="cd-page-content">

      <div className="cd-hero">
        <div className="cd-hero-blob cd-hero-blob--a" aria-hidden />
        <div className="cd-hero-blob cd-hero-blob--b" aria-hidden />
        <div className="cd-hero-pattern" aria-hidden />
        <div className="cd-hero-top">
          <div className="cd-hero-icon">
            <Sprout className="w-5 h-5" strokeWidth={2.25} />
          </div>
          <div>
            {welcomeName ? (
              <p className="cd-hero-welcome">
                {locale === 'ko' ? (
                  <><strong>{welcomeName}</strong>님, 환영합니다</>
                ) : locale === 'en' ? (
                  <>Welcome, <strong>{welcomeName}</strong></>
                ) : (
                  <>ยินดีต้อนรับ, <strong>{welcomeName}</strong></>
                )}
              </p>
            ) : null}
            <h1 className="cd-hero-title">{L(locale,'รายงานเปรียบเทียบพลังงาน','에너지 비교 보고서','Energy Comparison Report')}</h1>
            <p className="cd-hero-sub">{L(locale,'เปรียบเทียบการใช้ไฟฟ้าและค่าใช้จ่ายก่อน-หลัง','설치 전후 전력 사용량 및 비용 비교','Electricity usage & cost comparison before/after installation')}</p>
            <span className="cd-hero-badge">
              <span className="cd-hero-badge-dot" />
              {L(locale,'พลังงานสะอาด · รักโลก','친환경 · 그린 에너지','Clean energy · Eco friendly')}
            </span>
          </div>
        </div>
        <div className="cd-kpi-grid">
          {kpiItems.map(({ icon: Icon, val, label, tone }) => (
            <div key={label} className="cd-kpi-card">
              <div className={`cd-kpi-icon cd-kpi-icon--${tone}`}>
                <Icon className="w-4 h-4" strokeWidth={2.25} />
              </div>
              <p className="cd-kpi-val">{val}</p>
              <p className="cd-kpi-label">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="cd-main">
        <nav className="cd-tab-sticky" aria-label={L(locale,'เมนูหลัก','메인 메뉴','Main menu')}>
          <div className="cd-tab-scroll">
            {tabs.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`cd-tab-btn${activeTab === tab.key ? ' cd-tab-btn--active' : ''}`}
              >
                <tab.icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2.25} />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* ── Energy / Cost Charts ── */}
        {(activeTab === 'energy' || activeTab === 'cost') && (
          <div className="cd-stack">
            {customerMeters.length > 0 && (
              <div className="cd-meter-toolbar">
                <label htmlFor="cd-meter-select" className="cd-meter-toolbar-label">
                  {L(locale, 'มิเตอร์ของคุณ', '내 미터', 'Your meters')}
                </label>
                <div className="cd-meter-toolbar-row">
                  <select
                    id="cd-meter-select"
                    className="cd-meter-select"
                    value={selectedMeterDeviceId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSelectedMeterDeviceId(v);
                      if (v) setSelectedDeviceId(v);
                    }}
                  >
                    <option value="">{L(locale, 'ทุกมิเตอร์', '전체 미터', 'All meters')}</option>
                    {customerMeters.map((m) => (
                      <option key={m.deviceId} value={String(m.deviceId)}>
                        {m.label}{m.locationName ? ` · ${m.locationName}` : ''} ({m.site})
                      </option>
                    ))}
                  </select>
                  {electricityRate != null && (
                  <span className="cd-meter-rate">
                    {L(locale, 'อัตราไฟ', '요금', 'Rate')}: {fmt(electricityRate)} / kWh ({currencyCode})
                  </span>
                  )}
                </div>
              </div>
            )}

            {!monthlyLoading && customerUser && customerMeters.length === 0 && (
              <p className="cd-error">
                {L(
                  locale,
                  'ไม่พบมิเตอร์ที่ผูกกับบัญชีนี้ กรุณาติดต่อผู้ดูแลระบบ',
                  '이 계정에 연결된 미터가 없습니다. 관리자에게 문의하세요.',
                  'No meters linked to this account. Please contact support.',
                )}
              </p>
            )}

            {activeTab === 'energy' && (
              <div className="cd-segment">
                <button type="button" onClick={() => setChartType('bar')}
                  className={`cd-segment-btn${chartType === 'bar' ? ' cd-segment-btn--active' : ''}`}>
                  <BarChart2 className="w-3.5 h-3.5" />{L(locale,'แผนภูมิแท่ง','막대 차트','Bar')}
                </button>
                <button type="button" onClick={() => setChartType('line')}
                  className={`cd-segment-btn${chartType === 'line' ? ' cd-segment-btn--active' : ''}`}>
                  <Activity className="w-3.5 h-3.5" />{L(locale,'กราฟเส้น','선 차트','Line')}
                </button>
              </div>
            )}

            {(activeTab === 'cost'
              ? [
                  { mode: 'energy', title: labelMonthlyEnergy, accent: 'cd-card-accent--energy' },
                  { mode: 'cost', title: labelMonthlyCost, accent: 'cd-card-accent--cost' },
                ]
              : [{ mode: 'energy', title: labelMonthlyEnergy, accent: 'cd-card-accent--energy' }]
            ).map(({ mode, title, accent }) => (
            <div key={mode} className="cd-card">
              <div className={`cd-card-accent ${accent}`} />
              <div className="cd-card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="cd-card-title">{title}</h2>
                    <p className="cd-card-desc">
                      {L(locale,'เปรียบเทียบก่อนและหลังติดตั้ง','설치 전후 비교','Before vs after installation')}
                    </p>
                  </div>
                  {mode === 'energy' && activeTab === 'energy' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (monthlyData.length > 0) {
                        generateMonthlyEnergyExcel(monthlyData, billingSite);
                      }
                    }}
                    disabled={monthlyData.length === 0}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <Download className="w-4 h-4" />
                    {L(locale,'ดาวน์โหลด','다운로드','Download')}
                  </button>
                  )}
                </div>
                {monthlyLoading ? (
                  <div className="cd-chart-loading">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <div className="cd-chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                {mode === 'cost' || chartType === 'line' ? (
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                    <Tooltip formatter={(v) =>
                      mode === 'energy'
                        ? Number(v).toLocaleString()
                        : formatCost(Number(v))
                    } />
                    <Legend />
                    {mode === 'energy' ? <>
                      <Line type="monotone" dataKey={keyBefore} stroke="#b45309" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey={keyAfter}  stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </> : <>
                      <Line type="monotone" dataKey={keyCostB} stroke="#d97706" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey={keyCostA} stroke="#0d9488" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    </>}
                  </LineChart>
                ) : (
                  <BarChart data={chartData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                    <Tooltip formatter={(v) =>
                      mode === 'energy'
                        ? Number(v).toLocaleString()
                        : formatCost(Number(v))
                    } />
                    <Legend />
                    {mode === 'energy' ? <>
                      <Bar dataKey={keyBefore} fill="#b45309" radius={[4,4,0,0]} />
                      <Bar dataKey={keyAfter}  fill="#059669" radius={[4,4,0,0]} />
                    </> : <>
                      <Bar dataKey={keyCostB} fill="#d97706" radius={[4,4,0,0]} />
                      <Bar dataKey={keyCostA} fill="#0d9488" radius={[4,4,0,0]} />
                    </>}
                  </BarChart>
                )}
                  </ResponsiveContainer>
                  </div>
                )}
                {monthlyError && mode === 'energy' && <p className="cd-error">{monthlyError}</p>}
              </div>
            </div>
            ))}

            {/* KPI Comparison Grid */}
            <div className="cd-card">
              <div className="cd-card-accent cd-card-accent--energy" />
              <div className="cd-card-body">
                <h2 className="cd-card-title">{L(locale,'สรุป KPI ประหยัดพลังงาน','에너지 절약 KPI 요약','Energy Savings KPI Summary')}</h2>
                <div className="cd-kpi-grid">
                  <div className="cd-kpi-card">
                    <div className="cd-kpi-icon cd-kpi-icon--energy">
                      <Zap className="w-5 h-5" />
                    </div>
                    <p className="cd-kpi-val">{fmt(totalSavedKwh)}</p>
                    <p className="cd-kpi-label">{L(locale,'ประหยัด kWh','절약 kWh','Saved kWh')}</p>
                  </div>
                  <div className="cd-kpi-card">
                    <div className="cd-kpi-icon cd-kpi-icon--cost">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <p className="cd-kpi-val">{formatCost(totalSavedCost)}</p>
                    <p className="cd-kpi-label">{labelCostSaved}</p>
                  </div>
                  <div className="cd-kpi-card">
                    <div className="cd-kpi-icon cd-kpi-icon--rate">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                    <p className="cd-kpi-val">{savingPct}%</p>
                    <p className="cd-kpi-label">{L(locale,'อัตราประหยัด','절약률','Save %')}</p>
                  </div>
                  <div className="cd-kpi-card">
                    <div className="cd-kpi-icon cd-kpi-icon--co2">
                      <Leaf className="w-5 h-5" />
                    </div>
                    <p className="cd-kpi-val">{fmt(co2Saved)}</p>
                    <p className="cd-kpi-label">{L(locale,'CO₂ ลด (kg)','CO₂ 감소 (kg)','CO₂ Reduced (kg)')}</p>
                  </div>
                </div>

                {activeTab === 'energy' && monthlyData.length > 0 && (
                  <div className="cd-kpi-monthly-chart">
                    <h3 className="cd-chart-subtitle">{L(locale,'เปรียบเทียบรายเดือน (kWh)','월별 비교 (kWh)','Monthly Comparison (kWh)')}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={monthlyData.map(d => ({
                        name: monthLabel(d),
                        before: d.before,
                        after: d.after,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={v => Number(v).toLocaleString()} />
                        <Legend />
                        <Bar dataKey={L(locale,'ก่อน','이전','Before')} fill="#b45309" radius={[4,4,0,0]} />
                        <Bar dataKey={L(locale,'หลัง','이후','After')} fill="#059669" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* AI Energy Analysis Panel */}
            <AiEnergyInsightPanel
              monthlyData={monthlyData}
              locale={locale}
              site={selectedSite}
            />
          </div>
        )}

        {/* ── AI Analysis ── */}
        {activeTab === 'ai' && (
          <AiAnalysisTab
            snapshot={snapshot}
            liveData={liveData}
            monthlyData={monthlyData}
            savingPct={savingPct}
            locale={locale}
          />
        )}

        {/* ── Real-time current monitor ── */}
        {activeTab === 'monitor' && (
          <div className="cd-stack">
            <div className="cd-toolbar">
              <div className="cd-select-wrap">
                <select value={selectedDeviceId} onChange={e => setSelectedDeviceId(e.target.value)} className="cd-select">
                  {devices.map(d => (
                    <option key={d.deviceID} value={String(d.deviceID)}>{d.deviceName || d.geID || d.deviceID}</option>
                  ))}
                </select>
                <ChevronDown className="cd-select-chevron" />
              </div>
              <select value={monitorMinutes} onChange={e => setMonitorMinutes(Number(e.target.value))} className="cd-select">
                <option value={15}>{L(locale,'15 นาที','15분','15 min')}</option>
                <option value={30}>{L(locale,'30 นาที','30분','30 min')}</option>
                <option value={60}>{L(locale,'60 นาที','60분','60 min')}</option>
              </select>
              <div className="cd-metric-scroll">
                {monitorMetricOptions.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setMonitorMetric(m.key)}
                    className={`cd-metric-pill${monitorMetric === m.key ? ' cd-metric-pill--active' : ''}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="cd-toolbar-row">
              <button type="button" onClick={fetchCustomerMonitor} disabled={monitorLoading}
                className="cd-btn cd-btn--primary">
                <RefreshCw className={`w-4 h-4 ${monitorLoading ? 'animate-spin' : ''}`} />
                {L(locale,'รีเฟรช','새로고침','Refresh')}
              </button>
              <div className="cd-live-hint">
                <span className={`cd-live-dot${isLivePulse ? ' cd-live-dot--on' : ''}`} />
                {L(locale,'อัปเดตทุก 10 วินาที','10초마다 업데이트','Updates every 10s')}
                {lastMonitorAt && (
                  <span>· {new Date(lastMonitorAt).toLocaleTimeString()}</span>
                )}
              </div>
              </div>
            </div>

            {monitorSnapshot && (
              <div className="cd-stat-grid cd-stat-grid--8">
                {[
                  { label: L(locale,'สถานะ','상태','Status'), val: monitorSnapshot.isOnline ? L(locale,'ออนไลน์','온라인','Online') : L(locale,'ออฟไลน์','오프라인','Offline'), color: monitorSnapshot.isOnline ? 'text-emerald-600' : 'text-red-500' },
                  { label: L(locale,'กำลังไฟ OUT (kW)','출력 전력','Power OUT'), val: monitorSnapshot.totalPowerKw?.toFixed(2) ?? '—', color: 'text-amber-600' },
                  { label: L(locale,'แรงดัน L1 (V)','전압 L1','V L1'), val: monitorSnapshot.voltage?.L1?.toFixed(1) ?? '—', color: 'text-violet-600' },
                  { label: L(locale,'ความถี่ (Hz)','주파수','Freq'), val: monitorSnapshot.frequency?.toFixed(2) ?? '—', color: 'text-blue-600' },
                  { label: L(locale,'ความเสถียร (PF)','역률 PF','PF'), val: monitorSnapshot.powerFactor?.toFixed(3) ?? '—', color: 'text-teal-600' },
                  { label: L(locale,'กระแสรีแอก OUT (kVAr)','무효전력 OUT','Q OUT'), val: monitorSnapshot.reactiveOutputKvar?.toFixed(2) ?? '—', color: 'text-indigo-600' },
                  { label: L(locale,'OUTPUT L1 (A)','OUTPUT L1','OUT L1'), val: monitorSnapshot.currentOutput?.L1?.toFixed(2) ?? '—', color: 'text-emerald-600' },
                  { label: L(locale,'INPUT L1 (A)','INPUT L1','IN L1'), val: monitorSnapshot.currentInput?.L1?.toFixed(2) ?? '—', color: 'text-red-600' },
                ].map((item) => (
                  <div key={item.label} className="cd-stat-card">
                    <p className={`cd-stat-val ${item.color}`}>{item.val}</p>
                    <p className="cd-stat-label">{item.label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="cd-card">
              <div className="cd-card-accent cd-card-accent--monitor" />
              <div className="cd-card-body">
                <h2 className="cd-card-title">
                  {monitorMetric === 'current' && L(locale,'กราฟกระแสไฟเรียลไทม์','실시간 전류','Real-time Current')}
                  {monitorMetric === 'power' && L(locale,'กราฟกำลังไฟเรียลไทม์','실시간 전력','Real-time Power')}
                  {monitorMetric === 'voltage' && L(locale,'กราฟแรงดันเรียลไทม์','실시간 전압','Real-time Voltage')}
                  {monitorMetric === 'frequency' && L(locale,'กราฟความถี่เรียลไทม์','실시간 주파수','Real-time Frequency')}
                  {monitorMetric === 'stability' && L(locale,'กราฟความเสถียร (Power Factor)','안정성 (역률)','Stability (Power Factor)')}
                  {monitorMetric === 'reactive' && L(locale,'กราฟการกักเก็บกระแสไฟ (kVAr)','무효전력','Reactive Power (kVAr)')}
                </h2>
                <p className="cd-card-desc">
                  {monitorSeries.length} {L(locale,'จุดข้อมูล','데이터 포인트','points')}
                </p>
                {monitorLoading && monitorSeries.length === 0 ? (
                  <div className="cd-chart-loading">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                  </div>
                ) : monitorSeries.length === 0 ? (
                  <div className="cd-empty">
                    <WifiOff className="w-10 h-10 mb-2" />
                    <p>{L(locale,'ยังไม่มีข้อมูลในช่วงเวลาที่เลือก','선택 구간 데이터 없음','No data in selected window')}</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={monitorSeries} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={24} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v, name) => {
                        if (v == null) return ['—', name];
                        const n = Number(v).toFixed(2);
                        if (monitorMetric === 'frequency') return [`${n} Hz`, name];
                        if (monitorMetric === 'stability') return [n, name];
                        if (monitorMetric === 'power') return [`${n} kW`, name];
                        if (monitorMetric === 'voltage') return [`${n} V`, name];
                        if (monitorMetric === 'reactive') return [`${n} kVAr`, name];
                        return [`${n} A`, name];
                      }} />
                      <Legend />
                      {monitorMetric === 'current' && <>
                        <Line type="monotone" dataKey="beforeL1" name="INPUT L1" stroke="#ef4444" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="beforeL2" name="INPUT L2" stroke="#f97316" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="beforeL3" name="INPUT L3" stroke="#fb923c" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="afterL1" name="OUTPUT L1" stroke="#10b981" strokeWidth={2.5} dot={false} />
                        <Line type="monotone" dataKey="afterL2" name="OUTPUT L2" stroke="#14b8a6" strokeWidth={2.5} dot={false} />
                        <Line type="monotone" dataKey="afterL3" name="OUTPUT L3" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
                      </>}
                      {monitorMetric === 'power' && <>
                        <Line type="monotone" dataKey="powerInput" name="INPUT (kW)" stroke="#ef4444" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="powerOutput" name="OUTPUT (kW)" stroke="#10b981" strokeWidth={2.5} dot={false} />
                      </>}
                      {monitorMetric === 'voltage' && <>
                        <Line type="monotone" dataKey="voltageL1" name="L1 (V)" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="voltageL2" name="L2 (V)" stroke="#a78bfa" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="voltageL3" name="L3 (V)" stroke="#c4b5fd" strokeWidth={2} dot={false} />
                      </>}
                      {monitorMetric === 'frequency' && (
                        <Line type="monotone" dataKey="frequency" name={L(locale,'ความถี่ (Hz)','주파수','Frequency')} stroke="#2563eb" strokeWidth={2.5} dot={false} />
                      )}
                      {monitorMetric === 'stability' && (
                        <Line type="monotone" dataKey="powerFactor" name={L(locale,'Power Factor','역률','PF')} stroke="#0d9488" strokeWidth={2.5} dot={false} />
                      )}
                      {monitorMetric === 'reactive' && <>
                        <Line type="monotone" dataKey="reactiveInput" name="INPUT (kVAr)" stroke="#6366f1" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="reactiveOutput" name="OUTPUT (kVAr)" stroke="#4f46e5" strokeWidth={2.5} dot={false} />
                      </>}
                    </LineChart>
                  </ResponsiveContainer>
                )}
                {monitorError && <p className="cd-error">{monitorError}</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── Live Devices ── */}
        {activeTab === 'live' && (
          <div className="cd-stack">
            <div className="cd-toolbar">
              <div className="cd-select-wrap">
                <select value={selectedDeviceId} onChange={e => { setSelectedDeviceId(e.target.value); }} className="cd-select">
                  {devices.map(d => (
                    <option key={d.deviceID} value={String(d.deviceID)}>{d.deviceName || d.deviceID}</option>
                  ))}
                </select>
                <ChevronDown className="cd-select-chevron" />
              </div>
              <div className="cd-metric-scroll">
                {monitorMetricOptions.map((m) => (
                  <button key={m.key} type="button" onClick={() => setLiveMetric(m.key)}
                    className={`cd-metric-pill${liveMetric === m.key ? ' cd-metric-pill--active' : ''}`}>
                    {m.label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={fetchLive} disabled={liveLoading} className="cd-btn cd-btn--ghost">
                <RefreshCw className={`w-4 h-4 ${liveLoading ? 'animate-spin text-emerald-600' : ''}`} />
                {L(locale,'รีเฟรช','새로고침','Refresh')}
              </button>
              <button
                type="button"
                disabled={liveData.length === 0}
                onClick={() => {
                  const dev = devices.find(d => String(d.deviceID) === String(selectedDeviceId));
                  const rows = liveData.map(d => ({
                    [L(locale,'เวลา','시간','Time')]: d.time ? String(d.time).slice(11,16) : '',
                    'L1 (A)': d.currentL1 ?? '', 'L2 (A)': d.currentL2 ?? '', 'L3 (A)': d.currentL3 ?? '',
                    [L(locale,'กำลังไฟ (kW)','전력 (kW)','Power (kW)')]: d.totalPower ?? '',
                    [L(locale,'แรงดัน L1 (V)','전압 L1','V L1')]: d.voltageL1 ?? '',
                    [L(locale,'แรงดัน L2 (V)','전압 L2','V L2')]: d.voltageL2 ?? '',
                    [L(locale,'แรงดัน L3 (V)','전압 L3','V L3')]: d.voltageL3 ?? '',
                    [L(locale,'ความถี่ (Hz)','주파수','Hz')]: d.frequency ?? '',
                    'Power Factor': d.powerFactor ?? '',
                  }));
                  exportToExcel(rows, `live_current_${dev?.deviceName || selectedDeviceId}`, L(locale,'กระแสไฟ','전류','Current'));
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                {L(locale,'ดาวน์โหลด Excel','Excel 다운로드','Export Excel')}
              </button>
            </div>

            {/* Snapshot KPI row */}
            {snapshot && (() => {
              const d = snapshot;
              const isOnline = d.status === 'online';
              return (
                <div className="cd-stat-grid">
                  {[
                    { icon: isOnline ? Wifi : WifiOff, label: L(locale,'สถานะ','상태','Status'), val: isOnline ? L(locale,'ออนไลน์','온라인','Online') : 'Offline', color: isOnline ? 'text-emerald-600' : 'text-red-500', bg: isOnline ? 'bg-emerald-50' : 'bg-red-50' },
                    { icon: Zap, label: L(locale,'กำลังไฟ (kW)','전력 (kW)','Power (kW)'), val: (d.totalPower ?? 0).toFixed(2), color: 'text-amber-600', bg: 'bg-amber-50' },
                    { icon: Activity, label: L(locale,'L1 (A)','L1 (A)','L1 (A)'), val: (d.currentL1 ?? 0).toFixed(2), color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { icon: Activity, label: L(locale,'L2 (A)','L2 (A)','L2 (A)'), val: (d.currentL2 ?? 0).toFixed(2), color: 'text-emerald-700', bg: 'bg-emerald-50' },
                    { icon: Activity, label: L(locale,'L3 (A)','L3 (A)','L3 (A)'), val: (d.currentL3 ?? 0).toFixed(2), color: 'text-teal-600', bg: 'bg-teal-50' },
                    { icon: Thermometer, label: L(locale,'Power Factor','역률','Power Factor'), val: (d.powerFactor ?? 0).toFixed(3), color: 'text-teal-600', bg: 'bg-teal-50' },
                  ].map(({ icon: Icon, label, val, color, bg }) => (
                    <div key={label} className={`cd-stat-card cd-stat-card--tint ${bg}`}>
                      <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
                      <div>
                        <p className={`cd-stat-val ${color}`}>{val}</p>
                        <p className="cd-stat-label">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="cd-card">
              <div className="cd-card-accent cd-card-accent--live" />
              <div className="cd-card-body">
                <h2 className="cd-card-title">
                  {L(locale,'กราฟกระแสไฟรายชั่วโมง (วันนี้)','오늘 시간별 전류 그래프','Hourly Chart — Today')}
                </h2>
                <p className="cd-card-desc">
                  {L(locale,'อัปเดตทุก 30 วินาที','30초마다 업데이트','Updates every 30 seconds')} · {selectedDeviceId}
                </p>
              {liveLoading ? (
                <div className="cd-chart-loading">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
              ) : liveData.length === 0 ? (
                <div className="cd-empty">
                  <WifiOff className="w-10 h-10 mb-2" />
                  <p>{L(locale,'ยังไม่มีข้อมูลวันนี้','오늘 데이터 없음','No data for today')}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={liveData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="time" tick={{ fontSize: 11 }}
                      tickFormatter={v => v ? String(v).slice(11, 16) : ''} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      labelFormatter={v => v ? String(v).slice(11, 16) : ''}
                      formatter={(v, name) => [v?.toFixed(2), name]} />
                    <Legend />
                    {liveMetric === 'current' && <>
                      <Line type="monotone" dataKey="currentL1" name="L1 (A)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="currentL2" name="L2 (A)" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="currentL3" name="L3 (A)" stroke="#ec4899" strokeWidth={2} dot={false} />
                    </>}
                    {liveMetric === 'power' && <>
                      <Line type="monotone" dataKey="totalPower" name={L(locale,'กำลังไฟ (kW)','전력 (kW)','Power (kW)')} stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                    </>}
                    {liveMetric === 'voltage' && <>
                      <Line type="monotone" dataKey="voltageL1" name="V-L1" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="voltageL2" name="V-L2" stroke="#06b6d4" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="voltageL3" name="V-L3" stroke="#f97316" strokeWidth={2} dot={false} />
                    </>}
                    {liveMetric === 'frequency' && (
                      <Line type="monotone" dataKey="frequency" name={L(locale,'ความถี่ (Hz)','주파수','Hz')} stroke="#2563eb" strokeWidth={2.5} dot={false} />
                    )}
                    {liveMetric === 'stability' && (
                      <Line type="monotone" dataKey="powerFactor" name={L(locale,'Power Factor','역률','PF')} stroke="#0d9488" strokeWidth={2.5} dot={false} />
                    )}
                    {liveMetric === 'reactive' && (
                      <Line type="monotone" dataKey="reactivePower" name={L(locale,'กระแสรีแอก (kVAr)','무효전력','kVAr')} stroke="#6366f1" strokeWidth={2.5} dot={false} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              )}
              </div>
            </div>

            {/* Device Detail Card */}
            {snapshot && (() => {
              const d = snapshot;
              const dev = devices.find(x => String(x.deviceID) === String(selectedDeviceId));
              const dd = deviceDetails;
              return (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
                  <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-green-600" />
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                    <Cpu className="w-5 h-5 text-emerald-600" />
                    <h2 className="font-bold text-gray-800">{L(locale,'รายละเอียดเครื่อง','기기 상세정보','Device Details')}</h2>
                  </div>

                  {/* Owner / Customer section */}
                  <div className="px-6 py-5 bg-gradient-to-r from-emerald-50 to-green-50/60 border-b border-gray-100">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-white" />
                      </div>
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">{L(locale,'ข้อมูลลูกค้า / เจ้าของเครื่อง','고객 / 기기 소유자 정보','Customer / Owner Information')}</p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">{L(locale,'ชื่อเครื่อง / Device ID','장치명 / Device ID','Device Name / Device ID')}</p>
                        <p className="font-semibold text-gray-800">{dev?.deviceName ?? selectedDeviceId}</p>
                        <p className="text-xs text-emerald-600 font-mono mt-0.5">{dd?.energyID ?? dev?.energyID ?? '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">{L(locale,'ชื่อลูกค้า','고객명','Customer Name')}</p>
                        <p className="font-semibold text-gray-800">{dd?.customerName || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">{L(locale,'เบอร์โทร','전화번호','Phone')}</p>
                        {dd?.customerPhone
                          ? <a href={`tel:${dd.customerPhone}`} className="font-semibold text-emerald-600 hover:underline flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 flex-shrink-0" />{dd.customerPhone}
                            </a>
                          : <p className="font-semibold text-gray-800">-</p>}
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <p className="text-xs text-gray-400 mb-0.5">{L(locale,'ที่อยู่','주소','Address')}</p>
                        <p className="font-semibold text-gray-800 text-sm leading-snug">{dd?.customerAddress || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">{L(locale,'อีเมลเจ้าของ','소유자 이메일','Owner Email')}</p>
                        <p className="font-semibold text-gray-800 break-all text-sm">{dd?.owner ?? '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">{L(locale,'สถานที่/ไซต์','설치 위치/사이트','Location / Site')}</p>
                        <p className="font-semibold text-gray-800">{dd?.location ?? dev?.location ?? '-'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{dd?.site ?? '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">{L(locale,'วันที่ลงทะเบียน','등록일','Register Date')}</p>
                        <p className="font-semibold text-gray-800">{dd?.registerDate ?? '-'}</p>
                        <p className="text-xs text-gray-400 mt-0.5">IP: {dd?.ipAddress ?? '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Electrical measurements grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 divide-x divide-y divide-gray-100 text-sm">
                    {[
                      [L(locale,'สถานะเครื่อง','연결 상태','Connection'), dd?.connection ?? '-', dd?.connection === 'ONLINE' ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'],
                      [L(locale,'แรงดัน L1 (V)','전압 L1 (V)','Voltage L1 (V)'), (d.voltageL1 ?? 0).toFixed(1), 'text-emerald-700'],
                      [L(locale,'แรงดัน L2 (V)','전압 L2 (V)','Voltage L2 (V)'), (d.voltageL2 ?? 0).toFixed(1), 'text-emerald-700'],
                      [L(locale,'แรงดัน L3 (V)','전압 L3 (V)','Voltage L3 (V)'), (d.voltageL3 ?? 0).toFixed(1), 'text-emerald-700'],
                      [L(locale,'กระแส L1 (A)','전류 L1 (A)','Current L1 (A)'), (d.currentL1 ?? 0).toFixed(2), 'text-emerald-700'],
                      [L(locale,'กระแส L2 (A)','전류 L2 (A)','Current L2 (A)'), (d.currentL2 ?? 0).toFixed(2), 'text-violet-700'],
                      [L(locale,'กระแส L3 (A)','전류 L3 (A)','Current L3 (A)'), (d.currentL3 ?? 0).toFixed(2), 'text-pink-700'],
                      [L(locale,'กำลังไฟ (kW)','전력 (kW)','Total Power (kW)'), (d.totalPower ?? 0).toFixed(2), 'text-amber-700'],
                      [L(locale,'Power Factor','역률','Power Factor'), (d.powerFactor ?? 0).toFixed(3), 'text-gray-800'],
                      [L(locale,'ความถี่ (Hz)','주파수 (Hz)','Frequency (Hz)'), (d.frequency ?? 0).toFixed(1), 'text-gray-800'],
                      [L(locale,'THD ก่อน (%)','THD 이전 (%)','THD Before (%)'), (d.thdBefore ?? 0).toFixed(1), 'text-red-600'],
                      [L(locale,'THD หลัง (%)','THD 이후 (%)','THD After (%)'), (d.thdAfter ?? 0).toFixed(1), 'text-green-600'],
                      [L(locale,'พลังงานประหยัด (kWh)','절약 에너지 (kWh)','Energy Saved (kWh)'), (d.energySaved ?? 0).toFixed(2), 'text-emerald-700 font-bold'],
                      [L(locale,'CO₂ ลดได้ (kg)','CO₂ 절감 (kg)','CO₂ Saved (kg)'), (d.co2Saved ?? 0).toFixed(2), 'text-teal-700 font-bold'],
                    ].map(([label, val, cls]) => (
                      <div key={label} className="px-5 py-4 hover:bg-gray-50/80 transition-colors">
                        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                        <p className={`font-semibold ${cls}`}>{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Comparison Table ── */}
        {activeTab === 'compare' && (() => {
          const rate = electricityRate ?? 3.88;
          const afterPowerKw = snapshot?.totalPower ?? 0;
          const monthsWithData = monthlyData.filter(d => d.before > 0 && d.after > 0);
          const avgBKwh = monthsWithData.length ? monthsWithData.reduce((s,d) => s+d.before, 0) / monthsWithData.length : 0;
          const avgAKwh = monthsWithData.length ? monthsWithData.reduce((s,d) => s+d.after, 0) / monthsWithData.length : 0;
          const powerRatio = avgAKwh > 0 ? avgBKwh / avgAKwh : 1;
          const estBeforePowerKw = afterPowerKw * powerRatio;
          const phases = [
            { ph: 'L1', before: snapshot?.voltageL1 ?? 0, after: snapshot?.currentL1 ?? 0 },
            { ph: 'L2', before: snapshot?.voltageL2 ?? 0, after: snapshot?.currentL2 ?? 0 },
            { ph: 'L3', before: snapshot?.voltageL3 ?? 0, after: snapshot?.currentL3 ?? 0 },
          ];
          const totalCurBefore = phases.reduce((s,p) => s + p.before, 0);
          const totalCurAfter  = phases.reduce((s,p) => s + p.after, 0);
          const afterCostHr  = afterPowerKw * rate;
          const beforeCostHr = estBeforePowerKw * rate;
          const savingHr     = beforeCostHr - afterCostHr;
          const savingPctRT  = estBeforePowerKw > 0
            ? (estBeforePowerKw - afterPowerKw) / estBeforePowerKw * 100
            : parseFloat(savingPct) || 0;
          const isLive = snapshot?.status === 'online';

          return (
            <div className="cd-stack">
              {/* ── Current comparison ── */}
              <div className="cd-card">
                <div className="cd-card-accent cd-card-accent--compare" />
                <div className="cd-card-body">
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.5rem', marginBottom:'0.75rem' }}>
                    <h2 className="cd-card-title" style={{ margin:0 }}>
                      {L(locale,'กระแสไฟ L1/L2/L3 — เปรียบเทียบก่อน/หลัง (A)','전류 L1/L2/L3 — 설치 전/후 비교 (A)','Current L1/L2/L3 — Before vs After (A)')}
                    </h2>
                    {isLive && <span className="cd-ai-live-chip"><span className="cd-ai-live-chip-dot" />LIVE</span>}
                  </div>
                  {totalCurBefore === 0 && totalCurAfter === 0 ? (
                    <p className="cd-card-desc">{L(locale,'ยังไม่มีข้อมูลกระแสไฟ — เปิดแท็บ Live ก่อน','전류 데이터 없음 — Live 탭을 먼저 열어주세요','No current data — open the Live tab first')}</p>
                  ) : (
                    <div className="cd-table-scroll">
                      <table className="cd-table" style={{ display:'table' }}>
                        <thead>
                          <tr>
                            <th>{L(locale,'เฟส','위상','Phase')}</th>
                            <th>{L(locale,'ก่อน (A)','설치 전 (A)','Before (A)')}</th>
                            <th>{L(locale,'หลัง (A)','설치 후 (A)','After (A)')}</th>
                            <th>{L(locale,'ลดลง (A)','절약 (A)','Saved (A)')}</th>
                            <th>{L(locale,'% ประหยัด','절약률','% Saved')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {phases.map(({ ph, before, after }) => {
                            const saved = before - after;
                            const pct   = before > 0 ? saved / before * 100 : 0;
                            return (
                              <tr key={ph}>
                                <td style={{ fontWeight:800, color:'#4f46e5' }}>{ph}</td>
                                <td>{before > 0 ? before.toFixed(2) : '—'}</td>
                                <td style={{ color: after > 0 && before > 0 ? (after < before ? '#059669' : '#d97706') : undefined }}>
                                  {after > 0 ? after.toFixed(2) : '—'}
                                </td>
                                <td style={{ color: saved > 0 ? '#059669' : saved < 0 ? '#d97706' : undefined }}>
                                  {before > 0 && after > 0 ? (saved >= 0 ? `−${saved.toFixed(2)}` : `+${Math.abs(saved).toFixed(2)}`) : '—'}
                                </td>
                                <td style={{ fontWeight:700, color: pct > 0 ? '#059669' : pct < 0 ? '#d97706' : undefined }}>
                                  {before > 0 && after > 0 ? `${pct.toFixed(1)}%` : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td>{L(locale,'รวม','합계','Total')}</td>
                            <td>{totalCurBefore > 0 ? totalCurBefore.toFixed(2) : '—'}</td>
                            <td>{totalCurAfter > 0 ? totalCurAfter.toFixed(2) : '—'}</td>
                            <td>{totalCurBefore > 0 && totalCurAfter > 0 ? `−${(totalCurBefore - totalCurAfter).toFixed(2)}` : '—'}</td>
                            <td>{totalCurBefore > 0 && totalCurAfter > 0 ? `${((totalCurBefore - totalCurAfter) / totalCurBefore * 100).toFixed(1)}%` : '—'}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Cost comparison ── */}
              <div className="cd-card">
                <div className="cd-card-accent cd-card-accent--compare" />
                <div className="cd-card-body">
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.5rem', marginBottom:'0.75rem' }}>
                    <h2 className="cd-card-title" style={{ margin:0 }}>
                      {L(locale,`ค่าไฟฟ้า (${currencyCode}) — ประมาณการเรียลไทม์`,`전기요금 (${currencyCode}) — 실시간 추정`,`Electricity Cost (${currencyCode}) — Real-time`)}
                    </h2>
                    <span style={{ fontSize:'0.7rem', color:'#64748b' }}>
                      {afterPowerKw.toFixed(2)} kW · {fmt(rate)} {currencyCode}/kWh
                    </span>
                  </div>
                  {afterPowerKw === 0 ? (
                    <p className="cd-card-desc">{L(locale,'ยังไม่มีข้อมูลกำลังไฟ — เปิดแท็บ Live ก่อน','전력 데이터 없음 — Live 탭을 먼저 열어주세요','No power data — open the Live tab first')}</p>
                  ) : (
                    <div className="cd-table-scroll">
                      <table className="cd-table" style={{ display:'table' }}>
                        <thead>
                          <tr>
                            <th>{L(locale,'ช่วงเวลา','기간','Period')}</th>
                            <th>{L(locale,`ก่อน (${currencyCode})`,`설치 전 (${currencyCode})`,`Before (${currencyCode})`)}</th>
                            <th>{L(locale,`หลัง (${currencyCode})`,`설치 후 (${currencyCode})`,`After (${currencyCode})`)}</th>
                            <th style={{ color:'#d1fae5' }}>{L(locale,`ประหยัด (${currencyCode})`,`절약 (${currencyCode})`,`Saving (${currencyCode})`)}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { period: L(locale,'ต่อชั่วโมง','시간당','Per Hour'),           mul: 1 },
                            { period: L(locale,'ต่อวัน','하루당','Per Day'),                mul: 24 },
                            { period: L(locale,'ต่อเดือน (30 วัน)','월 (30일)','Per Month'), mul: 720 },
                          ].map(({ period, mul }) => {
                            const bCost = beforeCostHr * mul;
                            const aCost = afterCostHr * mul;
                            const sav   = bCost - aCost;
                            return (
                              <tr key={period}>
                                <td style={{ fontWeight:600 }}>{period}</td>
                                <td style={{ color:'#dc2626' }}>{formatCost(bCost)}</td>
                                <td style={{ color:'#059669', fontWeight:700 }}>{formatCost(aCost)}</td>
                                <td style={{ color:'#059669', fontWeight:800 }}>{sav > 0 ? `−${formatCost(sav)}` : '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td>{L(locale,'ต่อปี (365 วัน)','연 (365일)','Per Year')}</td>
                            <td>{formatCost(beforeCostHr * 8760)}</td>
                            <td>{formatCost(afterCostHr * 8760)}</td>
                            <td>{savingHr > 0 ? `−${formatCost(savingHr * 8760)}` : '—'}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Saving summary stats ── */}
              <div className="cd-card">
                <div className="cd-card-accent cd-card-accent--compare" />
                <div className="cd-card-body">
                  <h2 className="cd-card-title">{L(locale,'สรุปการประหยัด — เรียลไทม์','절약 요약 — 실시간','Saving Summary — Real-time')}</h2>
                  <div className="cd-stat-grid cd-stat-grid--8">
                    {[
                      { label: L(locale,'กำลังไฟก่อน (kW) *','설치 전 전력 (kW) *','Before Power (kW) *'), val: estBeforePowerKw > 0 ? estBeforePowerKw.toFixed(2) : '—', color:'#dc2626' },
                      { label: L(locale,'กำลังไฟหลัง (kW)','설치 후 전력 (kW)','After Power (kW)'), val: afterPowerKw > 0 ? afterPowerKw.toFixed(2) : '—', color:'#059669' },
                      { label: L(locale,'ลดได้ (kW)','절약 (kW)','Saved (kW)'), val: estBeforePowerKw > 0 && afterPowerKw > 0 ? (estBeforePowerKw - afterPowerKw).toFixed(2) : '—', color:'#4f46e5' },
                      { label: L(locale,'% ประหยัดเรียลไทม์','실시간 절약률','Real-time Saving %'), val: savingPctRT > 0 ? `${savingPctRT.toFixed(1)}%` : '—', color:'#059669' },
                      { label: L(locale,`ค่าไฟ/ชม ก่อน (${currencyCode})`,`시간 요금 전 (${currencyCode})`,`Cost/hr Before (${currencyCode})`), val: beforeCostHr > 0 ? formatCost(beforeCostHr) : '—', color:'#dc2626' },
                      { label: L(locale,`ค่าไฟ/ชม หลัง (${currencyCode})`,`시간 요금 후 (${currencyCode})`,`Cost/hr After (${currencyCode})`), val: afterCostHr > 0 ? formatCost(afterCostHr) : '—', color:'#059669' },
                      { label: L(locale,`ประหยัด/เดือน (${currencyCode})`,`월 절약 (${currencyCode})`,`Saving/Month (${currencyCode})`), val: savingHr > 0 ? formatCost(savingHr * 720) : '—', color:'#4f46e5' },
                      { label: L(locale,'CO₂ ลด (kg/hr)','CO₂ 절감 (kg/hr)','CO₂ Saved (kg/hr)'), val: estBeforePowerKw > 0 && afterPowerKw >= 0 ? ((estBeforePowerKw - afterPowerKw) * 0.5313).toFixed(3) : '—', color:'#059669' },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="cd-stat-card">
                        <p className="cd-stat-val" style={{ color }}>{val}</p>
                        <p className="cd-stat-label">{label}</p>
                      </div>
                    ))}
                  </div>
                  {monthsWithData.length > 0 && (
                    <p style={{ marginTop:'0.75rem', fontSize:'0.6875rem', color:'#94a3b8' }}>
                      * {L(locale,`กำลังไฟ "ก่อน" ประมาณจากอัตราส่วนเฉลี่ย ${monthsWithData.length} เดือน (×${powerRatio.toFixed(2)})`,`"설치 전" 전력은 ${monthsWithData.length}개월 평균 비율 추정 (×${powerRatio.toFixed(2)})`,`Before power estimated from ${monthsWithData.length}-month avg ratio (×${powerRatio.toFixed(2)})`)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Contact ── */}
        {activeTab === 'contact' && (
          <div className="cd-contact-wrap">
            <div className="cd-card">
              <div className="cd-card-accent cd-card-accent--contact" />
              <div className="cd-card-body">
                <h2 className="cd-card-title">{L(locale,'ส่งข้อความหาเรา','메시지 보내기','Send us a message')}</h2>
                <p className="cd-card-desc">{L(locale,'ทีมงานจะติดต่อกลับภายใน 24 ชั่วโมง','24시간 내에 연락드리겠습니다','Our team will reply within 24 hours')}</p>
              {sent ? (
                <div className="cd-success">
                  <div className="cd-success-icon">
                    <CheckCircle className="w-9 h-9" />
                  </div>
                  <p className="font-semibold text-gray-800">{L(locale,'ส่งข้อความเรียบร้อยแล้ว!','메시지가 전송되었습니다!','Message sent!')}</p>
                  <p className="text-sm text-gray-500 text-center">{L(locale,'เราจะติดต่อกลับโดยเร็วที่สุด','최대한 빨리 연락드리겠습니다','We will contact you as soon as possible')}</p>
                  <button type="button" onClick={() => setSent(false)} className="mt-2 text-emerald-600 text-sm underline">
                    {L(locale,'ส่งอีกครั้ง','다시 보내기','Send another')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSend}>
                  <div className="cd-form-field">
                    <label className="cd-form-label">{L(locale,'ชื่อ','이름','Name')} *</label>
                    <input required value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})}
                      className="cd-form-input"
                      placeholder={L(locale,'ชื่อของคุณ','성함을 입력하세요','Your name')} />
                  </div>
                  <div className="cd-form-field">
                    <label className="cd-form-label">{L(locale,'เบอร์โทร','전화번호','Phone')} *</label>
                    <input required value={contactForm.phone} onChange={e => setContactForm({...contactForm, phone: e.target.value})}
                      className="cd-form-input"
                      placeholder={L(locale,'เบอร์โทรของคุณ','전화번호를 입력하세요','Your phone number')} />
                  </div>
                  <div className="cd-form-field">
                    <label className="cd-form-label">{L(locale,'อีเมล','이메일','Email')}</label>
                    <input type="email" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})}
                      className="cd-form-input"
                      placeholder="email@example.com" />
                  </div>
                  <div className="cd-form-field">
                    <label className="cd-form-label">{L(locale,'ข้อความ','메시지','Message')} *</label>
                    <textarea required rows={4} value={contactForm.message} onChange={e => setContactForm({...contactForm, message: e.target.value})}
                      className="cd-form-input cd-form-textarea"
                      placeholder={L(locale,'พิมพ์ข้อความของคุณ...','메시지를 입력하세요...','Type your message...')} />
                  </div>
                  <button type="submit" disabled={sendingContact} className="cd-btn cd-btn--primary cd-form-submit">
                    <Send className="w-4 h-4" />
                    {sendingContact ? L(locale,'กำลังส่ง...','전송 중...','Sending...') : L(locale,'ส่งข้อความ','메시지 보내기','Send Message')}
                  </button>
                  {contactError && <p className="cd-error">{contactError}</p>}
                </form>
              )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
