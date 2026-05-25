'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Upload,
  FileText,
  Presentation,
  FileType,
  Loader2,
  Sparkles,
} from 'lucide-react';
import OnlineClassroomHeader from '@/components/classroom/OnlineClassroomHeader';
import { CLASSROOM_USER_KEY } from '@/lib/classroom-storage-keys';
import {
  buildReportHtml,
  downloadAsWord,
  downloadAsPdf,
  downloadAsPowerPoint,
  safeFilename,
} from '@/lib/classroom/homework-export';
import './homework-advisor.css';

const copy = {
  th: {
    title: 'ที่ปรึกษาการบ้าน-รายงาน',
    desc: 'กรอกข้อมูลวิชา อัปโหลดไฟล์คำถาม ระบบจะแสดงคำถามพร้อมคำตอบแนะนำ แล้วส่งออกเป็นไฟล์รายงาน',
    subjectCode: 'รหัสวิชา',
    teacherName: 'ชื่ออาจารย์ผู้สอน',
    authorName: 'ชื่อผู้จัดทำ',
    upload: 'อัปโหลดไฟล์คำถาม',
    uploadHint: 'รองรับ .txt .pdf .doc .docx .ppt .pptx (สูงสุด 10MB)',
    paste: 'หรือวางข้อความคำถาม (ถ้าอ่านไฟล์ไม่ได้)',
    pastePh: 'วางข้อความคำถามจาก Word/PDF ที่นี่…',
    analyze: 'วิเคราะห์คำถามและสร้างคำตอบ',
    analyzing: 'กำลังวิเคราะห์…',
    board: 'บอร์ดคำถาม-คำตอบ',
    boardEmpty: 'กรอกข้อมูลและกดวิเคราะห์เพื่อแสดงคำถามจากไฟล์พร้อมคำตอบ',
    question: 'คำถาม',
    answer: 'คำตอบ',
    exportTitle: 'ส่งการบ้าน / รายงาน (เลือกรูปแบบไฟล์)',
    ppt: 'PowerPoint',
    word: 'Word',
    pdf: 'PDF',
    aiTag: 'AI',
    ruleTag: 'อัตโนมัติ',
  },
  en: {
    title: 'Homework & Report Advisor',
    desc: 'Enter course info, upload questions, review Q&A board, then export your report.',
    subjectCode: 'Subject code',
    teacherName: 'Instructor name',
    authorName: 'Prepared by',
    upload: 'Upload question file',
    uploadHint: '.txt .pdf .doc .docx .ppt .pptx (max 10MB)',
    paste: 'Or paste question text',
    pastePh: 'Paste questions from Word/PDF here…',
    analyze: 'Analyze & generate answers',
    analyzing: 'Analyzing…',
    board: 'Question & Answer board',
    boardEmpty: 'Submit the form to show questions and suggested answers.',
    question: 'Question',
    answer: 'Answer',
    exportTitle: 'Submit homework / report (choose format)',
    ppt: 'PowerPoint',
    word: 'Word',
    pdf: 'PDF',
    aiTag: 'AI',
    ruleTag: 'Auto',
  },
  ko: {
    title: '과제·보고서 상담',
    desc: '과목 정보 입력, 문제 파일 업로드, Q&A 보드 확인 후 보고서로보내기',
    subjectCode: '과목 코드',
    teacherName: '담당 교수',
    authorName: '작성자',
    upload: '문제 파일 업로드',
    uploadHint: '.txt .pdf .doc .docx .ppt .pptx (최대 10MB)',
    paste: '또는 문제 텍스트 붙여넣기',
    pastePh: 'Word/PDF에서 복사한 문제를 붙여넣으세요…',
    analyze: '문항 분석 및 답안 생성',
    analyzing: '분석 중…',
    board: '문항·답안 보드',
    boardEmpty: '양식을 제출하면 문항과 답안이 표시됩니다.',
    question: '문항',
    answer: '답안',
    exportTitle: '과제·보고서 제출 (파일 형식 선택)',
    ppt: 'PowerPoint',
    word: 'Word',
    pdf: 'PDF',
    aiTag: 'AI',
    ruleTag: '자동',
  },
};

export default function HomeworkAdvisorPage() {
  const [lang, setLang] = useState('th');
  const [subjectCode, setSubjectCode] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [aiUsed, setAiUsed] = useState(false);
  const [ruleFallback, setRuleFallback] = useState(false);
  const fileRef = useRef(null);

  const t = copy[lang] || copy.th;

  useEffect(() => {
    const saved = localStorage.getItem('ge_lang');
    if (saved === 'en' || saved === 'ko' || saved === 'th') setLang(saved);
    try {
      const raw = localStorage.getItem(CLASSROOM_USER_KEY);
      if (raw) {
        const u = JSON.parse(raw);
        if (!authorName && (u.name || u.username)) {
          setAuthorName(u.name || u.username || '');
        }
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onFileChange(e) {
    const f = e.target.files?.[0];
    setFile(f || null);
    setError('');
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setItems([]);

    try {
      const fd = new FormData();
      fd.set('subjectCode', subjectCode.trim());
      fd.set('teacherName', teacherName.trim());
      fd.set('authorName', authorName.trim());
      fd.set('questionText', questionText.trim());
      fd.set('locale', lang);
      if (file) fd.set('file', file);

      const res = await fetch('/api/classroom/homework-advisor', {
        method: 'POST',
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'วิเคราะห์ไม่สำเร็จ');
      }

      setMeta(json.data.meta);
      setItems(json.data.items || []);
      setAiUsed(Boolean(json.data.aiUsed));
      setRuleFallback(Boolean(json.data.ruleBasedFallback));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  function handleExport(format) {
    if (!meta || !items.length) return;
    const html = buildReportHtml(meta, items, lang);
    const base = safeFilename(`${meta.subjectCode}-${meta.authorName}`);

    if (format === 'word') downloadAsWord(html, base);
    else if (format === 'pdf') downloadAsPdf(html, base);
    else if (format === 'ppt') downloadAsPowerPoint(html, base);
  }

  const canExport = meta && items.length > 0;

  return (
    <>
      <OnlineClassroomHeader lang={lang} />
      <main className="oc-main hwa-page">
        <h2 className="hwa-title">{t.title}</h2>
        <p className="hwa-desc">{t.desc}</p>

        <form className="hwa-form-card" onSubmit={handleAnalyze}>
          <div className="hwa-form-grid">
            <div className="hwa-field">
              <label className="hwa-label" htmlFor="hwa-subject">
                {t.subjectCode}
              </label>
              <input
                id="hwa-subject"
                className="hwa-input"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                required
                placeholder="เช่น ENG101"
              />
            </div>
            <div className="hwa-field">
              <label className="hwa-label" htmlFor="hwa-teacher">
                {t.teacherName}
              </label>
              <input
                id="hwa-teacher"
                className="hwa-input"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                required
              />
            </div>
            <div className="hwa-field hwa-field--full">
              <label className="hwa-label" htmlFor="hwa-author">
                {t.authorName}
              </label>
              <input
                id="hwa-author"
                className="hwa-input"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                required
              />
            </div>
            <div className="hwa-field hwa-field--full">
              <span className="hwa-label">{t.upload}</span>
              <div
                className={`hwa-file-zone${file ? ' hwa-file-zone--active' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => fileRef.current?.click()}
                onKeyDown={(ev) => ev.key === 'Enter' && fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".txt,.md,.pdf,.doc,.docx,.ppt,.pptx"
                  onChange={onFileChange}
                />
                <Upload size={28} strokeWidth={2} color="#6366f1" style={{ margin: '0 auto' }} />
                <p style={{ margin: '0.5rem 0 0', fontWeight: 600, color: '#4338ca' }}>
                  {file ? file.name : t.upload}
                </p>
                <p className="hwa-file-hint">{t.uploadHint}</p>
              </div>
            </div>
            <div className="hwa-field hwa-field--full">
              <label className="hwa-label" htmlFor="hwa-paste">
                {t.paste}
              </label>
              <textarea
                id="hwa-paste"
                className="hwa-textarea"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder={t.pastePh}
              />
            </div>
          </div>

          {error ? (
            <div className="hwa-error" role="alert">
              {error}
            </div>
          ) : null}

          <button type="submit" className="hwa-submit" disabled={loading}>
            {loading ? (
              <span className="hwa-submit-inner">
                <Loader2 size={18} className="hwa-spin" aria-hidden />
                {t.analyzing}
              </span>
            ) : (
              <span className="hwa-submit-inner">
                <Sparkles size={18} aria-hidden />
                {t.analyze}
              </span>
            )}
          </button>
        </form>

        <section className="hwa-board-card" aria-labelledby="hwa-board-title">
          <div className="hwa-board-head">
            <h2 id="hwa-board-title">
              {t.board}
              {items.length > 0 && aiUsed ? (
                <span className="hwa-badge-ai">{t.aiTag}</span>
              ) : null}
              {items.length > 0 && ruleFallback ? (
                <span className="hwa-badge-ai hwa-badge-rule">{t.ruleTag}</span>
              ) : null}
            </h2>
            <div className="hwa-export-bar" title={t.exportTitle}>
              <button
                type="button"
                className="hwa-export-btn hwa-export-btn--ppt"
                disabled={!canExport}
                onClick={() => handleExport('ppt')}
              >
                <Presentation size={15} />
                {t.ppt}
              </button>
              <button
                type="button"
                className="hwa-export-btn hwa-export-btn--word"
                disabled={!canExport}
                onClick={() => handleExport('word')}
              >
                <FileType size={15} />
                {t.word}
              </button>
              <button
                type="button"
                className="hwa-export-btn hwa-export-btn--pdf"
                disabled={!canExport}
                onClick={() => handleExport('pdf')}
              >
                <FileText size={15} />
                {t.pdf}
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="hwa-empty">{t.boardEmpty}</p>
          ) : (
            <div className="hwa-qa-list">
              {items.map((item, i) => (
                <article key={item.id ?? i} className="hwa-qa-item">
                  <div className="hwa-qa-q">
                    <div className="hwa-qa-q-label">
                      {t.question} {i + 1}
                    </div>
                    <p>{item.question}</p>
                  </div>
                  <div className="hwa-qa-a">
                    <div className="hwa-qa-a-label">{t.answer}</div>
                    <p>{item.answer}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
