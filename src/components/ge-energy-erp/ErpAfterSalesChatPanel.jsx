'use client';

import { useEffect, useMemo, useState } from 'react';
import { erpApiHeaders } from '@/lib/erp-api-auth';

const COPY = {
  th: {
    hint: 'ตอบแชทลูกค้าจากหน้า GE Energy Tech แบบเรียลไทม์',
    threads: 'รายการห้องแชท',
    emptyThreads: 'ยังไม่มีลูกค้าเริ่มแชท',
    loadingThreads: 'กำลังโหลดห้องแชท…',
    pickThread: 'เลือกห้องแชทเพื่อดูบทสนทนา',
    placeholder: 'พิมพ์ข้อความตอบกลับลูกค้า…',
    send: 'ส่งข้อความ',
    sending: 'กำลังส่ง…',
    refresh: 'รีเฟรช',
    you: 'คุณ',
    customer: 'ลูกค้า',
  },
  en: {
    hint: 'Reply to GE Energy Tech customer chats in real time.',
    threads: 'Chat threads',
    emptyThreads: 'No customer chats yet',
    loadingThreads: 'Loading threads…',
    pickThread: 'Select a chat thread to view messages',
    placeholder: 'Type your reply to customer…',
    send: 'Send',
    sending: 'Sending…',
    refresh: 'Refresh',
    you: 'You',
    customer: 'Customer',
  },
  ko: {
    hint: 'GE Energy Tech 고객 채팅에 실시간으로 응답합니다.',
    threads: '채팅 목록',
    emptyThreads: '아직 고객 채팅이 없습니다',
    loadingThreads: '채팅 목록 불러오는 중…',
    pickThread: '대화를 보려면 채팅을 선택하세요',
    placeholder: '고객에게 보낼 답변을 입력하세요…',
    send: '전송',
    sending: '전송 중…',
    refresh: '새로고침',
    you: '나',
    customer: '고객',
  },
};

export default function ErpAfterSalesChatPanel({ lang }) {
  const t = useMemo(() => COPY[lang] || COPY.th, [lang]);
  const [threads, setThreads] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [activeThread, setActiveThread] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  async function loadThreads() {
    setThreadLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ge-energy-erp/after-sales-chat', {
        headers: erpApiHeaders(),
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load threads');
      setThreads(Array.isArray(data.threads) ? data.threads : []);
      if (!activeThread && data.threads?.[0]?.id) {
        setActiveThread(data.threads[0].id);
      }
    } catch (err) {
      setError(err?.message || 'Load error');
    } finally {
      setThreadLoading(false);
    }
  }

  async function loadMessages(threadId, after = 0) {
    if (!threadId) return;
    try {
      const qs = new URLSearchParams({ threadId, after: String(after) });
      const res = await fetch(`/api/ge-energy-erp/after-sales-chat?${qs.toString()}`, {
        headers: erpApiHeaders(),
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load messages');
      const incoming = Array.isArray(data.messages) ? data.messages : [];
      if (after > 0) {
        setMessages((prev) => [...prev, ...incoming]);
      } else {
        setMessages(incoming);
      }
    } catch (err) {
      setError(err?.message || 'Load error');
    }
  }

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    if (!activeThread) return;
    setMessages([]);
    loadMessages(activeThread, 0);
  }, [activeThread]);

  useEffect(() => {
    if (!activeThread) return undefined;
    const timer = setInterval(() => {
      loadThreads();
      const lastId = messages[messages.length - 1]?.id || 0;
      loadMessages(activeThread, lastId);
    }, 2000);
    return () => clearInterval(timer);
  }, [activeThread, messages]);

  async function sendReply(e) {
    e.preventDefault();
    if (!activeThread || !messageText.trim() || sending) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/ge-energy-erp/after-sales-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...erpApiHeaders() },
        body: JSON.stringify({ threadId: activeThread, message: messageText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to send message');
      const list = Array.isArray(data.messages) ? data.messages : [];
      setMessages(list);
      setMessageText('');
      loadThreads();
    } catch (err) {
      setError(err?.message || 'Send failed');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="geerp-chat-layout">
      <aside className="geerp-chat-threads">
        <div className="geerp-chat-threads-head">
          <h2>{t.threads}</h2>
          <button type="button" className="geerp-tool-btn geerp-tool-btn--muted" onClick={loadThreads}>
            {t.refresh}
          </button>
        </div>
        <p className="geerp-content-hint">{t.hint}</p>
        {threadLoading ? <p className="geerp-page-loading">{t.loadingThreads}</p> : null}
        {!threadLoading && threads.length === 0 ? (
          <p className="geerp-content-hint">{t.emptyThreads}</p>
        ) : null}
        <div className="geerp-chat-thread-list">
          {threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              className={`geerp-chat-thread-item ${activeThread === thread.id ? 'is-active' : ''}`}
              onClick={() => setActiveThread(thread.id)}
            >
              <div className="geerp-chat-thread-title">
                <strong>{thread.id}</strong>
                {thread.unreadCustomerCount ? (
                  <span className="geerp-chat-unread">{thread.unreadCustomerCount}</span>
                ) : null}
              </div>
              <p>{thread.preview || '-'}</p>
            </button>
          ))}
        </div>
      </aside>

      <section className="geerp-chat-pane">
        {!activeThread ? <p className="geerp-content-hint">{t.pickThread}</p> : null}
        {error ? <div className="geerp-dev-alert geerp-dev-alert--error">{error}</div> : null}
        <div className="geerp-chat-window">
          {messages.map((msg) => {
            const mine = msg.role === 'agent';
            return (
              <div key={msg.id} className={`geerp-chat-msg ${mine ? 'is-agent' : 'is-customer'}`}>
                <div className="geerp-chat-msg-meta">{mine ? t.you : t.customer}</div>
                <div className="geerp-chat-msg-body">{msg.text}</div>
              </div>
            );
          })}
        </div>
        <form className="geerp-chat-compose" onSubmit={sendReply}>
          <input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={t.placeholder}
            disabled={!activeThread || sending}
          />
          <button type="submit" className="geerp-save-btn" disabled={!activeThread || sending || !messageText.trim()}>
            {sending ? t.sending : t.send}
          </button>
        </form>
      </section>
    </div>
  );
}
