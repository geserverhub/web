/**
 * Client-side export of homework report (Word / PDF print / PowerPoint HTML).
 */

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildReportHtml(meta, items, lang = 'th') {
  const title =
    lang === 'ko'
      ? '과제·보고서'
      : lang === 'en'
        ? 'Homework / Report'
        : 'รายงานการบ้าน / รายงาน';

  const rows = (items || [])
    .map(
      (item, i) => `
    <section style="margin-bottom:1.5rem;padding:1rem;border:1px solid #e0e7ff;border-radius:8px;">
      <h3 style="margin:0 0 0.5rem;color:#312e81;font-size:1rem;">${lang === 'en' ? 'Question' : lang === 'ko' ? '문항' : 'ข้อที่'} ${i + 1}</h3>
      <p style="margin:0 0 0.75rem;white-space:pre-wrap;">${escapeHtml(item.question)}</p>
      <h4 style="margin:0 0 0.35rem;color:#4338ca;font-size:0.9rem;">${lang === 'en' ? 'Answer' : lang === 'ko' ? '답안' : 'คำตอบ'}</h4>
      <p style="margin:0;white-space:pre-wrap;">${escapeHtml(item.answer)}</p>
    </section>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8"/>
<title>${escapeHtml(title)} — ${escapeHtml(meta.subjectCode)}</title>
<style>
  body { font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; color: #1e293b; }
  h1 { color: #312e81; font-size: 1.35rem; }
  .meta { font-size: 0.9rem; color: #64748b; margin-bottom: 1.5rem; line-height: 1.6; }
  @media print { body { margin: 1cm; } }
</style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div class="meta">
    <div><strong>${lang === 'en' ? 'Subject code' : lang === 'ko' ? '과목 코드' : 'รหัสวิชา'}:</strong> ${escapeHtml(meta.subjectCode)}</div>
    <div><strong>${lang === 'en' ? 'Instructor' : lang === 'ko' ? '담당 교수' : 'อาจารย์ผู้สอน'}:</strong> ${escapeHtml(meta.teacherName)}</div>
    <div><strong>${lang === 'en' ? 'Prepared by' : lang === 'ko' ? '작성자' : 'ผู้จัดทำ'}:</strong> ${escapeHtml(meta.authorName)}</div>
  </div>
  ${rows}
</body>
</html>`;
}

export function downloadAsWord(html, filenameBase) {
  const blob = new Blob(['\ufeff', html], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenameBase}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadAsPdf(html, title) {
  const w = window.open('', '_blank');
  if (!w) {
    alert('Please allow pop-ups to export PDF, or use Print (Ctrl+P) on this page.');
    return;
  }
  w.document.write(html);
  w.document.close();
  w.document.title = title;
  w.onload = () => {
    w.focus();
    w.print();
  };
}

/** PowerPoint can open HTML saved as .ppt */
export function downloadAsPowerPoint(html, filenameBase) {
  const pptHtml = html.replace(
    '<html',
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"',
  );
  const blob = new Blob(['\ufeff', pptHtml], {
    type: 'application/vnd.ms-powerpoint',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenameBase}.ppt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function safeFilename(base) {
  return String(base || 'homework-report')
    .replace(/[^\w\u0E00-\u0E7F\uAC00-\uD7AF-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || 'homework-report';
}
