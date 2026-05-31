'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Video,
  FileText,
  Calendar,
  BookOpenCheck,
} from 'lucide-react';
import { CLASSROOM_USER_KEY } from '@/lib/classroom-storage-keys';
import OnlineClassroomHeader from '@/components/classroom/OnlineClassroomHeader';

const copy = {
  th: {
    welcome: 'ยินดีต้อนรับ',
    rooms: { title: 'ห้องเรียนของฉัน', desc: 'เข้าร่วมคลาสสดและดูตารางเรียน' },
    replay: { title: 'วิดีโอบันทึก', desc: 'ดูย้อนหลังบทเรียนที่บันทึกไว้' },
    docs: { title: 'เอกสารประกอบ', desc: 'ดาวน์โหลดสไลด์และเอกสารคอร์ส' },
    schedule: { title: 'ตารางเรียน', desc: 'กำหนดการเรียนและแจ้งเตือน' },
    homework: {
      title: 'ที่ปรึกษาการบ้าน-รายงาน',
      desc: 'อัปโหลดคำถาม ดูคำตอบ ส่งรายงาน Word / PDF / PowerPoint',
    },
    soon: 'เร็วๆ นี้',
    open: 'เข้าใช้งาน',
  },
  en: {
    welcome: 'Welcome',
    rooms: { title: 'My classrooms', desc: 'Join live classes and view schedule' },
    replay: { title: 'Recorded videos', desc: 'Watch past lesson recordings' },
    docs: { title: 'Course materials', desc: 'Download slides and documents' },
    schedule: { title: 'Schedule', desc: 'Class timetable and reminders' },
    homework: {
      title: 'Homework & Report Advisor',
      desc: 'Upload questions, review answers, export Word / PDF / PPT',
    },
    soon: 'Coming soon',
    open: 'Open',
  },
  ko: {
    welcome: '환영합니다',
    rooms: { title: '내 강의실', desc: '라이브 수업 참여 및 시간표' },
    replay: { title: '녹화 영상', desc: '지난 강의 다시보기' },
    docs: { title: '학습 자료', desc: '슬라이드 및 문서 다운로드' },
    schedule: { title: '수업 일정', desc: '시간표 및 알림' },
    homework: {
      title: '과제·보고서 상담',
      desc: '문제 업로드, 답안 확인, Word/PDF/PPT보내기',
    },
    soon: '준비 중',
    open: '열기',
  },
};

function readUser() {
  try {
    const raw = localStorage.getItem(CLASSROOM_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function OnlineClassroomPage() {
  const [lang, setLang] = useState('th');
  const [user, setUser] = useState(null);

  const t = copy[lang] || copy.th;

  useEffect(() => {
    setUser(readUser());
    const saved = localStorage.getItem('ge_lang');
    if (saved === 'en' || saved === 'ko' || saved === 'th') setLang(saved);
  }, []);

  const displayName = user?.name || user?.username || user?.email || '';

  const cards = [
    {
      icon: BookOpenCheck,
      href: '/online-classroom/homework-advisor',
      active: true,
      ...t.homework,
    },
    { icon: GraduationCap, ...t.rooms, active: false },
    { icon: Video, ...t.replay, active: false },
    { icon: FileText, ...t.docs, active: false },
    { icon: Calendar, ...t.schedule, active: false },
  ];

  return (
    <>
      <OnlineClassroomHeader lang={lang} />
      <main className="oc-main">
        <p className="oc-welcome">
          {t.welcome}
          {displayName ? (
            <>
              , <span>{displayName}</span>
            </>
          ) : null}
        </p>

        <div className="oc-grid">
          {cards.map(({ icon: Icon, title, desc, href, active }) =>
            active && href ? (
              <Link key={title} href={href} className="oc-card oc-card--link">
                <div className="oc-card-icon" aria-hidden>
                  <Icon size={22} strokeWidth={2.25} />
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
                <span className="oc-badge-open">{t.open}</span>
              </Link>
            ) : (
              <article key={title} className="oc-card">
                <div className="oc-card-icon" aria-hidden>
                  <Icon size={22} strokeWidth={2.25} />
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
                <span className="oc-badge-soon">{t.soon}</span>
              </article>
            ),
          )}
        </div>
      </main>
    </>
  );
}
