'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { publicHubHref } from '@/lib/data';
import { getNavExtraLabels } from '@/lib/ge-energy-tech/customer-tools-i18n';
import { SMART_METER_PRODUCT_ID } from '@/lib/meter-order';
import { getMeterOrderCopy } from '@/lib/ge-energy-tech-meter-order-i18n';
import MeterOrderModal from '@/components/ge-energy-tech/MeterOrderModal';

const LANGUAGE_STORAGE_KEY = 'ge-energy-tech-lang';

/** Pick localized string: lang code → en → th */
function pickLang(record, lang) {
  if (!record) return '';
  if (typeof record === 'string') return record;
  if (record[lang]) return record[lang];
  if (lang === 'zh-tw' && record.zh) return record.zh;
  return record.en || record.th || '';
}

const LANGUAGE_OPTIONS = [
  { code: 'th', label: 'ไทย' },
  { code: 'zh', label: '中文' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
  { code: 'zh-tw', label: '繁體中文' },
  { code: 'ms', label: 'Bahasa Melayu' },
];

const TRANSLATIONS = {
  th: {
    nav: {
      about: 'เกี่ยวกับเรา',
      services: 'บริการ',
      products: 'สินค้าของเรา',
      technology: 'เทคโนโลยี',
      contact: 'ติดต่อ',
      admin: 'Admin',
      register: 'ลงทะเบียนเข้าใช้แพลตฟอร์ม',
      signIn: 'ลงชื่อเข้าใช้แพลตฟอร์ม',
    },
    hero: {
      tag: 'พลังงานอัจฉริยะ · IoT · พลังงานสีเขียว',
      title1: 'พลังงานอัจฉริยะ',
      title2: 'เพื่ออนาคต',
      title3: 'ที่ยั่งยืน',
      sub: 'GE Energy Tech คือทีม Startup ด้านเทคโนโลยีพลังงาน ที่พัฒนาอุปกรณ์ IoT พร้อมจำหน่ายและบริการแพลตฟอร์มมอนิเตอร์ริ่ง วิเคราะห์พลังงานด้วย AI เพื่อยกระดับธุรกิจและสิ่งแวดล้อม',
      cta1: 'ดูบริการทั้งหมด',
      cta2: 'ติดต่อเรา',
      stats: ['อุปกรณ์ที่มอนิเตอร์', 'ลูกค้าองค์กร', 'การันตี uptime', 'ประเทศที่ให้บริการ'],
    },
    about: {
      badge: 'เกี่ยวกับบริษัท',
      title: 'บริษัท จีอี เอเนอร์จี่ เทค จำกัด',
      p1: 'เราเป็น Startup ที่มุ่งสร้างนวัตกรรมเทคโนโลยีพลังงาน โดยพัฒนาอุปกรณ์ IoT และระบบดิจิทัลสำหรับการมอนิเตอร์ริ่งพลังงานแบบเรียลไทม์ในโรงงาน อาคาร และองค์กร',
      p2: 'เราจำหน่ายพร้อมบริการแพลตฟอร์มวิเคราะห์พลังงานด้วย AI เพื่อช่วยลดการใช้พลังงาน ลดต้นทุน ลดการปล่อยคาร์บอน และขับเคลื่อนพลังงานสีเขียวเพื่อลดโลกร้อน',
      pillars: [
        { icon: '🎯', title: 'วิศวกรรมแม่นยำ', desc: 'ออกแบบระบบเน้นความเสถียร เชื่อถือได้ และทำงานต่อเนื่องระยะยาว' },
        { icon: '🤝', title: 'พาร์ทเนอร์ธุรกิจ', desc: 'ทำงานร่วมกับลูกค้าตั้งแต่การวางแผนจนถึงใช้งานจริง' },
        { icon: '🌏', title: 'รองรับระดับภูมิภาค', desc: 'รองรับการใช้งานหลายประเทศและหลายภาษาในเอเชีย' },
        { icon: '🔬', title: 'ขับเคลื่อนด้วย R&D', desc: 'พัฒนานวัตกรรม IoT และ AI อย่างต่อเนื่อง' },
      ],
    },
    services: {
      badge: 'บริการของเรา',
      title: ['โซลูชันครบวงจร', 'สำหรับทุกธุรกิจ'],
      sub: 'ให้บริการครบตั้งแต่พัฒนาอุปกรณ์ IoT จำหน่ายอุปกรณ์ ติดตั้งระบบ ไปจนถึงแพลตฟอร์ม AI สำหรับมอนิเตอร์และวิเคราะห์พลังงาน',
    },
    products: {
      badge: 'สินค้าของเรา',
      title: ['ผลิตภัณฑ์', 'นวัตกรรมพลังงาน'],
      sub: 'อุปกรณ์และระบบที่ออกแบบและพัฒนาโดยทีมวิศวกรของ GE Energy Tech เพื่อการจัดการพลังงานที่มีประสิทธิภาพสูงสุด',
      inquiry: 'สอบถามสินค้า',
    },
    tech: {
      badge: 'เทคโนโลยีที่ใช้',
      title: ['สร้างด้วย', 'เทคโนโลยีชั้นนำ'],
      sub: 'พัฒนาเทคโนโลยีใหม่ด้านพลังงานอย่างต่อเนื่อง เพื่อเพิ่มประสิทธิภาพพลังงานและรองรับเป้าหมาย Net Zero',
    },
    contact: {
      badge: 'ติดต่อเรา',
      title: ['พร้อมเริ่มโครงการ', 'ของคุณ?'],
      head: 'มาคุยกันได้เลย',
      sub: 'ทีมงานพร้อมให้คำปรึกษา ออกแบบโซลูชัน และประเมินงบประมาณให้โดยไม่มีค่าใช้จ่าย',
      company: 'บริษัท',
      address: 'ที่อยู่',
      addressValue: 'สาธารณรัฐเกาหลี',
      systems: 'ระบบ',
      languages: 'ภาษา',
      formTitle: 'ส่งข้อความถึงเรา',
      name: 'ชื่อ – Name',
      email: 'อีเมล – Email',
      subject: 'หัวข้อ – Subject',
      message: 'รายละเอียด – Message',
      submit: 'ส่งข้อความ →',
      placeholders: ['ชื่อของคุณ / Your name', 'email@company.com', 'สนใจบริการ / Service inquiry', 'รายละเอียดโครงการหรือคำถามของคุณ…'],
      sending: 'กำลังส่ง...',
      success: 'ส่งข้อความเรียบร้อยแล้ว ทีมงานจะติดต่อกลับทางอีเมล',
      error: 'ส่งข้อความไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
    },
    pq: {
      badge: 'นวัตกรรมคุณภาพไฟฟ้า',
      titleBefore: 'พัฒนา',
      titleEm: 'อุปกรณ์และระบบ',
      titleAfter: 'คุณภาพไฟฟ้า',
      sub: 'นวัตกรรมเครื่องปรับแรงดัน ควบคุมความถี่ แก้ไขความเพี้ยนฮาร์มอนิก (THD) และระบบบริหารจัดการพลังงาน (EMS) เพื่อความเสถียรและประสิทธิภาพสูงสุด',
      items: [
        { icon: '🔋', title: 'เครื่องปรับแรงดันอัจฉริยะ', desc: 'พัฒนาอุปกรณ์ปรับแรงดันไฟฟ้าแบบอัตโนมัติ รองรับโหลดผันผวน ปกป้องเครื่องจักรและอุปกรณ์จากแรงดันสูงหรือต่ำเกินกำหนด', tags: ['Voltage Regulator', 'AVR', 'ป้องกันแรงดัน'], color: '#f59e0b' },
        { icon: '〰️', title: 'ควบคุมความถี่ไฟฟ้า', desc: 'ระบบควบคุมและรักษาความถี่ไฟฟ้า (Hz) ให้มีเสถียรภาพ เพื่อการทำงานของมอเตอร์และระบบอิเล็กทรอนิกส์ที่มีประสิทธิภาพ', tags: ['Frequency', 'Hz Stability', 'มอเตอร์'], color: '#0ea5e9' },
        { icon: '📉', title: 'แก้ไขความเพี้ยนฮาร์มอนิก (THD)', desc: 'เทคโนโลยีกรองและแก้ไขความเพี้ยนของกระแสไฟฟ้า ลดความสูญเสียพลังงาน ลดความร้อนสะสม และปกป้องระบบไฟฟ้า', tags: ['THD', 'ฮาร์มอนิก Filter', 'Power Quality'], color: '#e53935' },
        { icon: '📊', title: 'ระบบบริหารจัดการพลังงาน (EMS)', desc: 'แพลตฟอร์มดิจิทัลสำหรับวิเคราะห์ มอนิเตอร์ และบริหารจัดการการใช้พลังงานองค์กรแบบครบวงจร ด้วย Dashboard และ AI Insight แบบเรียลไทม์', tags: ['EMS', 'Energy Management', 'AI Dashboard'], color: '#7c3aed' },
      ],
    },
    footer: {
      services: 'บริการ',
      systems: 'ระบบ',
      rights: 'สงวนลิขสิทธิ์',
      privacy: 'ความเป็นส่วนตัว',
      terms: 'เงื่อนไข',
      portals: 'พอร์ทัลทั้งหมด',
      privacyTitle: 'นโยบายความเป็นส่วนตัว',
      privacyBody: [
        'เราให้ความสำคัญกับความเป็นส่วนตัวของคุณ',
        'ข้อมูลที่คุณส่งผ่านแบบฟอร์ม (เช่น อีเมล/ชื่อ/ข้อความ/เอกสารแนบ) ใช้เพื่อการติดต่อกลับและให้บริการเท่านั้น',
        'เราไม่ขายข้อมูลส่วนบุคคลให้บุคคลที่สาม',
      ],
      termsTitle: 'ข้อกำหนดและเงื่อนไข',
      termsBody: [
        'การใช้งานเว็บไซต์นี้ถือว่าคุณยอมรับเงื่อนไขการใช้งาน',
        'ข้อมูลราคา/สเปกอาจเปลี่ยนแปลงได้ตามการประเมินหน้างานและรายละเอียดทางเทคนิค',
        'คำสั่งซื้อจะได้รับการยืนยันเมื่อทีมงานตรวจสอบข้อมูลและหลักฐานการโอนเงินแล้ว',
      ],
      portalsTitle: 'พอร์ทัลทั้งหมด',
      portalsBody: [
        'พอร์ทัลลูกค้า: ลงทะเบียน/ลงชื่อเข้าใช้เพื่อเข้าหน้า Customer Dashboard',
        'ติดตามการจัดส่งสินค้า: ตรวจสอบสถานะด้วยอีเมลหรือเลขที่ใบสั่งซื้อ',
        'บริการหลังการขาย: แชทกับเจ้าหน้าที่เพื่อรับการช่วยเหลือ',
      ],
    },
  },
  en: {
    nav: {
      about: 'About',
      services: 'Services',
      products: 'Our Products',
      technology: 'Technology',
      contact: 'Contact',
      admin: 'Admin',
      register: 'Register for Platform',
      signIn: 'Sign In to Platform',
    },
    hero: {
      tag: 'Smart Energy · IoT · Green Innovation',
      title1: 'Smart Energy',
      title2: 'for a',
      title3: 'Sustainable Future',
      sub: 'GE Energy Tech is an energy-technology startup developing IoT devices and delivering monitoring platforms with AI-powered energy analytics for modern enterprises.',
      cta1: 'Explore Services',
      cta2: 'Contact Us',
      stats: ['Devices Monitored', 'Enterprise Clients', 'Uptime Guarantee', 'Countries Served'],
    },
    about: {
      badge: 'About Company',
      title: 'GE Energy Tech Co., Ltd.',
      p1: 'We are a startup focused on next-generation energy technology, building IoT hardware and digital platforms for real-time energy monitoring across industrial and commercial operations.',
      p2: 'We provide device sales with full service and AI-driven energy analytics to reduce energy waste, lower carbon emissions, accelerate green energy adoption, and help tackle global warming.',
      pillars: [
        { icon: '🎯', title: 'Precision Engineering', desc: 'Built for reliability, stability, and long-term performance.' },
        { icon: '🤝', title: 'Trusted Partnership', desc: 'We collaborate from planning through deployment and support.' },
        { icon: '🌏', title: 'Regional Scale', desc: 'Designed for multi-country and multilingual operations in Asia.' },
        { icon: '🔬', title: 'R&D Driven', desc: 'Continuous innovation in IoT, AI, and energy technology.' },
      ],
    },
    services: {
      badge: 'Our Services',
      title: ['Integrated Solutions', 'for Every Business'],
      sub: 'End-to-end services from IoT device development and deployment to AI energy monitoring and analytics platforms.',
    },
    products: {
      badge: 'Our Products',
      title: ['Innovation', 'Energy Products'],
      sub: 'Devices and systems designed and built by GE Energy Tech engineers for maximum energy efficiency.',
      inquiry: 'Product Inquiry',
    },
    tech: {
      badge: 'Technology Stack',
      title: ['Built with', 'Leading Technologies'],
      sub: 'Continuous innovation in new energy technologies built to support green transition and Net Zero goals.',
    },
    contact: {
      badge: 'Contact',
      title: ['Ready to Start', 'Your Project?'],
      head: 'Let us talk',
      sub: 'Our team is ready to consult, design, and estimate your project with no upfront fee.',
      company: 'Company',
      address: 'Address',
      addressValue: 'Republic of Korea',
      systems: 'Systems',
      languages: 'Languages',
      formTitle: 'Send us a message',
      name: 'Name',
      email: 'Email',
      subject: 'Subject',
      message: 'Message',
      submit: 'Send Message →',
      placeholders: ['Your name', 'email@company.com', 'Service inquiry', 'Tell us about your project...'],
      sending: 'Sending...',
      success: 'Message sent successfully. Our team will reply by email.',
      error: 'Unable to send message. Please try again.',
    },
    pq: {
      badge: 'Power Quality Innovation',
      titleBefore: 'Developing',
      titleEm: 'Smart Power',
      titleAfter: 'Quality Devices',
      sub: 'Innovation in voltage regulation, frequency control, THD correction, and enterprise EMS for maximum stability and efficiency.',
      items: [
        { icon: '🔋', title: 'Smart Voltage Regulator', desc: 'Automatic voltage regulation devices for fluctuating loads, protecting equipment from over/under voltage conditions.', tags: ['Voltage Regulator', 'AVR', 'Stabilization'], color: '#f59e0b' },
        { icon: '〰️', title: 'Frequency Control System', desc: 'Systems to maintain and stabilize electrical frequency (Hz), ensuring reliable operation of motors and sensitive electronics.', tags: ['Frequency', 'Hz Stability', 'Motor Control'], color: '#0ea5e9' },
        { icon: '📉', title: 'Harmonic Distortion (THD) Correction', desc: 'Active and passive harmonic filtering to reduce THD, minimize energy losses, prevent overheating, and protect electrical infrastructure.', tags: ['THD', 'Harmonic Filter', 'Power Quality'], color: '#e53935' },
        { icon: '📊', title: 'Energy Management System (EMS)', desc: 'End-to-end digital platform for analyzing, monitoring, and managing enterprise energy usage with real-time dashboards and AI-driven insights.', tags: ['EMS', 'Energy Management', 'AI Dashboard'], color: '#7c3aed' },
      ],
    },
    footer: {
      services: 'Services',
      systems: 'Systems',
      rights: 'All rights reserved.',
      privacy: 'Privacy',
      terms: 'Terms',
      portals: 'Portals',
      privacyTitle: 'Privacy Policy',
      privacyBody: [
        'We take your privacy seriously.',
        'Information you submit (email/name/message/attachments) is used only to respond and provide our services.',
        'We do not sell personal data to third parties.',
      ],
      termsTitle: 'Terms & Conditions',
      termsBody: [
        'By using this website, you agree to these terms.',
        'Prices/specifications may change based on site assessment and technical requirements.',
        'Orders are confirmed after our team verifies your details and payment slip.',
      ],
      portalsTitle: 'Portals',
      portalsBody: [
        'Customer portal: register/sign in to access the Customer Dashboard.',
        'Shipment tracking: check updates using email or order number.',
        'After-sales support: chat with our staff for assistance.',
      ],
    },
  },
};

const FALLBACK_LANG = 'en';
const CLONED_LANGS = ['zh', 'vi', 'ko', 'ja', 'zh-tw', 'ms'];
for (const code of CLONED_LANGS) {
  TRANSLATIONS[code] = {
    ...TRANSLATIONS.en,
    nav: { ...TRANSLATIONS.en.nav },
    hero: { ...TRANSLATIONS.en.hero },
    about: {
      ...TRANSLATIONS.en.about,
      pillars: [...TRANSLATIONS.en.about.pillars],
    },
    services: { ...TRANSLATIONS.en.services },
    products: { ...TRANSLATIONS.en.products },
    pq: { ...TRANSLATIONS.en.pq, items: [...TRANSLATIONS.en.pq.items] },
    tech: { ...TRANSLATIONS.en.tech },
    contact: { ...TRANSLATIONS.en.contact },
    footer: { ...TRANSLATIONS.en.footer },
  };
}

const LANGUAGE_OVERRIDES = {
  zh: {
    nav: { about: '关于我们', services: '服务', products: '我们的产品', technology: '技术', contact: '联系', admin: 'Admin', register: '注册使用平台', signIn: '登录平台' },
    hero: { tag: '智慧能源 · IoT · 绿色创新', title1: '智慧能源', title2: '迈向', title3: '可持续未来', cta1: '查看服务', cta2: '联系我们', stats: ['监控设备', '企业客户', '可用性保障', '服务国家'] },
    services: { badge: '我们的服务', title: ['一体化解决方案', '适用于各类企业'], sub: '从物联网设备研发部署到AI能源监测与分析平台的全流程服务。' },
    products: { badge: '我们的产品', title: ['创新', '能源产品'], sub: '由GE Energy Tech工程师设计制造的设备与系统，提供最佳能源效率。', inquiry: '产品咨询' },
    tech: { badge: '技术栈', title: ['采用', '领先技术'], sub: '持续创新新能源技术，支持绿色转型与净零目标。' },
    contact: { badge: '联系', title: ['准备开始', '您的项目？'], head: '欢迎咨询', sub: '我们的团队可提供免费咨询、方案设计与预算评估。', submit: '发送消息 →', sending: '发送中...', success: '消息已发送，我们将通过邮件回复。', error: '发送失败，请重试。' },
    footer: { services: '服务', systems: '系统', rights: '版权所有。', privacy: '隐私', terms: '条款', portals: '门户' },
  },
  vi: {
    nav: { about: 'Giới thiệu', services: 'Dịch vụ', products: 'Sản phẩm', technology: 'Công nghệ', contact: 'Liên hệ', admin: 'Admin', register: 'Đăng ký nền tảng', signIn: 'Đăng nhập nền tảng' },
    hero: { tag: 'Năng lượng thông minh · IoT · Đổi mới xanh', title1: 'Năng lượng thông minh', title2: 'cho một', title3: 'tương lai bền vững', cta1: 'Xem dịch vụ', cta2: 'Liên hệ', stats: ['Thiết bị giám sát', 'Khách hàng doanh nghiệp', 'Cam kết uptime', 'Quốc gia phục vụ'] },
    services: { badge: 'Dịch vụ của chúng tôi', title: ['Giải pháp tích hợp', 'cho mọi doanh nghiệp'], sub: 'Dịch vụ trọn gói từ phát triển thiết bị IoT đến nền tảng giám sát và phân tích năng lượng bằng AI.' },
    products: { badge: 'Sản phẩm', title: ['Đổi mới', 'Sản phẩm năng lượng'], sub: 'Thiết bị và hệ thống do kỹ sư GE Energy Tech thiết kế để tối ưu hiệu quả năng lượng.', inquiry: 'Hỏi về sản phẩm' },
    tech: { badge: 'Công nghệ sử dụng', title: ['Xây dựng bằng', 'công nghệ hàng đầu'], sub: 'Đổi mới liên tục về công nghệ năng lượng mới hỗ trợ chuyển đổi xanh và Net Zero.' },
    contact: { badge: 'Liên hệ', title: ['Sẵn sàng bắt đầu', 'dự án của bạn?'], head: 'Hãy trao đổi với chúng tôi', sub: 'Đội ngũ sẵn sàng tư vấn, thiết kế và báo giá miễn phí.', submit: 'Gửi tin nhắn →', sending: 'Đang gửi...', success: 'Đã gửi tin nhắn. Chúng tôi sẽ phản hồi qua email.', error: 'Gửi thất bại. Vui lòng thử lại.' },
    footer: { services: 'Dịch vụ', systems: 'Hệ thống', rights: 'Mọi quyền được bảo lưu.', privacy: 'Quyền riêng tư', terms: 'Điều khoản', portals: 'Cổng hệ thống' },
  },
  ko: {
    nav: { about: '회사 소개', services: '서비스', products: '제품 소개', technology: '기술', contact: '문의', admin: 'Admin', register: '플랫폼 등록', signIn: '플랫폼 로그인' },
    hero: { tag: '스마트 에너지 · IoT · 그린 혁신', title1: '스마트 에너지', title2: '지속가능한', title3: '미래를 위해', cta1: '서비스 보기', cta2: '문의하기', stats: ['모니터링 장치', '기업 고객', '가동률 보장', '서비스 국가'] },
    services: { badge: '서비스', title: ['통합 솔루션', '모든 비즈니스를 위해'], sub: 'IoT 장치 개발·배포부터 AI 에너지 모니터링·분석 플랫폼까지 엔드투엔드 서비스를 제공합니다.' },
    products: { badge: '제품 소개', title: ['혁신', '에너지 제품'], sub: 'GE Energy Tech 엔지니어가 설계한 최고 효율의 에너지 장치 및 시스템.', inquiry: '제품 문의' },
    tech: { badge: '기술 스택', title: ['최신', '핵심 기술로 구축'], sub: '그린 전환과 넷제로 목표를 지원하는 신에너지 기술 혁신을 지속합니다.' },
    contact: { badge: '문의', title: ['프로젝트를', '시작할 준비가 되셨나요?'], head: '지금 상담해 보세요', sub: '무료 상담, 솔루션 설계, 예산 견적을 제공합니다.', addressValue: '대한민국', submit: '메시지 보내기 →', sending: '전송 중...', success: '메시지가 전송되었습니다. 이메일로 답변드리겠습니다.', error: '전송에 실패했습니다. 다시 시도해 주세요.' },
    footer: { services: '서비스', systems: '시스템', rights: '모든 권리 보유.', privacy: '개인정보', terms: '이용약관', portals: '포털' },
  },
  ja: {
    nav: { about: '会社情報', services: 'サービス', products: '製品紹介', technology: '技術', contact: 'お問い合わせ', admin: 'Admin', register: 'プラットフォーム登録', signIn: 'プラットフォームログイン' },
    hero: { tag: 'スマートエネルギー · IoT · グリーン革新', title1: 'スマートエネルギー', title2: '持続可能な', title3: '未来へ', cta1: 'サービスを見る', cta2: 'お問い合わせ', stats: ['監視デバイス', '法人顧客', '稼働率保証', '提供国'] },
    services: { badge: 'サービス', title: ['統合ソリューション', 'あらゆる企業向け'], sub: 'IoT機器の開発・導入からAIエネルギー監視・分析プラットフォームまで一貫して提供します。' },
    products: { badge: '製品紹介', title: ['革新的な', 'エネルギー製品'], sub: 'GE Energy Techエンジニアが設計した高効率エネルギー機器・システム。', inquiry: '製品について問い合わせ' },
    tech: { badge: '技術スタック', title: ['先進', 'テクノロジーで構築'], sub: 'グリーン転換とネットゼロを支える新エネルギー技術を継続的に革新します。' },
    contact: { badge: 'お問い合わせ', title: ['プロジェクトを', '始めませんか？'], head: 'まずはご相談ください', sub: '無料相談・ソリューション設計・見積もりに対応します。', submit: '送信する →', sending: '送信中...', success: 'メッセージを送信しました。メールでご連絡します。', error: '送信に失敗しました。もう一度お試しください。' },
    footer: { services: 'サービス', systems: 'システム', rights: '無断転載禁止。', privacy: 'プライバシー', terms: '利用規約', portals: 'ポータル' },
  },
  'zh-tw': {
    nav: { about: '關於我們', services: '服務', products: '我們的產品', technology: '技術', contact: '聯絡', admin: 'Admin', register: '註冊使用平台', signIn: '登入平台' },
    hero: { tag: '智慧能源 · IoT · 綠色創新', title1: '智慧能源', title2: '邁向', title3: '永續未來', cta1: '查看服務', cta2: '聯絡我們', stats: ['監控設備', '企業客戶', '可用性保證', '服務國家'] },
    services: { badge: '我們的服務', title: ['整合解決方案', '適用各類企業'], sub: '從物聯網設備研發部署到 AI 能源監測與分析平台的全流程服務。' },
    products: { badge: '我們的產品', title: ['創新', '能源產品'], sub: '由GE Energy Tech工程師設計製造的設備與系統，提供最佳能源效率。', inquiry: '產品詢問' },
    tech: { badge: '技術架構', title: ['採用', '領先技術'], sub: '持續創新新能源技術，支援綠色轉型與淨零目標。' },
    contact: { badge: '聯絡', title: ['準備開始', '您的專案？'], head: '歡迎與我們洽談', sub: '團隊可提供免費諮詢、方案設計與預算評估。', submit: '送出訊息 →', sending: '傳送中...', success: '訊息已送出，我們將以電子郵件回覆。', error: '傳送失敗，請再試一次。' },
    footer: { services: '服務', systems: '系統', rights: '版權所有。', privacy: '隱私', terms: '條款', portals: '入口' },
  },
  ms: {
    nav: { about: 'Tentang', services: 'Perkhidmatan', products: 'Produk Kami', technology: 'Teknologi', contact: 'Hubungi', admin: 'Admin', register: 'Daftar Platform', signIn: 'Log Masuk Platform' },
    hero: { tag: 'Tenaga Pintar · IoT · Inovasi Hijau', title1: 'Tenaga Pintar', title2: 'untuk masa depan', title3: 'yang mampan', cta1: 'Lihat Perkhidmatan', cta2: 'Hubungi Kami', stats: ['Peranti Dipantau', 'Pelanggan Korporat', 'Jaminan Uptime', 'Negara Dilayan'] },
    services: { badge: 'Perkhidmatan Kami', title: ['Penyelesaian Bersepadu', 'untuk setiap perniagaan'], sub: 'Perkhidmatan hujung ke hujung dari pembangunan peranti IoT hingga platform pemantauan dan analitik tenaga AI.' },
    products: { badge: 'Produk Kami', title: ['Inovasi', 'Produk Tenaga'], sub: 'Peranti dan sistem yang direka oleh jurutera GE Energy Tech untuk kecekapan tenaga maksimum.', inquiry: 'Pertanyaan Produk' },
    tech: { badge: 'Teknologi', title: ['Dibina dengan', 'teknologi terkemuka'], sub: 'Inovasi berterusan dalam teknologi tenaga baharu untuk sokongan peralihan hijau dan Net Zero.' },
    contact: { badge: 'Hubungi', title: ['Bersedia mulakan', 'projek anda?'], head: 'Mari berbincang', sub: 'Pasukan kami sedia berunding, mereka bentuk penyelesaian dan anggaran tanpa bayaran awal.', submit: 'Hantar Mesej →', sending: 'Menghantar...', success: 'Mesej dihantar. Kami akan membalas melalui e-mel.', error: 'Gagal menghantar. Sila cuba lagi.' },
    footer: { services: 'Perkhidmatan', systems: 'Sistem', rights: 'Hak cipta terpelihara.', privacy: 'Privasi', terms: 'Terma', portals: 'Portal' },
  },
};

for (const [code, override] of Object.entries(LANGUAGE_OVERRIDES)) {
  const base = TRANSLATIONS[code];
  if (!base) continue;
  TRANSLATIONS[code] = {
    ...base,
    ...override,
    nav: { ...base.nav, ...(override.nav || {}) },
    hero: { ...base.hero, ...(override.hero || {}) },
    about: { ...base.about, ...(override.about || {}) },
    services: { ...base.services, ...(override.services || {}) },
    products: { ...base.products, ...(override.products || {}) },
    pq: override.pq
      ? { ...base.pq, ...override.pq, items: override.pq.items || base.pq.items }
      : base.pq,
    tech: { ...base.tech, ...(override.tech || {}) },
    contact: { ...base.contact, ...(override.contact || {}) },
    footer: { ...base.footer, ...(override.footer || {}) },
  };
}

const SERVICES = [
  { icon: '🚀', title: { th: 'โซลูชัน Startup เทคโนโลยีพลังงาน', en: 'Energy Technology Startup Solutions' }, desc: { th: 'นวัตกรรมเร็วสำหรับธุรกิจพลังงาน ตั้งแต่ตรวจสอบแนวคิดจนถึงใช้งานจริง', en: 'Startup-style rapid innovation for energy businesses, from concept validation to production rollout.' }, tags: ['Startup', 'MVP', 'Scale-up'], accent: 'linear-gradient(90deg, #0ea5e9, #1565c0)', iconBg: 'rgba(14,165,233,0.16)' },
  { icon: '🧩', title: { th: 'พัฒนาและจำหน่ายอุปกรณ์ IoT', en: 'IoT Device Development & Sales' }, desc: { th: 'ออกแบบ ผลิต และติดตั้งอุปกรณ์ IoT พร้อมบริการหลังการขาย', en: 'Design, engineering, and commercial delivery of IoT energy devices with installation and after-sales service.' }, tags: ['IoT Devices', 'Hardware', 'Service'], accent: 'linear-gradient(90deg, #1565c0, #0097a7)', iconBg: 'rgba(21,101,192,0.15)' },
  { icon: '⚡', title: { th: 'นวัตกรรมปรับแรงดันและความถี่', en: 'Voltage & Frequency Regulator Innovation' }, desc: { th: 'พัฒนาอุปกรณ์ปรับแรงดัน ควบคุมความถี่ และแก้ไข THD เพื่อคุณภาพไฟฟ้าและความปลอดภัย', en: 'Development of smart devices for voltage stabilization, frequency control, and harmonic distortion (THD) correction to ensure power quality and equipment safety.' }, tags: ['Voltage Regulator', 'Frequency', 'THD / Harmonics'], accent: 'linear-gradient(90deg, #f59e0b, #ea580c)', iconBg: 'rgba(245,158,11,0.14)' },
  { icon: '📡', title: { th: 'แพลตฟอร์มมอนิเตอร์ริ่ง (PaaS)', en: 'Monitoring Platform as a Service' }, desc: { th: 'แพลตฟอร์มคลาวด์มอนิเตอร์พลังงานแบบเรียลไทม์ แจ้งเตือน และแดชบอร์ดครบในที่เดียว', en: 'Cloud platform for real-time energy monitoring, alerts, dashboards, and operational control in one place.' }, tags: ['Monitoring', 'Cloud Platform', 'Real-time'], accent: 'linear-gradient(90deg, #0097a7, #26c6da)', iconBg: 'rgba(0,151,167,0.15)' },
  { icon: '🤖', title: { th: 'วิเคราะห์และบริหารพลังงานด้วย AI', en: 'AI Energy Analytics & Management' }, desc: { th: 'ระบบ EMS ด้วย AI วิเคราะห์การใช้พลังงาน คุณภาพไฟฟ้า และคาดการณ์ความต้องการ', en: 'AI-powered energy management system (EMS) for analyzing consumption patterns, power quality, demand forecasting, and delivering actionable optimization strategies.' }, tags: ['AI', 'EMS', 'Power Quality', 'Forecasting'], accent: 'linear-gradient(90deg, #6a1b9a, #9c27b0)', iconBg: 'rgba(106,27,154,0.15)' },
  { icon: '🌱', title: { th: 'พลังงานสีเขียวและลดคาร์บอน', en: 'Green Energy & Carbon Reduction' }, desc: { th: 'นวัตกรรมเพื่อการเปลี่ยนผ่านสู่พลังงานสีเขียว ลดคาร์บอน และผลกระทบต่อสภาพภูมิอากาศ', en: 'Innovation programs for green energy transition, carbon reduction, and measurable climate impact.' }, tags: ['Green Energy', 'Carbon', 'ESG'], accent: 'linear-gradient(90deg, #2e7d32, #43a047)', iconBg: 'rgba(46,125,50,0.15)' },
  { icon: '🔬', title: { th: 'ห้องปฏิบัติการนวัตกรรมพลังงาน', en: 'Next-Gen Energy Innovation Lab' }, desc: { th: 'วิจัยและพัฒนาเทคโนโลยีพลังงานใหม่เพื่อความยั่งยืนและความได้เปรียบทางการแข่งขัน', en: 'R&D for new energy technologies and advanced digital solutions to improve sustainability and competitiveness.' }, tags: ['R&D', 'Innovation', 'New Tech'], accent: 'linear-gradient(90deg, #059669, #0891b2)', iconBg: 'rgba(5,150,105,0.14)' },
];

const TECH = [
  { icon: '⚙️', name: { th: 'Next.js 15', en: 'Next.js 15' }, desc: { th: 'เฟรมเวิร์ก React สำหรับแอปพลิเคชันระดับ production', en: 'Full-stack React framework for production-grade applications.' } },
  { icon: '🗄️', name: { th: 'MySQL / Prisma', en: 'MySQL / Prisma' }, desc: { th: 'ฐานข้อมูลเชิงสัมพันธ์พร้อม migration และ schema', en: 'Relational data platform with migrations and schema governance.' } },
  { icon: '📶', name: { th: 'MQTT Broker', en: 'MQTT Broker' }, desc: { th: 'รับส่งข้อมูล IoT แบบเรียลไทม์อย่างเสถียร', en: 'Reliable real-time telemetry and event streaming for IoT devices.' } },
  { icon: '🤖', name: { th: 'AI Insights Engine', en: 'AI Insights Engine' }, desc: { th: 'วิเคราะห์และสร้าง insight อัตโนมัติจากข้อมูลปฏิบัติการ', en: 'Automated monitoring and insight generation from operational data.' } },
  { icon: '🐳', name: { th: 'Docker & CI/CD', en: 'Docker & CI/CD' }, desc: { th: 'Pipeline แบบ container สำหรับ deploy ที่ทำซ้ำได้', en: 'Containerized release pipelines with repeatable deployments.' } },
  { icon: '📱', name: { th: 'Responsive Web App', en: 'Responsive Web App' }, desc: { th: 'รองรับเดสก์ท็อป แท็บเล็ต และมือถือ', en: 'Optimized interface for desktop, tablet, and mobile.' } },
  { icon: '🔐', name: { th: 'JWT / RBAC Auth', en: 'JWT / RBAC Auth' }, desc: { th: 'ยืนยันตัวตนด้วย token และสิทธิ์ตามบทบาท', en: 'Token authentication with granular role-based permissions.' } },
  { icon: '☁️', name: { th: 'Cloud Infrastructure', en: 'Cloud Infrastructure' }, desc: { th: 'สถาปัตยกรรมคลาวด์ที่ขยายได้และเสถียร', en: 'Scalable and resilient architecture for enterprise reliability.' } },
];

const PRODUCTS = [
  {
    icon: '⚡',
    category: { th: 'เครื่องปรับแรงดัน', en: 'Voltage Regulator' },
    name: { th: 'Smart AVR Series', en: 'Smart AVR Series' },
    desc: { th: 'เครื่องปรับแรงดันไฟฟ้าอัตโนมัติอัจฉริยะ ควบคุมแรงดันให้คงที่ ป้องกันไฟกระชากและไฟตก รองรับโหลด 1–200 kVA', en: 'Intelligent automatic voltage regulator for stable voltage control, surge/sag protection, rated 1–200 kVA.' },
    specs: ['1–200 kVA', 'Response < 20ms', '±1% accuracy'],
    color: '#f59e0b',
    badge: { th: 'ขายดี', en: 'Best Seller' },
  },
  {
    icon: '〰️',
    category: { th: 'ควบคุมความถี่', en: 'Frequency Controller' },
    name: { th: 'FreqGuard Pro', en: 'FreqGuard Pro' },
    desc: { th: 'ระบบรักษาความถี่ไฟฟ้า (Hz) สำหรับโรงงานและโรงพยาบาล รองรับระบบ 50/60 Hz ควบคุมด้วย DSP ความแม่นยำสูง', en: 'High-precision DSP-based frequency stabilizer for industrial and medical facilities, supporting 50/60 Hz systems.' },
    specs: ['50 / 60 Hz', 'DSP Control', '±0.01 Hz accuracy'],
    color: '#0ea5e9',
    badge: null,
  },
  {
    icon: '📉',
    category: { th: 'กรองฮาร์มอนิก', en: 'Harmonic Filter' },
    name: { th: 'ActiveFilter THD-X', en: 'ActiveFilter THD-X' },
    desc: { th: 'ตัวกรองฮาร์มอนิกเชิงรุก ลด THD ได้มากกว่า 95% ปกป้องระบบไฟฟ้าจากความร้อนสะสมและความเสียหายของอุปกรณ์', en: 'Active harmonic filter reducing THD by over 95%, protecting electrical systems from overheating and equipment damage.' },
    specs: ['THD < 5%', 'Active filtering', 'Up to 600A'],
    color: '#e53935',
    badge: { th: 'ใหม่', en: 'New' },
  },
  {
    id: SMART_METER_PRODUCT_ID,
    icon: '📊',
    category: { th: 'มิเตอร์อัจฉริยะ', en: 'Smart Meter' },
    name: { th: 'GE-IoT Power Meter', en: 'GE-IoT Power Meter' },
    desc: { th: 'มิเตอร์วัดพลังงานแบบ IoT วัด V/I/kW/kWh/PF/THD แบบเรียลไทม์ ส่งข้อมูลผ่าน MQTT/Modbus เชื่อมต่อ Cloud Platform ได้ทันที', en: 'IoT-enabled power meter measuring V/I/kW/kWh/PF/THD in real time, transmitting via MQTT/Modbus to Cloud Platform.' },
    specs: ['MQTT / Modbus', 'V · I · kW · THD', 'Cloud ready'],
    color: '#7c3aed',
    badge: null,
  },
  {
    icon: '🌱',
    category: { th: 'ระบบพลังงานสีเขียว', en: 'Green Energy System' },
    name: { th: 'SolarEdge Monitor', en: 'SolarEdge Monitor' },
    desc: { th: 'ระบบมอนิเตอร์และวิเคราะห์พลังงานโซลาร์เซลล์ พร้อมคำนวณ Carbon Credit วัดประสิทธิภาพแผงโซลาร์แบบรายวัน', en: 'Solar energy monitoring and analysis system with Carbon Credit calculation and daily panel efficiency tracking.' },
    specs: ['Solar PV', 'Carbon Credit', 'Daily report'],
    color: '#16a34a',
    badge: null,
  },
  {
    icon: '🤖',
    category: { th: 'แพลตฟอร์ม AI', en: 'AI Platform' },
    name: { th: 'GE-EMS Cloud', en: 'GE-EMS Cloud' },
    desc: { th: 'แพลตฟอร์มบริหารจัดการพลังงานองค์กรด้วย AI วิเคราะห์รูปแบบการใช้พลังงาน คาดการณ์ความต้องการ และให้คำแนะนำประหยัดพลังงาน', en: 'AI-powered enterprise energy management platform for consumption pattern analysis, demand forecasting, and saving recommendations.' },
    specs: ['AI Analytics', 'Demand forecast', 'Multi-site'],
    color: '#7c3aed',
    badge: { th: 'Cloud SaaS', en: 'Cloud SaaS' },
  },
];

const STATS = ['500+', '15+', '99.9%', '3'];

export default function GeEnergyTechClientPage() {
  const [lang, setLang] = useState('th');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitState, setSubmitState] = useState({
    status: 'idle',
    message: '',
  });
  const [meterOrderOpen, setMeterOrderOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && LANGUAGE_OPTIONS.some((item) => item.code === stored)) {
      setLang(stored);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useMemo(() => TRANSLATIONS[lang] || TRANSLATIONS[FALLBACK_LANG], [lang]);
  const navExtra = useMemo(() => getNavExtraLabels(lang), [lang]);
  const meterT = useMemo(() => getMeterOrderCopy(lang), [lang]);
  const submitLabel = submitState.status === 'sending' ? t.contact.sending : t.contact.submit;
  const legalTitle =
    legalOpen === 'privacy'
      ? t.footer.privacyTitle
      : legalOpen === 'terms'
        ? t.footer.termsTitle
        : legalOpen === 'portals'
          ? t.footer.portalsTitle
          : '';
  const legalBody =
    legalOpen === 'privacy'
      ? t.footer.privacyBody
      : legalOpen === 'terms'
        ? t.footer.termsBody
        : legalOpen === 'portals'
          ? t.footer.portalsBody
          : [];

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();
    setSubmitState({ status: 'sending', message: '' });
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, lang }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to send message');
      }
      setSubmitState({
        status: 'success',
        message: t.contact.success,
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setSubmitState({
        status: 'error',
        message: t.contact.error,
      });
    }
  };

  return (
    <>
      <nav className="get-nav">
        <a href="#hero" className="get-nav-brand">
          <Image src="/ge-energyTech/138568-transparent.png" alt="GE Energy Tech logo" width={40} height={40} className="get-nav-logo" priority />
          <span className="get-nav-name">
            <span>GE</span> ENERGY TECH
          </span>
        </a>
        <div className="get-nav-links">
          <a href="#about">{t.nav.about}</a>
          <a href="#services">{t.nav.services}</a>
          <a href="#products">{t.nav.products}</a>
          <a href="#technology">{t.nav.technology}</a>
          <a href="#contact">{t.nav.contact}</a>
          <a href="/ge-energy-tech/shipping-tracking">{navExtra.tracking}</a>
          <a href="/ge-energy-tech/after-sales-chat">{navExtra.afterSales}</a>
        </div>
        <div className="get-nav-actions">
          <a href={publicHubHref('/ge-energy-erp-login')} className="get-nav-btn get-nav-btn--admin">
            {t.nav.admin}
          </a>
          <a href={publicHubHref('/register-geet')} className="get-nav-btn get-nav-btn--register">
            {t.nav.register}
          </a>
          <a href={publicHubHref('/ge-energy-tech/login')} className="get-nav-btn get-nav-btn--signin">
            {t.nav.signIn}
          </a>
        </div>
      </nav>

      <section className="get-lang-switch">
        <div className="get-container">
          <div className="get-lang-switch-inner">
            {LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.code}
                type="button"
                className={`get-lang-btn ${lang === option.code ? 'is-active' : ''}`}
                onClick={() => setLang(option.code)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="get-hero" id="hero">
        <div className="get-hero-bg" aria-hidden />
        <div className="get-hero-grid" aria-hidden />
        <div className="get-hero-inner">
          <div className="get-hero-text">
            <p className="get-hero-tag">{t.hero.tag}</p>
            <h1 className="get-hero-h1">
              {t.hero.title1}
              <br />
              <em>{t.hero.title2}</em> {t.hero.title3}
            </h1>
            <p className="get-hero-sub">{t.hero.sub}</p>
            <div className="get-hero-actions">
              <a href="#services" className="get-btn get-btn--primary">
                {t.hero.cta1}
              </a>
              <a href="#contact" className="get-btn get-btn--ghost">
                {t.hero.cta2}
              </a>
            </div>
            <div className="get-hero-platform">
              <a href={publicHubHref('/register-geet')} className="get-hero-platform-btn">{t.nav.register}</a>
              <a href={publicHubHref('/ge-energy-tech/login')} className="get-hero-platform-btn get-hero-platform-btn--primary">{t.nav.signIn}</a>
              <a href={publicHubHref('/ge-energy-erp-login')} className="get-hero-platform-btn get-hero-platform-btn--admin">{t.nav.admin}</a>
            </div>
            <div className="get-hero-stats">
              {STATS.map((value, index) => (
                <div key={value} className="get-hero-stat">
                  <strong>{value}</strong>
                  <span>{t.hero.stats[index]}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="get-hero-visual">
            <div className="get-hero-logo-wrap">
              <div className="get-hero-logo-ring" aria-hidden />
              <Image src="/ge-energyTech/138568-transparent.png" alt="GE Energy Tech" width={230} height={230} className="get-hero-logo-img" priority />
            </div>
          </div>
        </div>
      </section>

      <section className="get-section get-about" id="about">
        <div className="get-container">
          <div className="get-about-grid">
            <div className="get-about-text">
              <div className="get-badge" style={{ marginBottom: 20 }}>{t.about.badge}</div>
              <h3>{t.about.title}</h3>
              <p>{t.about.p1}</p>
              <p>{t.about.p2}</p>
            </div>
            <div className="get-about-pillars">
              {t.about.pillars.map((pillar) => (
                <div key={pillar.title} className="get-pillar">
                  <span className="get-pillar-icon">{pillar.icon}</span>
                  <div className="get-pillar-content">
                    <h4>{pillar.title}</h4>
                    <p>{pillar.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Power Quality Innovation ───────────────────────────────────── */}
      <section className="get-section get-pq" id="innovation">
        <div className="get-container">
          <div className="get-section-head">
            <div className="get-badge get-badge--amber">{t.pq.badge}</div>
            <h2 className="get-section-h2">
              {t.pq.titleBefore} <em>{t.pq.titleEm}</em> {t.pq.titleAfter}
            </h2>
            <p className="get-section-sub">{t.pq.sub}</p>
          </div>
          <div className="get-pq-grid">
            {t.pq.items.map((item) => (
              <div key={item.title} className="get-pq-card" style={{ '--pq-color': item.color }}>
                <div className="get-pq-icon">{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                <div className="get-service-tags" style={{ marginTop: 14 }}>
                  {item.tags.map((tag) => (
                    <span key={tag} className="get-service-tag">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="get-section" id="services">
        <div className="get-container">
          <div className="get-section-head">
            <div className="get-badge">{t.services.badge}</div>
            <h2 className="get-section-h2">
              {t.services.title[0]}
              <br />
              <em>{t.services.title[1]}</em>
            </h2>
            <p className="get-section-sub">{t.services.sub}</p>
          </div>
          <div className="get-services-grid">
            {SERVICES.map((service) => (
              <div key={pickLang(service.title, lang)} className="get-service-card" style={{ '--card-accent': service.accent }}>
                <div className="get-service-icon" style={{ '--icon-bg': service.iconBg, background: service.iconBg }}>
                  {service.icon}
                </div>
                <h3>{pickLang(service.title, lang)}</h3>
                <p>{pickLang(service.desc, lang)}</p>
                <div className="get-service-tags">
                  {service.tags.map((tag) => (
                    <span key={tag} className="get-service-tag">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Products ──────────────────────────────────────────────────── */}
      <section className="get-section get-products" id="products">
        <div className="get-container">
          <div className="get-section-head">
            <div className="get-badge get-badge--green">{t.products.badge}</div>
            <h2 className="get-section-h2">
              {t.products.title[0]} <em>{t.products.title[1]}</em>
            </h2>
            <p className="get-section-sub">{t.products.sub}</p>
          </div>
          <div className="get-products-grid">
            {PRODUCTS.map((p) => (
              <div key={pickLang(p.name, lang)} className="get-product-card" style={{ '--prod-color': p.color }}>
                {p.badge && (
                  <span className="get-product-badge">{pickLang(p.badge, lang)}</span>
                )}
                <div className="get-product-icon">{p.icon}</div>
                <p className="get-product-category">{pickLang(p.category, lang)}</p>
                <h3 className="get-product-name">{pickLang(p.name, lang)}</h3>
                <p className="get-product-desc">{pickLang(p.desc, lang)}</p>
                <div className="get-product-specs">
                  {p.specs.map((s) => (
                    <span key={s} className="get-product-spec">{s}</span>
                  ))}
                </div>
                <div className="get-product-actions">
                  {p.id === SMART_METER_PRODUCT_ID ? (
                    <button
                      type="button"
                      className="get-product-order"
                      onClick={() => setMeterOrderOpen(true)}
                    >
                      {meterT.orderBtn} →
                    </button>
                  ) : null}
                  <a href="#contact" className="get-product-inquiry">
                    {p.id === SMART_METER_PRODUCT_ID ? meterT.inquiry : t.products.inquiry} →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <MeterOrderModal open={meterOrderOpen} onClose={() => setMeterOrderOpen(false)} lang={lang} />

      <div className="get-stats-banner">
        <div className="get-container">
          <div className="get-stats-grid">
            {STATS.map((value, index) => (
              <div key={value} className="get-stat-item">
                <strong>{value}</strong>
                <p>{t.hero.stats[index]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <section className="get-section get-tech" id="technology">
        <div className="get-container">
          <div className="get-section-head">
            <div className="get-badge get-badge--green">{t.tech.badge}</div>
            <h2 className="get-section-h2">
              {t.tech.title[0]} <em>{t.tech.title[1]}</em>
            </h2>
            <p className="get-section-sub">{t.tech.sub}</p>
          </div>
          <div className="get-tech-grid">
            {TECH.map((techItem) => (
              <div key={pickLang(techItem.name, lang)} className="get-tech-card">
                <span>{techItem.icon}</span>
                <strong>{pickLang(techItem.name, lang)}</strong>
                <p>{pickLang(techItem.desc, lang)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="get-section get-contact" id="contact">
        <div className="get-container">
          <div className="get-section-head">
            <div className="get-badge">{t.contact.badge}</div>
            <h2 className="get-section-h2">
              {t.contact.title[0]} <em>{t.contact.title[1]}</em>
            </h2>
          </div>
          <div className="get-contact-inner">
            <div className="get-contact-info">
              <h3>{t.contact.head}</h3>
              <p>{t.contact.sub}</p>
              <div className="get-contact-items">
                <div className="get-contact-item">
                  <span className="get-contact-item-icon">🏢</span>
                  <div className="get-contact-item-text">
                    <strong>{t.contact.company}</strong>
                    <span>GE ENERGY TECH CO., LTD.</span>
                  </div>
                </div>
                <div className="get-contact-item">
                  <span className="get-contact-item-icon">📍</span>
                  <div className="get-contact-item-text">
                    <strong>{t.contact.address}</strong>
                    <span>{t.contact.addressValue}</span>
                  </div>
                </div>
                <div className="get-contact-item">
                  <span className="get-contact-item-icon">🌐</span>
                  <div className="get-contact-item-text">
                    <strong>{t.contact.systems}</strong>
                    <span>Energy Dashboard · IoT Platform</span>
                  </div>
                </div>
                <div className="get-contact-item">
                  <span className="get-contact-item-icon">🌏</span>
                  <div className="get-contact-item-text">
                    <strong>{t.contact.languages}</strong>
                    <span>ไทย · 中文 · Tiếng Việt · English · 한국어 · 日本語 · 繁體中文 · Bahasa Melayu</span>
                  </div>
                </div>
              </div>
            </div>
            <form className="get-contact-form" onSubmit={handleContactSubmit}>
              <h4>{t.contact.formTitle}</h4>
              <div className="get-form-field">
                <label>{t.contact.name}</label>
                <input
                  type="text"
                  name="name"
                  placeholder={t.contact.placeholders[0]}
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="get-form-field">
                <label>{t.contact.email}</label>
                <input
                  type="email"
                  name="email"
                  placeholder={t.contact.placeholders[1]}
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="get-form-field">
                <label>{t.contact.subject}</label>
                <input
                  type="text"
                  name="subject"
                  placeholder={t.contact.placeholders[2]}
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="get-form-field">
                <label>{t.contact.message}</label>
                <textarea
                  name="message"
                  placeholder={t.contact.placeholders[3]}
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <button
                type="submit"
                className="get-btn get-btn--primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={submitState.status === 'sending'}
              >
                {submitLabel}
              </button>
              {submitState.message ? (
                <p className={`get-form-status get-form-status--${submitState.status}`}>{submitState.message}</p>
              ) : null}
            </form>
          </div>
        </div>
      </section>

      <footer className="get-footer">
        <div className="get-container">
          <div className="get-footer-inner">
            <div className="get-footer-brand">
              <Image src="/ge-energyTech/138568-transparent.png" alt="GE Energy Tech" width={48} height={48} />
              <h4>GE ENERGY TECH CO., LTD.</h4>
              <p>Energy startup delivering IoT devices, AI energy analytics, and green innovation to reduce global warming impact.</p>
            </div>
            <div className="get-footer-col">
              <h5>{t.footer.services}</h5>
              <ul>
                <li><a href="#services">Energy Monitoring</a></li>
                <li><a href="#services">Energy Management</a></li>
                <li><a href="#services">IoT Infrastructure</a></li>
                <li><a href="#services">Data Analytics</a></li>
              </ul>
            </div>
            <div className="get-footer-col">
              <h5>{t.footer.systems}</h5>
              <ul>
                <li><a href="#contact">Contact Team</a></li>
                <li><a href="#services">Energy Dashboard</a></li>
                <li>
                  <button type="button" className="get-footer-link" onClick={() => setLegalOpen('portals')}>
                    {t.footer.portals}
                  </button>
                </li>
                <li><a href="#hero">Home</a></li>
              </ul>
            </div>
          </div>
          <div className="get-footer-bottom">
            <p>© {new Date().getFullYear()} GE Energy Tech Co., Ltd. {t.footer.rights}</p>
            <div className="get-footer-bottom-links">
              <button type="button" className="get-footer-link" onClick={() => setLegalOpen('privacy')}>
                {t.footer.privacy}
              </button>
              <button type="button" className="get-footer-link" onClick={() => setLegalOpen('terms')}>
                {t.footer.terms}
              </button>
              <button type="button" className="get-footer-link" onClick={() => setLegalOpen('portals')}>
                {t.footer.portals}
              </button>
            </div>
          </div>
        </div>
      </footer>

      {legalOpen ? (
        <div className="get-legal-modal-overlay" role="presentation" onClick={() => setLegalOpen(null)}>
          <div className="get-legal-modal" role="dialog" aria-modal="true" aria-labelledby="get-legal-title" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="get-legal-modal-close" onClick={() => setLegalOpen(null)} aria-label="Close">
              ×
            </button>
            <h3 id="get-legal-title">{legalTitle}</h3>
            <div className="get-legal-body">
              {Array.isArray(legalBody) ? (
                <ul>
                  {legalBody.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p>{String(legalBody)}</p>
              )}
              {legalOpen === 'portals' ? (
                <div className="get-legal-portals">
                  <a href={publicHubHref('/register-geet')}>Register</a>
                  <a href={publicHubHref('/ge-energy-tech/login')}>Sign In</a>
                  <a href={publicHubHref('/ge-energy-erp-login')}>Admin</a>
                  <a href="/ge-energy-tech/shipping-tracking">Shipping Tracking</a>
                  <a href="/ge-energy-tech/after-sales-chat">After-Sales Chat</a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

