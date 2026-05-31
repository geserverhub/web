import { NextResponse } from 'next/server';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { extractTextFromBuffer, getFileExt } from '@/lib/classroom/extract-text';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = new Set(['.txt', '.md', '.pdf', '.doc', '.docx', '.ppt', '.pptx']);

function ruleBasedQa(text, locale) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const items = [];
  let current = null;

  const qRe = /^(?:ข้อ\s*)?(\d+)[.)]\s*|^Q\s*(\d+)[:.)]?\s*|^(\d+)[.)]\s+/i;

  for (const line of lines) {
    const m = line.match(qRe);
    if (m) {
      if (current?.question) items.push(current);
      current = { question: line, answer: '' };
    } else if (current) {
      current.answer += (current.answer ? '\n' : '') + line;
    } else if (line.length > 10) {
      items.push({
        question: line,
        answer:
          locale === 'ko'
            ? '교수님 지도에 따라 보고서 형식으로 작성하세요. (자동 분석 — AI 미연결)'
            : locale === 'en'
              ? 'Draft your answer in report format per instructor guidelines. (Auto — AI not configured)'
              : 'จัดทำคำตอบในรูปแบบรายงานตามที่อาจารย์กำหนด (วิเคราะห์อัตโนมัติ — ยังไม่เชื่อม AI)',
      });
    }
  }
  if (current?.question) items.push(current);

  if (!items.length && text.trim().length > 20) {
    items.push({
      question: text.trim().slice(0, 2000),
      answer:
        locale === 'ko'
          ? '파일 내용을 바탕으로 답안을 작성하세요.'
          : locale === 'en'
            ? 'Write answers based on the uploaded content.'
            : 'สรุปและตอบคำถามตามเนื้อหาในไฟล์ที่อัปโหลด',
    });
  }

  return items.map((it, i) => ({
    id: i + 1,
    question: it.question,
    answer: it.answer || (locale === 'en' ? '(Draft your answer)' : locale === 'ko' ? '(답안 작성)' : '(ร่างคำตอบ)'),
  }));
}

async function analyzeWithOpenAI(text, meta, locale) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const lang =
    locale === 'ko' ? 'Korean' : locale === 'en' ? 'English' : 'Thai';

  const system = `You are an academic homework advisor. Extract every question from the user's document and provide a clear, well-structured model answer suitable for a homework report. Respond ONLY with valid JSON: {"items":[{"id":1,"question":"...","answer":"..."}]}. Write answers in ${lang}.`;

  const user = `Subject: ${meta.subjectCode}
Instructor: ${meta.teacherName}
Author: ${meta.authorName}

Document text:
${text.slice(0, 12000)}`;

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.4,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!resp.ok) return null;
  const data = await resp.json();
  const raw = data.choices?.[0]?.message?.content || '';
  try {
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed.items) ? parsed.items : Array.isArray(parsed) ? parsed : [];
    return items
      .filter((it) => it?.question)
      .map((it, i) => ({
        id: Number(it.id) || i + 1,
        question: String(it.question),
        answer: String(it.answer || ''),
      }));
  } catch {
    return null;
  }
}

/** POST multipart: subjectCode, teacherName, authorName, questionText?, file?, locale? */
export async function POST(req) {
  try {
    const formData = await req.formData();
    const subjectCode = String(formData.get('subjectCode') || '').trim();
    const teacherName = String(formData.get('teacherName') || '').trim();
    const authorName = String(formData.get('authorName') || '').trim();
    const questionText = String(formData.get('questionText') || '').trim();
    const locale = String(formData.get('locale') || 'th').slice(0, 2);
    const file = formData.get('file');

    if (!subjectCode || !teacherName || !authorName) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกรหัสวิชา ชื่ออาจารย์ และชื่อผู้จัดทำ' },
        { status: 400 },
      );
    }

    let combinedText = questionText;
    let uploadedFile = null;

    if (file && typeof file !== 'string') {
      const ext = getFileExt(file.name);
      if (!ALLOWED_EXT.has(ext)) {
        return NextResponse.json(
          { success: false, error: 'รองรับไฟล์ .txt .pdf .doc .docx .ppt .pptx เท่านั้น' },
          { status: 400 },
        );
      }
      const bytes = await file.arrayBuffer();
      if (bytes.byteLength > MAX_BYTES) {
        return NextResponse.json({ success: false, error: 'ไฟล์ใหญ่เกิน 10MB' }, { status: 400 });
      }

      const buffer = Buffer.from(bytes);
      let extracted = '';
      try {
        extracted = await extractTextFromBuffer(buffer, file.name, file.type || '');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'อ่านไฟล์ไม่สำเร็จ';
        if (!questionText) {
          return NextResponse.json({ success: false, error: msg }, { status: 400 });
        }
      }

      const dir = path.join(process.cwd(), 'public', 'uploads', 'classroom');
      await mkdir(dir, { recursive: true });
      const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
      await writeFile(path.join(dir, safeName), buffer);
      uploadedFile = { name: file.name, url: `/uploads/classroom/${safeName}` };

      combinedText = [combinedText, extracted].filter(Boolean).join('\n\n');
    }

    if (!combinedText || combinedText.trim().length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'ไม่พบข้อความคำถาม — อัปโหลดไฟล์หรือวางข้อความในช่องด้านล่าง',
        },
        { status: 400 },
      );
    }

    const meta = { subjectCode, teacherName, authorName };
    let items = await analyzeWithOpenAI(combinedText, meta, locale);
    const aiUsed = Boolean(items?.length);

    if (!items?.length) {
      items = ruleBasedQa(combinedText, locale);
    }

    return NextResponse.json({
      success: true,
      data: {
        meta,
        items,
        uploadedFile,
        aiUsed,
        ruleBasedFallback: !aiUsed,
      },
    });
  } catch (err) {
    console.error('[homework-advisor]', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'วิเคราะห์ไม่สำเร็จ' },
      { status: 500 },
    );
  }
}
