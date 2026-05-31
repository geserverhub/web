'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { publicHubHref } from '@/lib/data';
import { getNavExtraLabels } from '@/lib/ge-energy-tech/customer-tools-i18n';
import { SMART_METER_PRODUCT_ID } from '@/lib/meter-order';
import { getMeterOrderCopy } from '@/lib/ge-energy-tech-meter-order-i18n';
import MeterOrderModal from '@/components/ge-energy-tech/MeterOrderModal';

const LANGUAGE_STORAGE_KEY = 'ge-energy-tech-lang';

/** GE ENERGY TECH CO., LTD. — registered office (Ansan, Gyeonggi-do, Korea) */
const GEET_COMPANY_ADDRESS = {
  ko: '경기도 안산시 상록구 월피동 445-28 301호',
  en: 'Unit 301, 445-28 Wollipi-dong, Sangnok-gu, Ansan-si, Gyeonggi-do, Republic of Korea',
  th: 'ห้อง 301, 445-28 Wollipi-dong, Sangnok-gu, Ansan-si, Gyeonggi-do, สาธารณรัฐเกาหลี',
  zh: '韩国京畿道安山市常绿区月피洞445-28 301号',
  vi: 'Phòng 301, 445-28 Wollipi-dong, Sangnok-gu, Ansan-si, Gyeonggi-do, Hàn Quốc',
  ja: '韓国 京畿道 安山市 常緑区 月피洞 445-28 301号',
  'zh-tw': '韓國京畿道安山市常綠區月피洞445-28 301號',
  ms: 'Unit 301, 445-28 Wollipi-dong, Sangnok-gu, Ansan-si, Gyeonggi-do, Republik Korea',
};

function geetCompanyAddress(lang) {
  return GEET_COMPANY_ADDRESS[lang] || GEET_COMPANY_ADDRESS.en;
}

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
      technology: 'ความน่าเชื่อถือ',
      contact: 'ติดต่อ',
      admin: 'แอดมิน',
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
      badge: 'ความน่าเชื่อถือของบริษัท',
      title: ['ผลงานและ', 'การยอมรับ'],
      sub: 'สร้างความมั่นใจด้วยผลงานจริง หนังสือรับรอง ทรัพย์สินทางปัญญา และเส้นทางการเติบโตอย่างต่อเนื่องของ GE Energy Tech',
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
      systemsValue: 'แดชบอร์ดพลังงาน · แพลตฟอร์ม IoT',
      languages: 'ภาษา',
      languagesValue: 'ไทย · 中文 · Tiếng Việt · English · 한국어 · 日本語 · 繁體中文 · Bahasa Melayu',
      formTitle: 'ส่งข้อความถึงเรา',
      name: 'ชื่อ – Name',
      email: 'อีเมล – Email',
      subject: 'หัวข้อ – Subject',
      message: 'รายละเอียด – Message',
      submit: 'ส่งข้อความ →',
      placeholders: ['ชื่อของคุณ', 'email@company.com', 'สอบถามบริการ', 'รายละเอียดโครงการหรือคำถามของคุณ…'],
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
        'แอป Momoge space และ Customer Dashboard เก็บข้อมูลบัญชีและการใช้พลังงานเพื่อให้บริการมอนิเตอร์พลังงาน',
        'เราไม่ขายข้อมูลส่วนบุคคลให้บุคคลที่สาม',
        'อ่านฉบับเต็มที่หน้านโยบายความเป็นส่วนตัว (/privacy)',
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
      brandDesc:
        'สตาร์ทอัพด้านพลังงานที่พัฒนาอุปกรณ์ IoT ระบบวิเคราะห์พลังงานด้วย AI และนวัตกรรมสีเขียวเพื่อลดผลกระทบจากภาวะโลกร้อน',
      serviceLinks: ['มอนิเตอร์พลังงาน', 'บริหารพลังงาน', 'โครงสร้างพื้นฐาน IoT', 'วิเคราะห์ข้อมูล'],
      systemLinks: ['ติดต่อทีมงาน', 'แดชบอร์ดพลังงาน', 'พอร์ทัล', 'หน้าแรก'],
      portalLinks: {
        register: 'ลงทะเบียน',
        signIn: 'เข้าสู่ระบบ',
        admin: 'ผู้ดูแลระบบ',
        shipping: 'ติดตามการจัดส่ง',
        afterSales: 'บริการหลังการขาย',
      },
      close: 'ปิด',
    },
  },
  en: {
    nav: {
      about: 'About',
      services: 'Services',
      products: 'Our Products',
      technology: 'Credibility',
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
      badge: 'Company Credibility',
      title: ['Track Record', '& Recognition'],
      sub: 'Build trust through proven projects, certifications, intellectual property, and our continuous growth journey.',
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
      systemsValue: 'Energy Dashboard · IoT Platform',
      languages: 'Languages',
      languagesValue: 'ไทย · 中文 · Tiếng Việt · English · 한국어 · 日本語 · 繁體中文 · Bahasa Melayu',
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
        'The Momoge space app and Customer Dashboard process account and energy usage data to deliver monitoring services.',
        'We do not sell personal data to third parties.',
        'Read the full policy at /privacy.',
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
      brandDesc:
        'Energy startup delivering IoT devices, AI energy analytics, and green innovation to reduce global warming impact.',
      serviceLinks: ['Energy Monitoring', 'Energy Management', 'IoT Infrastructure', 'Data Analytics'],
      systemLinks: ['Contact Team', 'Energy Dashboard', 'Portals', 'Home'],
      portalLinks: {
        register: 'Register',
        signIn: 'Sign In',
        admin: 'Admin',
        shipping: 'Shipping Tracking',
        afterSales: 'After-Sales Chat',
      },
      close: 'Close',
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
    nav: { about: '关于我们', services: '服务', products: '我们的产品', technology: '企业信誉', contact: '联系', admin: '管理员', register: '注册使用平台', signIn: '登录平台' },
    hero: { tag: '智慧能源 · IoT · 绿色创新', title1: '智慧能源', title2: '迈向', title3: '可持续未来', sub: 'GE Energy Tech 是一家能源科技创业公司，开发 IoT 设备并提供 AI 驱动的能源监测与分析平台。', cta1: '查看服务', cta2: '联系我们', stats: ['监控设备', '企业客户', '可用性保障', '服务国家'] },
    about: {
      badge: '关于公司',
      title: 'GE Energy Tech Co., Ltd.',
      p1: '我们专注于新一代能源技术，打造用于工业与商业场景的 IoT 硬件和实时能源监测数字平台。',
      p2: '我们提供设备销售与完整服务，并结合 AI 能源分析以降低能耗与碳排放，加速绿色转型。',
      pillars: [
        { icon: '🎯', title: '精密工程', desc: '强调可靠性、稳定性与长期运行。' },
        { icon: '🤝', title: '可信合作', desc: '从规划到部署与支持全程协作。' },
        { icon: '🌏', title: '区域化规模', desc: '适配亚洲多国家与多语言运营。' },
        { icon: '🔬', title: '研发驱动', desc: '持续推进 IoT、AI 与能源技术创新。' },
      ],
    },
    services: { badge: '我们的服务', title: ['一体化解决方案', '适用于各类企业'], sub: '从物联网设备研发部署到AI能源监测与分析平台的全流程服务。' },
    products: { badge: '我们的产品', title: ['创新', '能源产品'], sub: '由GE Energy Tech工程师设计制造的设备与系统，提供最佳能源效率。', inquiry: '产品咨询' },
    pq: {
      badge: '电能质量创新',
      titleBefore: '打造',
      titleEm: '智能电能质量',
      titleAfter: '设备',
      sub: '围绕稳压、稳频、THD 校正与企业 EMS 持续创新，提升稳定性与效率。',
      items: [
        { icon: '🔋', title: '智能稳压器', desc: '在负载波动场景下自动稳压，保护设备免受过压/欠压影响。', tags: [{ en: 'Voltage Regulator', zh: '稳压器' }, { en: 'AVR', zh: 'AVR' }, { en: 'Stabilization', zh: '稳定控制' }], color: '#f59e0b' },
        { icon: '〰️', title: '频率控制系统', desc: '保持电力频率（Hz）稳定，保障电机与敏感设备可靠运行。', tags: [{ en: 'Frequency', zh: '频率' }, { en: 'Hz Stability', zh: 'Hz 稳定性' }, { en: 'Motor Control', zh: '电机控制' }], color: '#0ea5e9' },
        { icon: '📉', title: '谐波（THD）校正', desc: '通过有源/无源滤波降低 THD，减少损耗与过热，保护电力系统。', tags: [{ en: 'THD', zh: 'THD' }, { en: 'Harmonic Filter', zh: '谐波滤波' }, { en: 'Power Quality', zh: '电能质量' }], color: '#e53935' },
        { icon: '📊', title: '能源管理系统（EMS）', desc: '通过实时仪表板与 AI 洞察，实现企业用能分析、监测与管理。', tags: [{ en: 'EMS', zh: 'EMS' }, { en: 'Energy Management', zh: '能源管理' }, { en: 'AI Dashboard', zh: 'AI 仪表板' }], color: '#7c3aed' },
      ],
    },
    tech: { badge: '企业信誉', title: ['成果与', '权威认可'], sub: '以实际项目、认证证书、知识产权和持续增长建立客户信任。' },
    contact: {
      badge: '联系',
      title: ['准备开始', '您的项目？'],
      head: '欢迎咨询',
      sub: '我们的团队可提供免费咨询、方案设计与预算评估。',
      company: '公司',
      address: '地址',
      addressValue: '大韩民国',
      systems: '系统',
      systemsValue: '能源看板 · IoT 平台',
      languages: '语言',
      languagesValue: 'ไทย · 中文 · Tiếng Việt · English · 한국어 · 日本語 · 繁體中文 · Bahasa Melayu',
      formTitle: '给我们留言',
      name: '姓名',
      email: '邮箱',
      subject: '主题',
      message: '内容',
      placeholders: ['您的姓名', 'email@company.com', '服务咨询', '请告诉我们您的项目需求...'],
      submit: '发送消息 →',
      sending: '发送中...',
      success: '消息已发送，我们将通过邮件回复。',
      error: '发送失败，请重试。',
    },
    footer: {
      services: '服务',
      systems: '系统',
      rights: '版权所有。',
      privacy: '隐私',
      terms: '条款',
      portals: '门户',
      privacyTitle: '隐私政策',
      privacyBody: [
        '我们高度重视您的隐私。',
        '您提交的信息（邮箱/姓名/消息/附件）仅用于联系与服务提供。',
        '我们不会向第三方出售个人数据。',
      ],
      termsTitle: '条款与条件',
      termsBody: [
        '使用本网站即表示您同意相关条款。',
        '价格与规格可能根据现场评估和技术要求调整。',
        '订单将在我们核验资料与付款凭证后确认。',
      ],
      portalsTitle: '门户',
      portalsBody: [
        '客户门户：注册/登录后可进入 Customer Dashboard。',
        '物流追踪：可用邮箱或订单编号查询状态。',
        '售后支持：可与客服实时聊天获取协助。',
      ],
      brandDesc: '专注物联网设备、AI 能源分析与绿色创新的能源科技公司。',
      serviceLinks: ['能源监控', '能源管理', 'IoT 基础设施', '数据分析'],
      systemLinks: ['联系团队', '能源看板', '门户', '首页'],
      portalLinks: { register: '注册', signIn: '登录', admin: '管理', shipping: '物流追踪', afterSales: '售后聊天' },
      close: '关闭',
    },
  },
  vi: {
    nav: { about: 'Giới thiệu', services: 'Dịch vụ', products: 'Sản phẩm', technology: 'Uy tín', contact: 'Liên hệ', admin: 'Quản trị', register: 'Đăng ký nền tảng', signIn: 'Đăng nhập nền tảng' },
    hero: { tag: 'Năng lượng thông minh · IoT · Đổi mới xanh', title1: 'Năng lượng thông minh', title2: 'cho một', title3: 'tương lai bền vững', sub: 'GE Energy Tech là startup công nghệ năng lượng phát triển thiết bị IoT và nền tảng giám sát năng lượng dùng AI cho doanh nghiệp hiện đại.', cta1: 'Xem dịch vụ', cta2: 'Liên hệ', stats: ['Thiết bị giám sát', 'Khách hàng doanh nghiệp', 'Cam kết uptime', 'Quốc gia phục vụ'] },
    about: {
      badge: 'Về công ty',
      title: 'GE Energy Tech Co., Ltd.',
      p1: 'Chúng tôi tập trung vào công nghệ năng lượng thế hệ mới, xây dựng phần cứng IoT và nền tảng số giám sát năng lượng thời gian thực.',
      p2: 'Chúng tôi cung cấp thiết bị kèm dịch vụ trọn gói và phân tích năng lượng bằng AI để giảm lãng phí, giảm phát thải và thúc đẩy chuyển đổi xanh.',
      pillars: [
        { icon: '🎯', title: 'Kỹ thuật chính xác', desc: 'Thiết kế ưu tiên độ tin cậy, ổn định và vận hành lâu dài.' },
        { icon: '🤝', title: 'Đối tác tin cậy', desc: 'Đồng hành từ lập kế hoạch đến triển khai và hỗ trợ.' },
        { icon: '🌏', title: 'Quy mô khu vực', desc: 'Phù hợp vận hành đa quốc gia và đa ngôn ngữ tại châu Á.' },
        { icon: '🔬', title: 'Dẫn dắt bởi R&D', desc: 'Đổi mới liên tục trong IoT, AI và công nghệ năng lượng.' },
      ],
    },
    services: { badge: 'Dịch vụ của chúng tôi', title: ['Giải pháp tích hợp', 'cho mọi doanh nghiệp'], sub: 'Dịch vụ trọn gói từ phát triển thiết bị IoT đến nền tảng giám sát và phân tích năng lượng bằng AI.' },
    products: { badge: 'Sản phẩm', title: ['Đổi mới', 'Sản phẩm năng lượng'], sub: 'Thiết bị và hệ thống do kỹ sư GE Energy Tech thiết kế để tối ưu hiệu quả năng lượng.', inquiry: 'Hỏi về sản phẩm' },
    pq: {
      badge: 'Đổi mới chất lượng điện',
      titleBefore: 'Phát triển',
      titleEm: 'thiết bị chất lượng điện',
      titleAfter: 'thông minh',
      sub: 'Đổi mới về ổn áp, điều khiển tần số, hiệu chỉnh THD và EMS doanh nghiệp để tối ưu độ ổn định và hiệu suất.',
      items: [
        { icon: '🔋', title: 'Bộ ổn áp thông minh', desc: 'Ổn định điện áp tự động khi tải dao động, bảo vệ thiết bị khỏi quá áp/thấp áp.', tags: [{ en: 'Voltage Regulator', vi: 'Ổn áp' }, { en: 'AVR', vi: 'AVR' }, { en: 'Stabilization', vi: 'Ổn định' }], color: '#f59e0b' },
        { icon: '〰️', title: 'Hệ thống điều khiển tần số', desc: 'Duy trì tần số điện (Hz) ổn định để động cơ và thiết bị nhạy cảm vận hành tin cậy.', tags: [{ en: 'Frequency', vi: 'Tần số' }, { en: 'Hz Stability', vi: 'Ổn định Hz' }, { en: 'Motor Control', vi: 'Điều khiển động cơ' }], color: '#0ea5e9' },
        { icon: '📉', title: 'Hiệu chỉnh méo hài (THD)', desc: 'Lọc hài chủ động/thụ động giúp giảm THD, giảm tổn thất và bảo vệ hạ tầng điện.', tags: [{ en: 'THD', vi: 'THD' }, { en: 'Harmonic Filter', vi: 'Lọc sóng hài' }, { en: 'Power Quality', vi: 'Chất lượng điện' }], color: '#e53935' },
        { icon: '📊', title: 'Hệ thống quản lý năng lượng (EMS)', desc: 'Nền tảng số phân tích, giám sát và quản trị năng lượng doanh nghiệp bằng dashboard thời gian thực và AI.', tags: [{ en: 'EMS', vi: 'EMS' }, { en: 'Energy Management', vi: 'Quản lý năng lượng' }, { en: 'AI Dashboard', vi: 'Bảng điều khiển AI' }], color: '#7c3aed' },
      ],
    },
    tech: { badge: 'Uy tín doanh nghiệp', title: ['Thành tựu', '& công nhận'], sub: 'Tạo niềm tin qua dự án thực tế, chứng chỉ, quyền sở hữu trí tuệ và tăng trưởng bền vững.' },
    contact: {
      badge: 'Liên hệ',
      title: ['Sẵn sàng bắt đầu', 'dự án của bạn?'],
      head: 'Hãy trao đổi với chúng tôi',
      sub: 'Đội ngũ sẵn sàng tư vấn, thiết kế và báo giá miễn phí.',
      company: 'Công ty',
      address: 'Địa chỉ',
      addressValue: 'Hàn Quốc',
      systems: 'Hệ thống',
      systemsValue: 'Bảng điều khiển năng lượng · Nền tảng IoT',
      languages: 'Ngôn ngữ',
      languagesValue: 'ไทย · 中文 · Tiếng Việt · English · 한국어 · 日本語 · 繁體中文 · Bahasa Melayu',
      formTitle: 'Gửi tin nhắn cho chúng tôi',
      name: 'Họ tên',
      email: 'Email',
      subject: 'Chủ đề',
      message: 'Nội dung',
      placeholders: ['Tên của bạn', 'email@company.com', 'Yêu cầu dịch vụ', 'Hãy cho chúng tôi biết về dự án của bạn...'],
      submit: 'Gửi tin nhắn →',
      sending: 'Đang gửi...',
      success: 'Đã gửi tin nhắn. Chúng tôi sẽ phản hồi qua email.',
      error: 'Gửi thất bại. Vui lòng thử lại.',
    },
    footer: {
      services: 'Dịch vụ',
      systems: 'Hệ thống',
      rights: 'Mọi quyền được bảo lưu.',
      privacy: 'Quyền riêng tư',
      terms: 'Điều khoản',
      portals: 'Cổng hệ thống',
      privacyTitle: 'Chính sách bảo mật',
      privacyBody: [
        'Chúng tôi coi trọng quyền riêng tư của bạn.',
        'Thông tin bạn gửi (email/tên/nội dung/tệp đính kèm) chỉ dùng để phản hồi và cung cấp dịch vụ.',
        'Chúng tôi không bán dữ liệu cá nhân cho bên thứ ba.',
      ],
      termsTitle: 'Điều khoản & Điều kiện',
      termsBody: [
        'Việc sử dụng website đồng nghĩa bạn đồng ý với các điều khoản này.',
        'Giá và thông số có thể thay đổi theo khảo sát thực tế và yêu cầu kỹ thuật.',
        'Đơn hàng được xác nhận sau khi đội ngũ kiểm tra thông tin và chứng từ thanh toán.',
      ],
      portalsTitle: 'Cổng hệ thống',
      portalsBody: [
        'Cổng khách hàng: đăng ký/đăng nhập để vào Customer Dashboard.',
        'Theo dõi vận chuyển: kiểm tra bằng email hoặc mã đơn hàng.',
        'Hỗ trợ sau bán hàng: trò chuyện trực tiếp với nhân viên hỗ trợ.',
      ],
      brandDesc: 'Startup năng lượng cung cấp thiết bị IoT, phân tích năng lượng AI và đổi mới xanh.',
      serviceLinks: ['Giám sát năng lượng', 'Quản lý năng lượng', 'Hạ tầng IoT', 'Phân tích dữ liệu'],
      systemLinks: ['Liên hệ đội ngũ', 'Bảng điều khiển năng lượng', 'Cổng hệ thống', 'Trang chủ'],
      portalLinks: { register: 'Đăng ký', signIn: 'Đăng nhập', admin: 'Quản trị', shipping: 'Theo dõi giao hàng', afterSales: 'Chat hậu mãi' },
      close: 'Đóng',
    },
  },
  ko: {
    nav: { about: '회사 소개', services: '서비스', products: '제품 소개', technology: '신뢰도', contact: '문의', admin: '관리자', register: '플랫폼 등록', signIn: '플랫폼 로그인' },
    hero: { tag: '스마트 에너지 · IoT · 그린 혁신', title1: '스마트 에너지', title2: '지속가능한', title3: '미래를 위해', sub: 'GE Energy Tech는 IoT 장치와 AI 기반 에너지 분석 플랫폼을 개발하는 에너지 기술 스타트업입니다.', cta1: '서비스 보기', cta2: '문의하기', stats: ['모니터링 장치', '기업 고객', '가동률 보장', '서비스 국가'] },
    about: {
      badge: '회사 소개',
      title: 'GE Energy Tech Co., Ltd.',
      p1: '차세대 에너지 기술에 집중하여 산업·상업 현장을 위한 IoT 하드웨어와 실시간 에너지 모니터링 플랫폼을 구축합니다.',
      p2: '장비 판매와 통합 서비스를 제공하며, AI 기반 분석으로 에너지 낭비와 탄소 배출을 줄이고 그린 전환을 가속합니다.',
      pillars: [
        { icon: '🎯', title: '정밀 엔지니어링', desc: '신뢰성·안정성·장기 운영 성능을 중심으로 설계합니다.' },
        { icon: '🤝', title: '신뢰 파트너십', desc: '기획부터 구축, 운영 지원까지 함께합니다.' },
        { icon: '🌏', title: '지역 확장성', desc: '아시아 다국가·다국어 운영에 최적화되어 있습니다.' },
        { icon: '🔬', title: 'R&D 중심', desc: 'IoT, AI, 에너지 기술 혁신을 지속합니다.' },
      ],
    },
    pq: {
      badge: '전력 품질 혁신',
      titleBefore: '스마트',
      titleEm: '전력 품질',
      titleAfter: '장치 개발',
      sub: '전압 안정화, 주파수 제어, THD 보정, EMS 혁신으로 높은 안정성과 효율을 제공합니다.',
      items: [
        { icon: '🔋', title: '스마트 전압 조정기', desc: '부하 변동 환경에서 전압을 자동 안정화하여 과전압/저전압으로부터 장비를 보호합니다.', tags: [{ en: 'Voltage Regulator', ko: '전압 조정기' }, { en: 'AVR', ko: 'AVR' }, { en: 'Stabilization', ko: '안정화' }], color: '#f59e0b' },
        { icon: '〰️', title: '주파수 제어 시스템', desc: '전기 주파수(Hz)를 안정적으로 유지하여 모터와 민감 장비의 신뢰 운전을 보장합니다.', tags: [{ en: 'Frequency', ko: '주파수' }, { en: 'Hz Stability', ko: 'Hz 안정성' }, { en: 'Motor Control', ko: '모터 제어' }], color: '#0ea5e9' },
        { icon: '📉', title: '고조파(THD) 보정', desc: '능동/수동 고조파 필터링으로 THD를 줄이고 손실·과열을 낮춰 전기 인프라를 보호합니다.', tags: [{ en: 'THD', ko: 'THD' }, { en: 'Harmonic Filter', ko: '고조파 필터' }, { en: 'Power Quality', ko: '전력 품질' }], color: '#e53935' },
        { icon: '📊', title: '에너지 관리 시스템(EMS)', desc: '실시간 대시보드와 AI 인사이트를 통해 기업 에너지 사용을 분석·모니터링·관리하는 통합 플랫폼입니다.', tags: [{ en: 'EMS', ko: 'EMS' }, { en: 'Energy Management', ko: '에너지 관리' }, { en: 'AI Dashboard', ko: 'AI 대시보드' }], color: '#7c3aed' },
      ],
    },
    services: { badge: '서비스', title: ['통합 솔루션', '모든 비즈니스를 위해'], sub: 'IoT 장치 개발·배포부터 AI 에너지 모니터링·분석 플랫폼까지 엔드투엔드 서비스를 제공합니다.' },
    products: { badge: '제품 소개', title: ['혁신', '에너지 제품'], sub: 'GE Energy Tech 엔지니어가 설계한 최고 효율의 에너지 장치 및 시스템.', inquiry: '제품 문의' },
    tech: { badge: '기업 신뢰도', title: ['성과와', '인정'], sub: '실제 프로젝트, 인증, 지적재산권, 지속 성장으로 신뢰를 구축합니다.' },
    contact: {
      badge: '문의',
      title: ['프로젝트를', '시작할 준비가 되셨나요?'],
      head: '지금 상담해 보세요',
      sub: '무료 상담, 솔루션 설계, 예산 견적을 제공합니다.',
      company: '회사',
      address: '주소',
      addressValue: '대한민국',
      systems: '시스템',
      systemsValue: '에너지 대시보드 · IoT 플랫폼',
      languages: '언어',
      languagesValue: 'ไทย · 中文 · Tiếng Việt · English · 한국어 · 日本語 · 繁體中文 · Bahasa Melayu',
      formTitle: '메시지 보내기',
      name: '이름',
      email: '이메일',
      subject: '제목',
      message: '내용',
      placeholders: ['이름을 입력하세요', 'email@company.com', '서비스 문의', '프로젝트 내용을 알려주세요...'],
      submit: '메시지 보내기 →',
      sending: '전송 중...',
      success: '메시지가 전송되었습니다. 이메일로 답변드리겠습니다.',
      error: '전송에 실패했습니다. 다시 시도해 주세요.',
    },
    footer: {
      services: '서비스',
      systems: '시스템',
      rights: '모든 권리 보유.',
      privacy: '개인정보',
      terms: '이용약관',
      portals: '포털',
      privacyTitle: '개인정보 처리방침',
      privacyBody: [
        '당사는 귀하의 개인정보를 중요하게 생각합니다.',
        '양식으로 제출한 정보(이메일/이름/메시지/첨부파일)는 응답 및 서비스 제공 목적으로만 사용됩니다.',
        '개인정보를 제3자에게 판매하지 않습니다.',
      ],
      termsTitle: '이용약관',
      termsBody: [
        '본 웹사이트를 이용하면 약관에 동의한 것으로 간주됩니다.',
        '가격/사양은 현장 평가 및 기술 요건에 따라 변경될 수 있습니다.',
        '주문은 당사 팀이 정보와 입금증을 확인한 후 확정됩니다.',
      ],
      portalsTitle: '포털',
      portalsBody: [
        '고객 포털: 등록/로그인 후 Customer Dashboard를 이용할 수 있습니다.',
        '배송 조회: 이메일 또는 주문번호로 진행 상태를 확인할 수 있습니다.',
        '애프터서비스: 담당자와 채팅으로 지원을 받을 수 있습니다.',
      ],
      brandDesc: 'IoT 장치, AI 에너지 분석, 그린 혁신을 제공하는 에너지 스타트업.',
      serviceLinks: ['에너지 모니터링', '에너지 관리', 'IoT 인프라', '데이터 분석'],
      systemLinks: ['팀 문의', '에너지 대시보드', '포털', '홈'],
      portalLinks: { register: '가입', signIn: '로그인', admin: '관리자', shipping: '배송 조회', afterSales: 'AS 채팅' },
      close: '닫기',
    },
  },
  ja: {
    nav: { about: '会社情報', services: 'サービス', products: '製品紹介', technology: '信頼性', contact: 'お問い合わせ', admin: '管理者', register: 'プラットフォーム登録', signIn: 'プラットフォームログイン' },
    hero: { tag: 'スマートエネルギー · IoT · グリーン革新', title1: 'スマートエネルギー', title2: '持続可能な', title3: '未来へ', sub: 'GE Energy Tech は IoT 機器と AI エネルギー分析基盤を提供するエネルギーテック・スタートアップです。', cta1: 'サービスを見る', cta2: 'お問い合わせ', stats: ['監視デバイス', '法人顧客', '稼働率保証', '提供国'] },
    about: {
      badge: '会社概要',
      title: 'GE Energy Tech Co., Ltd.',
      p1: '次世代エネルギー技術に注力し、産業・商業向けの IoT ハードウェアとリアルタイム監視プラットフォームを構築します。',
      p2: '機器販売とフルサービスに加え、AI分析で省エネ・排出削減・グリーン導入を推進します。',
      pillars: [
        { icon: '🎯', title: '高精度エンジニアリング', desc: '信頼性・安定性・長期運用を重視した設計。' },
        { icon: '🤝', title: '信頼できるパートナー', desc: '企画から導入、運用支援まで伴走します。' },
        { icon: '🌏', title: '地域スケール', desc: 'アジアでの多国・多言語運用に対応。' },
        { icon: '🔬', title: 'R&D主導', desc: 'IoT・AI・エネルギー技術の継続的な革新。' },
      ],
    },
    pq: {
      badge: '電力品質イノベーション',
      titleBefore: '高度な',
      titleEm: '電力品質デバイス',
      titleAfter: 'を開発',
      sub: '電圧制御・周波数制御・THD補正・EMSの革新で安定性と効率を高めます。',
      items: [
        { icon: '🔋', title: 'スマート電圧レギュレータ', desc: '負荷変動時にも自動で電圧を安定化し、過電圧/低電圧から機器を保護します。', tags: [{ en: 'Voltage Regulator', ja: '電圧レギュレータ' }, { en: 'AVR', ja: 'AVR' }, { en: 'Stabilization', ja: '安定化' }], color: '#f59e0b' },
        { icon: '〰️', title: '周波数制御システム', desc: '電力周波数（Hz）を安定維持し、モータや精密機器の信頼運転を実現します。', tags: [{ en: 'Frequency', ja: '周波数' }, { en: 'Hz Stability', ja: 'Hz安定性' }, { en: 'Motor Control', ja: 'モータ制御' }], color: '#0ea5e9' },
        { icon: '📉', title: '高調波（THD）補正', desc: 'アクティブ/パッシブフィルタでTHDを低減し、損失と過熱を抑えて設備を保護します。', tags: [{ en: 'THD', ja: 'THD' }, { en: 'Harmonic Filter', ja: '高調波フィルタ' }, { en: 'Power Quality', ja: '電力品質' }], color: '#e53935' },
        { icon: '📊', title: 'エネルギー管理システム（EMS）', desc: 'リアルタイムダッシュボードとAIインサイトで企業のエネルギーを分析・監視・管理します。', tags: [{ en: 'EMS', ja: 'EMS' }, { en: 'Energy Management', ja: 'エネルギー管理' }, { en: 'AI Dashboard', ja: 'AIダッシュボード' }], color: '#7c3aed' },
      ],
    },
    services: { badge: 'サービス', title: ['統合ソリューション', 'あらゆる企業向け'], sub: 'IoT機器の開発・導入からAIエネルギー監視・分析プラットフォームまで一貫して提供します。' },
    products: { badge: '製品紹介', title: ['革新的な', 'エネルギー製品'], sub: 'GE Energy Techエンジニアが設計した高効率エネルギー機器・システム。', inquiry: '製品について問い合わせ' },
    tech: { badge: '企業の信頼性', title: ['実績と', '評価'], sub: '実プロジェクト、認証、知的財産、成長の歩みで信頼を築きます。' },
    contact: {
      badge: 'お問い合わせ',
      title: ['プロジェクトを', '始めませんか？'],
      head: 'まずはご相談ください',
      sub: '無料相談・ソリューション設計・見積もりに対応します。',
      company: '会社名',
      address: '所在地',
      addressValue: '大韓民国',
      systems: 'システム',
      systemsValue: 'エネルギーダッシュボード · IoTプラットフォーム',
      languages: '言語',
      languagesValue: 'ไทย · 中文 · Tiếng Việt · English · 한국어 · 日本語 · 繁體中文 · Bahasa Melayu',
      formTitle: 'メッセージを送る',
      name: 'お名前',
      email: 'メール',
      subject: '件名',
      message: '内容',
      placeholders: ['お名前', 'email@company.com', 'サービスに関するお問い合わせ', 'プロジェクト内容をご記入ください...'],
      submit: '送信する →',
      sending: '送信中...',
      success: 'メッセージを送信しました。メールでご連絡します。',
      error: '送信に失敗しました。もう一度お試しください。',
    },
    footer: {
      services: 'サービス',
      systems: 'システム',
      rights: '無断転載禁止。',
      privacy: 'プライバシー',
      terms: '利用規約',
      portals: 'ポータル',
      privacyTitle: 'プライバシーポリシー',
      privacyBody: [
        '当社はお客様のプライバシーを重視します。',
        'フォーム送信情報（メール/氏名/メッセージ/添付）は対応とサービス提供のためにのみ使用します。',
        '個人情報を第三者に販売することはありません。',
      ],
      termsTitle: '利用規約',
      termsBody: [
        '本サイトの利用により、規約に同意したものとみなされます。',
        '価格・仕様は現地調査および技術要件により変更される場合があります。',
        '注文は当社が情報と入金証憑を確認後に確定します。',
      ],
      portalsTitle: 'ポータル',
      portalsBody: [
        '顧客ポータル：登録/ログイン後にCustomer Dashboardへアクセスできます。',
        '配送追跡：メールまたは注文番号で状況を確認できます。',
        'アフターサポート：担当者とチャットでサポートを受けられます。',
      ],
      brandDesc: 'IoT機器、AIエネルギー分析、グリーンイノベーションを提供するエネルギースタートアップ。',
      serviceLinks: ['エネルギー監視', 'エネルギー管理', 'IoT基盤', 'データ分析'],
      systemLinks: ['チーム連絡', 'エネルギーダッシュボード', 'ポータル', 'ホーム'],
      portalLinks: { register: '登録', signIn: 'ログイン', admin: '管理', shipping: '配送追跡', afterSales: 'アフターサービスチャット' },
      close: '閉じる',
    },
  },
  'zh-tw': {
    nav: { about: '關於我們', services: '服務', products: '我們的產品', technology: '企業信譽', contact: '聯絡', admin: '管理者', register: '註冊使用平台', signIn: '登入平台' },
    hero: { tag: '智慧能源 · IoT · 綠色創新', title1: '智慧能源', title2: '邁向', title3: '永續未來', sub: 'GE Energy Tech 是一家能源科技新創，開發 IoT 設備並提供 AI 驅動的能源監測分析平台。', cta1: '查看服務', cta2: '聯絡我們', stats: ['監控設備', '企業客戶', '可用性保證', '服務國家'] },
    about: {
      badge: '關於公司',
      title: 'GE Energy Tech Co., Ltd.',
      p1: '我們專注新世代能源科技，打造工業與商業場域的 IoT 硬體與即時能源監測數位平台。',
      p2: '提供設備銷售與完整服務，結合 AI 分析以降低能耗與碳排，推動綠色轉型。',
      pillars: [
        { icon: '🎯', title: '精密工程', desc: '以可靠、穩定與長期運行為核心。' },
        { icon: '🤝', title: '可信夥伴', desc: '從規劃到部署與支援全程協作。' },
        { icon: '🌏', title: '區域規模', desc: '支援亞洲多國與多語言營運。' },
        { icon: '🔬', title: '研發驅動', desc: '持續推進 IoT、AI 與能源創新。' },
      ],
    },
    pq: {
      badge: '電力品質創新',
      titleBefore: '打造',
      titleEm: '智慧電力品質',
      titleAfter: '設備',
      sub: '在穩壓、穩頻、THD 校正與企業 EMS 領域持續創新，提升穩定性與效率。',
      items: [
        { icon: '🔋', title: '智慧穩壓器', desc: '在負載波動下自動穩壓，保護設備免受過壓與欠壓影響。', tags: [{ en: 'Voltage Regulator', 'zh-tw': '穩壓器' }, { en: 'AVR', 'zh-tw': 'AVR' }, { en: 'Stabilization', 'zh-tw': '穩定控制' }], color: '#f59e0b' },
        { icon: '〰️', title: '頻率控制系統', desc: '維持電力頻率（Hz）穩定，確保馬達與精密設備可靠運行。', tags: [{ en: 'Frequency', 'zh-tw': '頻率' }, { en: 'Hz Stability', 'zh-tw': 'Hz 穩定性' }, { en: 'Motor Control', 'zh-tw': '馬達控制' }], color: '#0ea5e9' },
        { icon: '📉', title: '諧波（THD）校正', desc: '透過主動/被動濾波降低 THD、減少損耗與過熱，保護電力基礎設施。', tags: [{ en: 'THD', 'zh-tw': 'THD' }, { en: 'Harmonic Filter', 'zh-tw': '諧波濾波' }, { en: 'Power Quality', 'zh-tw': '電力品質' }], color: '#e53935' },
        { icon: '📊', title: '能源管理系統（EMS）', desc: '以即時儀表板與 AI 洞察，整合企業能源分析、監測與管理。', tags: [{ en: 'EMS', 'zh-tw': 'EMS' }, { en: 'Energy Management', 'zh-tw': '能源管理' }, { en: 'AI Dashboard', 'zh-tw': 'AI 儀表板' }], color: '#7c3aed' },
      ],
    },
    services: { badge: '我們的服務', title: ['整合解決方案', '適用各類企業'], sub: '從物聯網設備研發部署到 AI 能源監測與分析平台的全流程服務。' },
    products: { badge: '我們的產品', title: ['創新', '能源產品'], sub: '由GE Energy Tech工程師設計製造的設備與系統，提供最佳能源效率。', inquiry: '產品詢問' },
    tech: { badge: '企業信譽', title: ['成果與', '權威認可'], sub: '以實際專案、認證、智慧財產權與持續成長建立客戶信任。' },
    contact: {
      badge: '聯絡',
      title: ['準備開始', '您的專案？'],
      head: '歡迎與我們洽談',
      sub: '團隊可提供免費諮詢、方案設計與預算評估。',
      company: '公司',
      address: '地址',
      addressValue: '大韓民國',
      systems: '系統',
      systemsValue: '能源儀表板 · IoT 平台',
      languages: '語言',
      languagesValue: 'ไทย · 中文 · Tiếng Việt · English · 한국어 · 日本語 · 繁體中文 · Bahasa Melayu',
      formTitle: '傳送訊息給我們',
      name: '姓名',
      email: '電子郵件',
      subject: '主旨',
      message: '內容',
      placeholders: ['您的姓名', 'email@company.com', '服務諮詢', '請告訴我們您的專案需求...'],
      submit: '送出訊息 →',
      sending: '傳送中...',
      success: '訊息已送出，我們將以電子郵件回覆。',
      error: '傳送失敗，請再試一次。',
    },
    footer: {
      services: '服務',
      systems: '系統',
      rights: '版權所有。',
      privacy: '隱私',
      terms: '條款',
      portals: '入口',
      privacyTitle: '隱私權政策',
      privacyBody: [
        '我們重視您的隱私。',
        '您提交的資訊（電子郵件/姓名/訊息/附件）僅用於回覆與提供服務。',
        '我們不會將個人資料出售給第三方。',
      ],
      termsTitle: '條款與條件',
      termsBody: [
        '使用本網站即表示您同意相關條款。',
        '價格與規格可能依現場評估與技術需求而調整。',
        '訂單將於團隊確認資料與付款憑證後成立。',
      ],
      portalsTitle: '入口',
      portalsBody: [
        '客戶入口：註冊/登入後可進入 Customer Dashboard。',
        '物流追蹤：可使用電子郵件或訂單編號查詢狀態。',
        '售後支援：可與客服即時聊天取得協助。',
      ],
      brandDesc: '提供 IoT 設備、AI 能源分析與綠色創新的能源科技新創。',
      serviceLinks: ['能源監控', '能源管理', 'IoT 基礎設施', '資料分析'],
      systemLinks: ['聯絡團隊', '能源儀表板', '入口', '首頁'],
      portalLinks: { register: '註冊', signIn: '登入', admin: '管理', shipping: '物流追蹤', afterSales: '售後聊天' },
      close: '關閉',
    },
  },
  ms: {
    nav: { about: 'Tentang', services: 'Perkhidmatan', products: 'Produk Kami', technology: 'Kredibiliti', contact: 'Hubungi', admin: 'Pentadbir', register: 'Daftar Platform', signIn: 'Log Masuk Platform' },
    hero: { tag: 'Tenaga Pintar · IoT · Inovasi Hijau', title1: 'Tenaga Pintar', title2: 'untuk masa depan', title3: 'yang mampan', sub: 'GE Energy Tech ialah startup teknologi tenaga yang membangunkan peranti IoT dan platform pemantauan dengan analitik tenaga berkuasa AI.', cta1: 'Lihat Perkhidmatan', cta2: 'Hubungi Kami', stats: ['Peranti Dipantau', 'Pelanggan Korporat', 'Jaminan Uptime', 'Negara Dilayan'] },
    about: {
      badge: 'Tentang Syarikat',
      title: 'GE Energy Tech Co., Ltd.',
      p1: 'Kami fokus pada teknologi tenaga generasi baharu, membina perkakasan IoT dan platform digital pemantauan tenaga masa nyata.',
      p2: 'Kami menyediakan jualan peranti dengan perkhidmatan lengkap serta analitik AI untuk mengurangkan pembaziran tenaga dan pelepasan karbon.',
      pillars: [
        { icon: '🎯', title: 'Kejuruteraan Tepat', desc: 'Direka untuk kebolehpercayaan, kestabilan dan prestasi jangka panjang.' },
        { icon: '🤝', title: 'Rakan Dipercayai', desc: 'Kerjasama dari perancangan hingga pelaksanaan dan sokongan.' },
        { icon: '🌏', title: 'Skala Serantau', desc: 'Sesuai untuk operasi berbilang negara dan bahasa di Asia.' },
        { icon: '🔬', title: 'Didorong R&D', desc: 'Inovasi berterusan dalam IoT, AI dan teknologi tenaga.' },
      ],
    },
    pq: {
      badge: 'Inovasi Kualiti Kuasa',
      titleBefore: 'Membangunkan',
      titleEm: 'Peranti Kualiti Kuasa Pintar',
      titleAfter: '',
      sub: 'Inovasi dalam penstabilan voltan, kawalan frekuensi, pembetulan THD dan EMS perusahaan untuk kestabilan serta kecekapan maksimum.',
      items: [
        { icon: '🔋', title: 'Pengawal Voltan Pintar', desc: 'Penstabilan voltan automatik untuk beban berubah-ubah, melindungi peralatan daripada over/under-voltage.', tags: [{ en: 'Voltage Regulator', ms: 'Pengawal Voltan' }, { en: 'AVR', ms: 'AVR' }, { en: 'Stabilization', ms: 'Penstabilan' }], color: '#f59e0b' },
        { icon: '〰️', title: 'Sistem Kawalan Frekuensi', desc: 'Mengekalkan frekuensi elektrik (Hz) yang stabil untuk operasi motor dan peralatan sensitif yang boleh dipercayai.', tags: [{ en: 'Frequency', ms: 'Frekuensi' }, { en: 'Hz Stability', ms: 'Kestabilan Hz' }, { en: 'Motor Control', ms: 'Kawalan Motor' }], color: '#0ea5e9' },
        { icon: '📉', title: 'Pembetulan Harmonik (THD)', desc: 'Penapisan harmonik aktif/pasif untuk mengurangkan THD, mengurangkan kehilangan tenaga dan melindungi infrastruktur elektrik.', tags: [{ en: 'THD', ms: 'THD' }, { en: 'Harmonic Filter', ms: 'Penapis Harmonik' }, { en: 'Power Quality', ms: 'Kualiti Kuasa' }], color: '#e53935' },
        { icon: '📊', title: 'Sistem Pengurusan Tenaga (EMS)', desc: 'Platform digital hujung ke hujung untuk menganalisis, memantau dan mengurus penggunaan tenaga perusahaan dengan papan pemuka masa nyata.', tags: [{ en: 'EMS', ms: 'EMS' }, { en: 'Energy Management', ms: 'Pengurusan Tenaga' }, { en: 'AI Dashboard', ms: 'Papan Pemuka AI' }], color: '#7c3aed' },
      ],
    },
    services: { badge: 'Perkhidmatan Kami', title: ['Penyelesaian Bersepadu', 'untuk setiap perniagaan'], sub: 'Perkhidmatan hujung ke hujung dari pembangunan peranti IoT hingga platform pemantauan dan analitik tenaga AI.' },
    products: { badge: 'Produk Kami', title: ['Inovasi', 'Produk Tenaga'], sub: 'Peranti dan sistem yang direka oleh jurutera GE Energy Tech untuk kecekapan tenaga maksimum.', inquiry: 'Pertanyaan Produk' },
    tech: { badge: 'Kredibiliti syarikat', title: ['Rekod &', 'pengiktirafan'], sub: 'Membina kepercayaan melalui projek sebenar, pensijilan, harta intelek, dan pertumbuhan berterusan.' },
    contact: {
      badge: 'Hubungi',
      title: ['Bersedia mulakan', 'projek anda?'],
      head: 'Mari berbincang',
      sub: 'Pasukan kami sedia berunding, mereka bentuk penyelesaian dan anggaran tanpa bayaran awal.',
      company: 'Syarikat',
      address: 'Alamat',
      addressValue: 'Republik Korea',
      systems: 'Sistem',
      systemsValue: 'Papan pemuka tenaga · Platform IoT',
      languages: 'Bahasa',
      languagesValue: 'ไทย · 中文 · Tiếng Việt · English · 한국어 · 日本語 · 繁體中文 · Bahasa Melayu',
      formTitle: 'Hantar mesej kepada kami',
      name: 'Nama',
      email: 'E-mel',
      subject: 'Subjek',
      message: 'Mesej',
      placeholders: ['Nama anda', 'email@company.com', 'Pertanyaan perkhidmatan', 'Ceritakan projek anda...'],
      submit: 'Hantar Mesej →',
      sending: 'Menghantar...',
      success: 'Mesej dihantar. Kami akan membalas melalui e-mel.',
      error: 'Gagal menghantar. Sila cuba lagi.',
    },
    footer: {
      services: 'Perkhidmatan',
      systems: 'Sistem',
      rights: 'Hak cipta terpelihara.',
      privacy: 'Privasi',
      terms: 'Terma',
      portals: 'Portal',
      privacyTitle: 'Dasar Privasi',
      privacyBody: [
        'Kami menghargai privasi anda.',
        'Maklumat yang anda hantar (e-mel/nama/mesej/lampiran) hanya digunakan untuk tindak balas dan perkhidmatan.',
        'Kami tidak menjual data peribadi kepada pihak ketiga.',
      ],
      termsTitle: 'Terma & Syarat',
      termsBody: [
        'Dengan menggunakan laman web ini, anda bersetuju dengan terma ini.',
        'Harga/spesifikasi boleh berubah berdasarkan penilaian tapak dan keperluan teknikal.',
        'Pesanan disahkan selepas pasukan kami mengesahkan maklumat dan slip pembayaran.',
      ],
      portalsTitle: 'Portal',
      portalsBody: [
        'Portal pelanggan: daftar/log masuk untuk akses Customer Dashboard.',
        'Jejak penghantaran: semak status menggunakan e-mel atau nombor pesanan.',
        'Sokongan selepas jualan: berbual dengan staf untuk bantuan.',
      ],
      brandDesc: 'Startup tenaga yang menyediakan peranti IoT, analitik tenaga AI, dan inovasi hijau.',
      serviceLinks: ['Pemantauan tenaga', 'Pengurusan tenaga', 'Infrastruktur IoT', 'Analitik data'],
      systemLinks: ['Hubungi pasukan', 'Papan pemuka tenaga', 'Portal', 'Laman utama'],
      portalLinks: { register: 'Daftar', signIn: 'Log masuk', admin: 'Pentadbir', shipping: 'Jejak penghantaran', afterSales: 'Sembang selepas jualan' },
      close: 'Tutup',
    },
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

for (const code of Object.keys(TRANSLATIONS)) {
  if (TRANSLATIONS[code]?.contact) {
    TRANSLATIONS[code].contact.addressValue = geetCompanyAddress(code);
  }
}

const SERVICES = [
  { icon: '🚀', title: { th: 'โซลูชัน Startup เทคโนโลยีพลังงาน', en: 'Energy Technology Startup Solutions', zh: '能源科技创业解决方案', vi: 'Giải pháp khởi nghiệp công nghệ năng lượng', ko: '에너지 기술 스타트업 솔루션', ja: 'エネルギー技術スタートアップソリューション', 'zh-tw': '能源科技新創解決方案', ms: 'Penyelesaian Startup Teknologi Tenaga' }, desc: { th: 'นวัตกรรมเร็วสำหรับธุรกิจพลังงาน ตั้งแต่ตรวจสอบแนวคิดจนถึงใช้งานจริง', en: 'Startup-style rapid innovation for energy businesses, from concept validation to production rollout.', zh: '面向能源企业的快速创新，从概念验证到规模化落地。', vi: 'Đổi mới nhanh cho doanh nghiệp năng lượng từ kiểm chứng ý tưởng đến triển khai thực tế.', ko: '에너지 비즈니스를 위한 신속 혁신을 컨셉 검증부터 상용화까지 제공합니다.', ja: 'エネルギー企業向けに、構想検証から本番導入まで迅速に実装します。', 'zh-tw': '面向能源企業的快速創新，從概念驗證到正式落地。', ms: 'Inovasi pantas untuk perniagaan tenaga daripada validasi idea hingga pelaksanaan.' }, tags: [{ th: 'สตาร์ทอัพ', en: 'Startup', zh: '创业', vi: 'Startup', ko: '스타트업', ja: 'スタートアップ', 'zh-tw': '新創', ms: 'Startup' }, { th: 'MVP', en: 'MVP', zh: '最小可行产品', vi: 'MVP', ko: 'MVP', ja: 'MVP', 'zh-tw': 'MVP', ms: 'MVP' }, { th: 'ขยายระบบ', en: 'Scale-up', zh: '规模化', vi: 'Mở rộng quy mô', ko: '스케일업', ja: 'スケールアップ', 'zh-tw': '規模擴展', ms: 'Skala Besar' }], accent: 'linear-gradient(90deg, #0ea5e9, #1565c0)', iconBg: 'rgba(14,165,233,0.16)' },
  { icon: '🧩', title: { th: 'พัฒนาและจำหน่ายอุปกรณ์ IoT', en: 'IoT Device Development & Sales', zh: 'IoT 设备开发与销售', vi: 'Phát triển & kinh doanh thiết bị IoT', ko: 'IoT 장치 개발 및 판매', ja: 'IoTデバイス開発・販売', 'zh-tw': 'IoT 設備開發與銷售', ms: 'Pembangunan & Jualan Peranti IoT' }, desc: { th: 'ออกแบบ ผลิต และติดตั้งอุปกรณ์ IoT พร้อมบริการหลังการขาย', en: 'Design, engineering, and commercial delivery of IoT energy devices with installation and after-sales service.', zh: '提供 IoT 能源设备的设计、工程化、交付、安装与售后服务。', vi: 'Thiết kế, chế tạo, triển khai thiết bị năng lượng IoT kèm lắp đặt và hậu mãi.', ko: '설계·엔지니어링·납품부터 설치 및 AS까지 원스톱 제공합니다.', ja: '設計・開発・納品から設置、アフターサービスまで提供します。', 'zh-tw': '提供 IoT 能源設備的設計、工程、交付、安裝與售後服務。', ms: 'Reka bentuk, kejuruteraan, penghantaran komersial serta pemasangan dan sokongan selepas jualan.' }, tags: [{ th: 'อุปกรณ์ IoT', en: 'IoT Devices', zh: 'IoT 设备', vi: 'Thiết bị IoT', ko: 'IoT 장치', ja: 'IoTデバイス', 'zh-tw': 'IoT 設備', ms: 'Peranti IoT' }, { th: 'ฮาร์ดแวร์', en: 'Hardware', zh: '硬件', vi: 'Phần cứng', ko: '하드웨어', ja: 'ハードウェア', 'zh-tw': '硬體', ms: 'Perkakasan' }, { th: 'บริการ', en: 'Service', zh: '服务', vi: 'Dịch vụ', ko: '서비스', ja: 'サービス', 'zh-tw': '服務', ms: 'Perkhidmatan' }], accent: 'linear-gradient(90deg, #1565c0, #0097a7)', iconBg: 'rgba(21,101,192,0.15)' },
  { icon: '⚡', title: { th: 'นวัตกรรมปรับแรงดันและความถี่', en: 'Voltage & Frequency Regulator Innovation', zh: '电压与频率调节创新', vi: 'Đổi mới ổn áp & tần số', ko: '전압·주파수 제어 혁신', ja: '電圧・周波数制御イノベーション', 'zh-tw': '電壓與頻率調節創新', ms: 'Inovasi Pengawal Voltan & Frekuensi' }, desc: { th: 'พัฒนาอุปกรณ์ปรับแรงดัน ควบคุมความถี่ และแก้ไข THD เพื่อคุณภาพไฟฟ้าและความปลอดภัย', en: 'Development of smart devices for voltage stabilization, frequency control, and harmonic distortion (THD) correction to ensure power quality and equipment safety.', zh: '开发稳压、稳频与谐波（THD）治理设备，提升电能质量与设备安全。', vi: 'Phát triển thiết bị ổn áp, ổn tần và xử lý THD để bảo đảm chất lượng điện và an toàn thiết bị.', ko: '전압 안정화, 주파수 제어, THD 보정을 통해 전력 품질과 안전을 확보합니다.', ja: '電圧安定化、周波数制御、THD補正で電力品質と設備安全を高めます。', 'zh-tw': '開發穩壓、穩頻與 THD 校正設備，確保電能品質與設備安全。', ms: 'Membangunkan peranti penstabil voltan, kawalan frekuensi dan pembetulan THD untuk kualiti kuasa.' }, tags: [{ th: 'ปรับแรงดัน', en: 'Voltage Regulator', zh: '稳压', vi: 'Ổn áp', ko: '전압 조정', ja: '電圧調整', 'zh-tw': '穩壓', ms: 'Pengawal Voltan' }, { th: 'ความถี่', en: 'Frequency', zh: '频率', vi: 'Tần số', ko: '주파수', ja: '周波数', 'zh-tw': '頻率', ms: 'Frekuensi' }, { th: 'THD / ฮาร์มอนิก', en: 'THD / Harmonics', zh: 'THD / 谐波', vi: 'THD / Sóng hài', ko: 'THD / 고조파', ja: 'THD / 高調波', 'zh-tw': 'THD / 諧波', ms: 'THD / Harmonik' }], accent: 'linear-gradient(90deg, #f59e0b, #ea580c)', iconBg: 'rgba(245,158,11,0.14)' },
  { icon: '📡', title: { th: 'แพลตฟอร์มมอนิเตอร์ริ่ง (PaaS)', en: 'Monitoring Platform as a Service', zh: '监测平台即服务', vi: 'Nền tảng giám sát dạng dịch vụ', ko: '모니터링 플랫폼 서비스', ja: 'モニタリング PaaS', 'zh-tw': '監測平台即服務', ms: 'Platform Pemantauan sebagai Perkhidmatan' }, desc: { th: 'แพลตฟอร์มคลาวด์มอนิเตอร์พลังงานแบบเรียลไทม์ แจ้งเตือน และแดชบอร์ดครบในที่เดียว', en: 'Cloud platform for real-time energy monitoring, alerts, dashboards, and operational control in one place.', zh: '一体化云平台，提供实时监测、告警、仪表板与运营控制。', vi: 'Nền tảng cloud tích hợp giám sát thời gian thực, cảnh báo, dashboard và điều hành.', ko: '실시간 모니터링·알림·대시보드·운영 제어를 하나의 클라우드에서 제공합니다.', ja: 'リアルタイム監視、通知、ダッシュボード、運用制御を一元化します。', 'zh-tw': '雲端平台整合即時監測、告警、儀表板與運營控制。', ms: 'Platform awan bersepadu untuk pemantauan masa nyata, amaran dan papan pemuka.' }, tags: [{ th: 'มอนิเตอร์', en: 'Monitoring', zh: '监测', vi: 'Giám sát', ko: '모니터링', ja: '監視', 'zh-tw': '監測', ms: 'Pemantauan' }, { th: 'คลาวด์แพลตฟอร์ม', en: 'Cloud Platform', zh: '云平台', vi: 'Nền tảng cloud', ko: '클라우드 플랫폼', ja: 'クラウド基盤', 'zh-tw': '雲端平台', ms: 'Platform Awan' }, { th: 'เรียลไทม์', en: 'Real-time', zh: '实时', vi: 'Thời gian thực', ko: '실시간', ja: 'リアルタイム', 'zh-tw': '即時', ms: 'Masa Nyata' }], accent: 'linear-gradient(90deg, #0097a7, #26c6da)', iconBg: 'rgba(0,151,167,0.15)' },
  { icon: '🤖', title: { th: 'วิเคราะห์และบริหารพลังงานด้วย AI', en: 'AI Energy Analytics & Management', zh: 'AI 能源分析与管理', vi: 'Phân tích & quản trị năng lượng bằng AI', ko: 'AI 에너지 분석·관리', ja: 'AIエネルギー分析・管理', 'zh-tw': 'AI 能源分析與管理', ms: 'Analitik & Pengurusan Tenaga AI' }, desc: { th: 'ระบบ EMS ด้วย AI วิเคราะห์การใช้พลังงาน คุณภาพไฟฟ้า และคาดการณ์ความต้องการ', en: 'AI-powered energy management system (EMS) for analyzing consumption patterns, power quality, demand forecasting, and delivering actionable optimization strategies.', zh: 'AI 驱动的 EMS 可分析用能模式、电能质量与需求预测，并给出优化建议。', vi: 'EMS dùng AI phân tích mô hình tiêu thụ, chất lượng điện, dự báo nhu cầu và đề xuất tối ưu.', ko: 'AI 기반 EMS가 사용 패턴·전력 품질·수요 예측을 분석하고 최적화 전략을 제시합니다.', ja: 'AI搭載EMSが使用傾向・電力品質・需要予測を分析し最適化提案を提供します。', 'zh-tw': 'AI 驅動 EMS 分析用能模式、電能品質與需求預測並提供優化建議。', ms: 'EMS berkuasa AI untuk analisis penggunaan, kualiti kuasa, ramalan permintaan dan cadangan penjimatan.' }, tags: [{ th: 'AI', en: 'AI', zh: 'AI', vi: 'AI', ko: 'AI', ja: 'AI', 'zh-tw': 'AI', ms: 'AI' }, { th: 'EMS', en: 'EMS', zh: 'EMS', vi: 'EMS', ko: 'EMS', ja: 'EMS', 'zh-tw': 'EMS', ms: 'EMS' }, { th: 'คุณภาพไฟฟ้า', en: 'Power Quality', zh: '电能质量', vi: 'Chất lượng điện', ko: '전력 품질', ja: '電力品質', 'zh-tw': '電能品質', ms: 'Kualiti Kuasa' }, { th: 'คาดการณ์', en: 'Forecasting', zh: '预测', vi: 'Dự báo', ko: '예측', ja: '予測', 'zh-tw': '預測', ms: 'Ramalan' }], accent: 'linear-gradient(90deg, #6a1b9a, #9c27b0)', iconBg: 'rgba(106,27,154,0.15)' },
  { icon: '🌱', title: { th: 'พลังงานสีเขียวและลดคาร์บอน', en: 'Green Energy & Carbon Reduction', zh: '绿色能源与减碳', vi: 'Năng lượng xanh & giảm carbon', ko: '그린에너지·탄소감축', ja: 'グリーンエネルギー・脱炭素', 'zh-tw': '綠色能源與減碳', ms: 'Tenaga Hijau & Pengurangan Karbon' }, desc: { th: 'นวัตกรรมเพื่อการเปลี่ยนผ่านสู่พลังงานสีเขียว ลดคาร์บอน และผลกระทบต่อสภาพภูมิอากาศ', en: 'Innovation programs for green energy transition, carbon reduction, and measurable climate impact.', zh: '推动绿色转型与减碳创新，带来可量化的气候效益。', vi: 'Chương trình đổi mới cho chuyển đổi xanh, giảm carbon và tác động khí hậu có thể đo lường.', ko: '그린 전환·탄소 감축을 위한 혁신 프로그램으로 측정 가능한 기후 효과를 만듭니다.', ja: 'グリーン移行と炭素削減を促進し、測定可能な気候効果を実現します。', 'zh-tw': '推動綠色轉型與減碳創新，創造可量化的氣候效益。', ms: 'Program inovasi untuk peralihan hijau, pengurangan karbon dan impak iklim yang boleh diukur.' }, tags: [{ th: 'พลังงานสีเขียว', en: 'Green Energy', zh: '绿色能源', vi: 'Năng lượng xanh', ko: '그린에너지', ja: 'グリーンエネルギー', 'zh-tw': '綠色能源', ms: 'Tenaga Hijau' }, { th: 'คาร์บอน', en: 'Carbon', zh: '碳', vi: 'Carbon', ko: '탄소', ja: 'カーボン', 'zh-tw': '碳', ms: 'Karbon' }, { th: 'ESG', en: 'ESG', zh: 'ESG', vi: 'ESG', ko: 'ESG', ja: 'ESG', 'zh-tw': 'ESG', ms: 'ESG' }], accent: 'linear-gradient(90deg, #2e7d32, #43a047)', iconBg: 'rgba(46,125,50,0.15)' },
  { icon: '🔬', title: { th: 'ห้องปฏิบัติการนวัตกรรมพลังงาน', en: 'Next-Gen Energy Innovation Lab', zh: '新一代能源创新实验室', vi: 'Phòng lab đổi mới năng lượng thế hệ mới', ko: '차세대 에너지 혁신 연구소', ja: '次世代エネルギー革新ラボ', 'zh-tw': '次世代能源創新實驗室', ms: 'Makmal Inovasi Tenaga Generasi Baharu' }, desc: { th: 'วิจัยและพัฒนาเทคโนโลยีพลังงานใหม่เพื่อความยั่งยืนและความได้เปรียบทางการแข่งขัน', en: 'R&D for new energy technologies and advanced digital solutions to improve sustainability and competitiveness.', zh: '研发新型能源技术与先进数字方案，提升可持续性与竞争力。', vi: 'R&D công nghệ năng lượng mới và giải pháp số tiên tiến để nâng tính bền vững và năng lực cạnh tranh.', ko: '신에너지 기술과 디지털 솔루션 R&D로 지속가능성과 경쟁력을 강화합니다.', ja: '新エネルギー技術と先進デジタルソリューションの研究開発を進めます。', 'zh-tw': '研發新型能源技術與先進數位方案，提升永續性與競爭力。', ms: 'R&D teknologi tenaga baharu dan penyelesaian digital maju untuk kelestarian serta daya saing.' }, tags: [{ th: 'วิจัยและพัฒนา', en: 'R&D', zh: '研发', vi: 'R&D', ko: 'R&D', ja: 'R&D', 'zh-tw': '研發', ms: 'R&D' }, { th: 'นวัตกรรม', en: 'Innovation', zh: '创新', vi: 'Đổi mới', ko: '혁신', ja: 'イノベーション', 'zh-tw': '創新', ms: 'Inovasi' }, { th: 'เทคโนโลยีใหม่', en: 'New Tech', zh: '新技术', vi: 'Công nghệ mới', ko: '신기술', ja: '新技術', 'zh-tw': '新技術', ms: 'Teknologi Baharu' }], accent: 'linear-gradient(90deg, #059669, #0891b2)', iconBg: 'rgba(5,150,105,0.14)' },
];

const CREDENTIALS = [
  {
    icon: '🏆',
    name: { th: 'ผลงานที่โดดเด่น', en: 'Proven Track Record', zh: '卓越业绩', vi: 'Thành tích đã được chứng minh', ko: '검증된 실적', ja: '実証された実績', 'zh-tw': '卓越實績', ms: 'Rekod Prestasi Terbukti' },
    desc: {
      th: 'โครงการ IoT พลังงาน ระบบมอนิเตอร์ และแพลตฟอร์มวิเคราะห์ที่ติดตั้งและให้บริการจริงในโรงงานและองค์กร',
      en: 'Delivered IoT energy monitoring, analytics platforms, and field deployments for industrial and enterprise clients.',
      zh: '已为工业与企业客户交付 IoT 能源监测、分析平台与现场部署项目。',
      vi: 'Đã triển khai thực tế giải pháp IoT năng lượng, nền tảng phân tích và hệ thống giám sát cho khách hàng doanh nghiệp.',
      ko: '산업·기업 고객 대상으로 IoT 에너지 모니터링과 분석 플랫폼을 현장 구축해 왔습니다.',
      ja: '産業・企業向けにIoTエネルギー監視、分析基盤、現地導入を実績として提供しています。',
      'zh-tw': '已為工業與企業客戶交付 IoT 能源監測、分析平台與現場部署專案。',
      ms: 'Telah melaksanakan projek pemantauan tenaga IoT, platform analitik dan deployment lapangan untuk pelanggan industri.',
    },
  },
  {
    icon: '📜',
    name: { th: 'หนังสือรับรอง', en: 'Certifications', zh: '认证资质', vi: 'Chứng nhận', ko: '인증', ja: '認証', 'zh-tw': '認證資質', ms: 'Pensijilan' },
    desc: {
      th: 'การรับรองมาตรฐาน MVP / ISO พร้อมมาตรฐานด้านคุณภาพและความปลอดภัยไฟฟ้า รวมถึงการอบรมทีมวิศวกร/เทคนิคอย่างสม่ำเสมอ • อ้างอิง: ISO 14064-2:2019, T-VER Monitoring Report Guidelines',
      en: 'MVP / ISO certifications, plus quality, electrical safety, and continuous technical training credentials. Reference: ISO 14064-2:2019, T-VER Monitoring Report Guidelines.',
      zh: '具备 MVP / ISO 认证，以及质量、电气安全与工程团队持续培训资质。参考：ISO 14064-2:2019，T-VER Monitoring Report Guidelines。',
      vi: 'Có chứng nhận MVP / ISO cùng tiêu chuẩn chất lượng, an toàn điện và đào tạo kỹ thuật định kỳ. Tham chiếu: ISO 14064-2:2019, T-VER Monitoring Report Guidelines.',
      ko: 'MVP / ISO 인증과 함께 품질·전기안전 기준 및 엔지니어 정기 교육 체계를 갖추고 있습니다. 참고: ISO 14064-2:2019, T-VER Monitoring Report Guidelines.',
      ja: 'MVP / ISO認証に加え、品質・電気安全・技術者継続教育の基準を備えています。参考: ISO 14064-2:2019, T-VER Monitoring Report Guidelines。',
      'zh-tw': '具備 MVP / ISO 認證，以及品質、電氣安全與工程團隊持續培訓資質。參考：ISO 14064-2:2019、T-VER Monitoring Report Guidelines。',
      ms: 'Pensijilan MVP / ISO bersama standard kualiti, keselamatan elektrik dan latihan teknikal berterusan. Rujukan: ISO 14064-2:2019, T-VER Monitoring Report Guidelines.',
    },
  },
  {
    icon: '©️',
    name: { th: 'ลิขสิทธิ์', en: 'Copyright', zh: '版权', vi: 'Bản quyền', ko: '저작권', ja: '著作権', 'zh-tw': '版權', ms: 'Hak Cipta' },
    desc: {
      th: 'สิทธิในซอฟต์แวร์แพลตฟอร์ม แดชบอร์ด รายงาน และชุดข้อมูลเชิงวิเคราะห์ที่พัฒนาโดยทีม GE Energy Tech',
      en: 'Protected platform software, dashboards, reports, and proprietary analytics developed in-house.',
      zh: '平台软件、仪表板、报告与专有分析资产均受版权保护。',
      vi: 'Phần mềm nền tảng, dashboard, báo cáo và tài sản phân tích độc quyền đều được bảo hộ bản quyền.',
      ko: '플랫폼 소프트웨어, 대시보드, 리포트, 분석 자산은 모두 저작권 보호 대상입니다.',
      ja: 'プラットフォームソフト、ダッシュボード、レポート、分析資産は著作権で保護されています。',
      'zh-tw': '平台軟體、儀表板、報告與專有分析資產均受版權保護。',
      ms: 'Perisian platform, papan pemuka, laporan dan aset analitik proprietari dilindungi hak cipta.',
    },
  },
  {
    icon: '📋',
    name: { th: 'สิทธิบัตร & IP', en: 'Patents & IP', zh: '专利与知识产权', vi: 'Bằng sáng chế & SHTT', ko: '특허 및 IP', ja: '特許・知的財産', 'zh-tw': '專利與智慧財產', ms: 'Paten & IP' },
    desc: {
      th: 'ทรัพย์สินทางปัญญาในด้านอุปกรณ์พลังงาน IoT และระบบควบคุมคุณภาพไฟฟ้า — พัฒนาและยื่นจดอย่างต่อเนื่อง',
      en: 'Intellectual property in energy IoT devices and power-quality systems under ongoing R&D and filing.',
      zh: '围绕能源 IoT 设备与电能质量系统持续研发并进行专利/IP 申请。',
      vi: 'Liên tục R&D và nộp hồ sơ SHTT cho thiết bị IoT năng lượng và hệ thống chất lượng điện.',
      ko: '에너지 IoT 장치 및 전력품질 시스템 관련 IP를 지속 연구·출원하고 있습니다.',
      ja: 'エネルギーIoT機器と電力品質システムに関する知財を継続的に研究・出願しています。',
      'zh-tw': '針對能源 IoT 設備與電能品質系統持續研發並進行專利/IP 申請。',
      ms: 'IP bagi peranti IoT tenaga dan sistem kualiti kuasa dibangunkan serta difailkan secara berterusan.',
    },
  },
  {
    icon: '📈',
    name: { th: 'ความก้าวหน้า', en: 'Progress', zh: '进展', vi: 'Tiến độ', ko: '진전', ja: '進捗', 'zh-tw': '進展', ms: 'Kemajuan' },
    desc: {
      th: 'พัฒนาผลิตภัณฑ์และฟีเจอร์ใหม่ตาม feedback ลูกค้า พร้อมปรับปรุงประสิทธิภาพพลังงานอย่างต่อเนื่อง',
      en: 'Continuous product evolution driven by customer feedback and measurable efficiency improvements.',
      zh: '根据客户反馈持续迭代产品与功能，并实现可量化的能效提升。',
      vi: 'Liên tục cải tiến sản phẩm theo phản hồi khách hàng và nâng cao hiệu suất năng lượng có thể đo lường.',
      ko: '고객 피드백 기반의 지속 개선으로 제품과 에너지 효율을 꾸준히 향상합니다.',
      ja: '顧客フィードバックを反映し、製品機能と省エネ性能を継続的に改善しています。',
      'zh-tw': '依據客戶回饋持續迭代產品與功能，並提升可量化的能效表現。',
      ms: 'Evolusi produk berterusan dipacu maklum balas pelanggan serta penambahbaikan kecekapan yang boleh diukur.',
    },
  },
  {
    icon: '🌱',
    name: { th: 'การเติบโต', en: 'Growth', zh: '增长', vi: 'Tăng trưởng', ko: '성장', ja: '成長', 'zh-tw': '成長', ms: 'Pertumbuhan' },
    desc: {
      th: 'ขยายฐานลูกค้า พันธมิตร และทีม R&D เพื่อรองรับตลาดไทย เกาหลี และภูมิภาคเอเชีย',
      en: 'Expanding customers, partners, and R&D capacity across Thailand, Korea, and Asia.',
      zh: '持续扩展客户、合作伙伴与研发能力，覆盖泰国、韩国及亚洲市场。',
      vi: 'Mở rộng khách hàng, đối tác và năng lực R&D tại Thái Lan, Hàn Quốc và khu vực châu Á.',
      ko: '태국·한국·아시아 시장에서 고객·파트너·R&D 역량을 확대하고 있습니다.',
      ja: 'タイ・韓国・アジア市場で顧客、パートナー、R&D体制を拡大しています。',
      'zh-tw': '持續擴展客戶、合作夥伴與研發能量，覆蓋泰國、韓國與亞洲市場。',
      ms: 'Pelanggan, rakan kongsi dan kapasiti R&D terus berkembang merentas Thailand, Korea dan Asia.',
    },
  },
];

const PRODUCTS = [
  {
    icon: '⚡',
    category: { th: 'เครื่องปรับแรงดัน', en: 'Voltage Regulator', zh: '稳压器', vi: 'Ổn áp', ko: '전압 조정기', ja: '電圧レギュレータ', 'zh-tw': '穩壓器', ms: 'Pengawal Voltan' },
    name: { th: 'Smart AVR Series', en: 'Smart AVR Series', zh: 'Smart AVR 系列', vi: 'Dòng Smart AVR', ko: 'Smart AVR 시리즈', ja: 'Smart AVR シリーズ', 'zh-tw': 'Smart AVR 系列', ms: 'Siri Smart AVR' },
    desc: { th: 'เครื่องปรับแรงดันไฟฟ้าอัตโนมัติอัจฉริยะ ควบคุมแรงดันให้คงที่ ป้องกันไฟกระชากและไฟตก รองรับโหลด 1–200 kVA', en: 'Intelligent automatic voltage regulator for stable voltage control, surge/sag protection, rated 1–200 kVA.', zh: '智能自动稳压器，稳定电压并防止浪涌/压降，支持 1–200 kVA。', vi: 'Bộ ổn áp tự động thông minh, ổn định điện áp và chống tăng/sụt áp, công suất 1–200 kVA.', ko: '지능형 자동 전압조정기로 전압을 안정화하고 서지/강하를 보호합니다 (1–200 kVA).', ja: '高性能自動電圧調整器。電圧を安定化し、サージ/電圧低下を保護します（1–200 kVA）。', 'zh-tw': '智慧自動穩壓器，穩定電壓並防止突波/壓降，支援 1–200 kVA。', ms: 'Pengawal voltan automatik pintar untuk kawalan stabil dan perlindungan surge/sag, 1–200 kVA.' },
    specs: [{ th: '1–200 kVA', en: '1–200 kVA', zh: '1–200 kVA', vi: '1–200 kVA', ko: '1–200 kVA', ja: '1–200 kVA', 'zh-tw': '1–200 kVA', ms: '1–200 kVA' }, { th: 'ตอบสนอง < 20ms', en: 'Response < 20ms', zh: '响应 < 20ms', vi: 'Phản hồi < 20ms', ko: '응답 < 20ms', ja: '応答 < 20ms', 'zh-tw': '反應 < 20ms', ms: 'Respons < 20ms' }, { th: 'ความแม่นยำ ±1%', en: '±1% accuracy', zh: '精度 ±1%', vi: 'Độ chính xác ±1%', ko: '정확도 ±1%', ja: '精度 ±1%', 'zh-tw': '精度 ±1%', ms: 'Ketepatan ±1%' }],
    color: '#f59e0b',
    badge: { th: 'ขายดี', en: 'Best Seller', zh: '热销', vi: 'Bán chạy', ko: '베스트셀러', ja: '人気製品', 'zh-tw': '熱銷', ms: 'Paling Laris' },
  },
  {
    icon: '〰️',
    category: { th: 'ควบคุมความถี่', en: 'Frequency Controller', zh: '频率控制器', vi: 'Bộ điều khiển tần số', ko: '주파수 제어기', ja: '周波数コントローラ', 'zh-tw': '頻率控制器', ms: 'Pengawal Frekuensi' },
    name: { th: 'FreqGuard Pro', en: 'FreqGuard Pro', zh: 'FreqGuard Pro', vi: 'FreqGuard Pro', ko: 'FreqGuard Pro', ja: 'FreqGuard Pro', 'zh-tw': 'FreqGuard Pro', ms: 'FreqGuard Pro' },
    desc: { th: 'ระบบรักษาความถี่ไฟฟ้า (Hz) สำหรับโรงงานและโรงพยาบาล รองรับระบบ 50/60 Hz ควบคุมด้วย DSP ความแม่นยำสูง', en: 'High-precision DSP-based frequency stabilizer for industrial and medical facilities, supporting 50/60 Hz systems.', zh: '基于 DSP 的高精度稳频系统，适用于工业与医疗场景，支持 50/60 Hz。', vi: 'Bộ ổn định tần số DSP độ chính xác cao cho công nghiệp và y tế, hỗ trợ 50/60 Hz.', ko: '산업/의료 시설용 고정밀 DSP 주파수 안정화 시스템(50/60 Hz 지원).', ja: '産業・医療向け高精度DSP周波数安定化システム（50/60Hz対応）。', 'zh-tw': 'DSP 高精度穩頻系統，適用工業與醫療場域，支援 50/60 Hz。', ms: 'Penstabil frekuensi berasaskan DSP berketepatan tinggi untuk industri/medikal, sokong 50/60 Hz.' },
    specs: [{ th: '50 / 60 Hz', en: '50 / 60 Hz', zh: '50 / 60 Hz', vi: '50 / 60 Hz', ko: '50 / 60 Hz', ja: '50 / 60 Hz', 'zh-tw': '50 / 60 Hz', ms: '50 / 60 Hz' }, { th: 'ควบคุมด้วย DSP', en: 'DSP Control', zh: 'DSP 控制', vi: 'Điều khiển DSP', ko: 'DSP 제어', ja: 'DSP 制御', 'zh-tw': 'DSP 控制', ms: 'Kawalan DSP' }, { th: 'ความแม่นยำ ±0.01 Hz', en: '±0.01 Hz accuracy', zh: '精度 ±0.01 Hz', vi: 'Độ chính xác ±0.01 Hz', ko: '정확도 ±0.01 Hz', ja: '精度 ±0.01 Hz', 'zh-tw': '精度 ±0.01 Hz', ms: 'Ketepatan ±0.01 Hz' }],
    color: '#0ea5e9',
    badge: null,
  },
  {
    icon: '📉',
    category: { th: 'กรองฮาร์มอนิก', en: 'Harmonic Filter', zh: '谐波滤波器', vi: 'Bộ lọc sóng hài', ko: '고조파 필터', ja: '高調波フィルタ', 'zh-tw': '諧波濾波器', ms: 'Penapis Harmonik' },
    name: { th: 'ActiveFilter THD-X', en: 'ActiveFilter THD-X' },
    desc: { th: 'ตัวกรองฮาร์มอนิกเชิงรุก ลด THD ได้มากกว่า 95% ปกป้องระบบไฟฟ้าจากความร้อนสะสมและความเสียหายของอุปกรณ์', en: 'Active harmonic filter reducing THD by over 95%, protecting electrical systems from overheating and equipment damage.', zh: '有源谐波滤波器可将 THD 降低 95% 以上，减少过热并保护设备。', vi: 'Bộ lọc sóng hài chủ động giảm THD hơn 95%, bảo vệ hệ thống khỏi quá nhiệt và hư hỏng.', ko: '능동 고조파 필터로 THD를 95% 이상 저감하여 과열과 장비 손상을 방지합니다.', ja: 'アクティブ高調波フィルタでTHDを95%以上低減し、過熱と設備損傷を防ぎます。', 'zh-tw': '主動式諧波濾波器可將 THD 降低 95% 以上，降低過熱與設備損害。', ms: 'Penapis harmonik aktif mengurangkan THD >95% untuk lindungi sistem daripada haba berlebihan.' },
    specs: [{ th: 'THD < 5%', en: 'THD < 5%', zh: 'THD < 5%', vi: 'THD < 5%', ko: 'THD < 5%', ja: 'THD < 5%', 'zh-tw': 'THD < 5%', ms: 'THD < 5%' }, { th: 'กรองเชิงรุก', en: 'Active filtering', zh: '主动滤波', vi: 'Lọc chủ động', ko: '능동 필터링', ja: 'アクティブフィルタ', 'zh-tw': '主動濾波', ms: 'Penapisan aktif' }, { th: 'สูงสุด 600A', en: 'Up to 600A', zh: '最高 600A', vi: 'Tối đa 600A', ko: '최대 600A', ja: '最大 600A', 'zh-tw': '最高 600A', ms: 'Sehingga 600A' }],
    color: '#e53935',
    badge: { th: 'ใหม่', en: 'New', zh: '新品', vi: 'Mới', ko: '신제품', ja: '新製品', 'zh-tw': '新品', ms: 'Baharu' },
  },
  {
    id: SMART_METER_PRODUCT_ID,
    icon: '📊',
    category: { th: 'มิเตอร์อัจฉริยะ', en: 'Smart Meter', zh: '智能电表', vi: 'Công tơ thông minh', ko: '스마트 미터', ja: 'スマートメーター', 'zh-tw': '智慧電表', ms: 'Meter Pintar' },
    name: { th: 'GE-IoT Power Meter', en: 'GE-IoT Power Meter' },
    desc: { th: 'มิเตอร์วัดพลังงานแบบ IoT วัด V/I/kW/kWh/PF/THD แบบเรียลไทม์ ส่งข้อมูลผ่าน MQTT/Modbus เชื่อมต่อ Cloud Platform ได้ทันที', en: 'IoT-enabled power meter measuring V/I/kW/kWh/PF/THD in real time, transmitting via MQTT/Modbus to Cloud Platform.', zh: 'IoT 电表实时测量 V/I/kW/kWh/PF/THD，并通过 MQTT/Modbus 上云。', vi: 'Công tơ IoT đo V/I/kW/kWh/PF/THD thời gian thực, truyền MQTT/Modbus lên cloud.', ko: 'V/I/kW/kWh/PF/THD를 실시간 측정하고 MQTT/Modbus로 클라우드 전송합니다.', ja: 'V/I/kW/kWh/PF/THDをリアルタイム計測しMQTT/Modbusでクラウド送信します。', 'zh-tw': 'IoT 電表可即時量測 V/I/kW/kWh/PF/THD，並透過 MQTT/Modbus 上雲。', ms: 'Meter kuasa IoT mengukur V/I/kW/kWh/PF/THD secara masa nyata melalui MQTT/Modbus ke cloud.' },
    specs: [{ th: 'MQTT / Modbus', en: 'MQTT / Modbus', zh: 'MQTT / Modbus', vi: 'MQTT / Modbus', ko: 'MQTT / Modbus', ja: 'MQTT / Modbus', 'zh-tw': 'MQTT / Modbus', ms: 'MQTT / Modbus' }, { th: 'V · I · kW · THD', en: 'V · I · kW · THD', zh: 'V · I · kW · THD', vi: 'V · I · kW · THD', ko: 'V · I · kW · THD', ja: 'V · I · kW · THD', 'zh-tw': 'V · I · kW · THD', ms: 'V · I · kW · THD' }, { th: 'พร้อมเชื่อมต่อคลาวด์', en: 'Cloud ready', zh: '云端就绪', vi: 'Sẵn sàng cloud', ko: '클라우드 지원', ja: 'クラウド対応', 'zh-tw': '雲端就緒', ms: 'Sedia Awan' }],
    color: '#7c3aed',
    badge: null,
  },
  {
    icon: '🌱',
    category: { th: 'ระบบพลังงานสีเขียว', en: 'Green Energy System', zh: '绿色能源系统', vi: 'Hệ thống năng lượng xanh', ko: '그린에너지 시스템', ja: 'グリーンエネルギーシステム', 'zh-tw': '綠色能源系統', ms: 'Sistem Tenaga Hijau' },
    name: { th: 'SolarEdge Monitor', en: 'SolarEdge Monitor' },
    desc: { th: 'ระบบมอนิเตอร์และวิเคราะห์พลังงานโซลาร์เซลล์ พร้อมคำนวณ Carbon Credit วัดประสิทธิภาพแผงโซลาร์แบบรายวัน', en: 'Solar energy monitoring and analysis system with Carbon Credit calculation and daily panel efficiency tracking.', zh: '太阳能监测分析系统，支持碳积分计算与每日组件效率追踪。', vi: 'Hệ thống giám sát phân tích năng lượng mặt trời, tính Carbon Credit và theo dõi hiệu suất hàng ngày.', ko: '태양광 모니터링·분석과 탄소크레딧 계산, 일일 패널 효율 추적을 지원합니다.', ja: '太陽光の監視・分析に加え、カーボンクレジット計算と日次効率追跡に対応。', 'zh-tw': '太陽能監測分析系統，支援碳權計算與每日面板效率追蹤。', ms: 'Sistem pemantauan/analisis solar dengan pengiraan kredit karbon dan laporan kecekapan harian.' },
    specs: [{ th: 'Solar PV', en: 'Solar PV', zh: '太阳能 PV', vi: 'Solar PV', ko: '태양광 PV', ja: 'Solar PV', 'zh-tw': '太陽能 PV', ms: 'Solar PV' }, { th: 'Carbon Credit', en: 'Carbon Credit', zh: '碳积分', vi: 'Carbon Credit', ko: '탄소크레딧', ja: 'カーボンクレジット', 'zh-tw': '碳權', ms: 'Kredit Karbon' }, { th: 'รายงานรายวัน', en: 'Daily report', zh: '日报', vi: 'Báo cáo hàng ngày', ko: '일일 리포트', ja: '日次レポート', 'zh-tw': '每日報告', ms: 'Laporan Harian' }],
    color: '#16a34a',
    badge: null,
  },
  {
    icon: '🤖',
    category: { th: 'แพลตฟอร์ม AI', en: 'AI Platform', zh: 'AI 平台', vi: 'Nền tảng AI', ko: 'AI 플랫폼', ja: 'AIプラットフォーム', 'zh-tw': 'AI 平台', ms: 'Platform AI' },
    name: { th: 'GE-EMS Cloud', en: 'GE-EMS Cloud' },
    desc: { th: 'แพลตฟอร์มบริหารจัดการพลังงานองค์กรด้วย AI วิเคราะห์รูปแบบการใช้พลังงาน คาดการณ์ความต้องการ และให้คำแนะนำประหยัดพลังงาน', en: 'AI-powered enterprise energy management platform for consumption pattern analysis, demand forecasting, and saving recommendations.', zh: '企业级 AI 能源管理平台，分析用能模式、预测需求并提供节能建议。', vi: 'Nền tảng quản trị năng lượng doanh nghiệp bằng AI, phân tích tiêu thụ và dự báo nhu cầu.', ko: '기업용 AI 에너지 관리 플랫폼으로 사용 패턴 분석·수요 예측·절감 권고를 제공합니다.', ja: '企業向けAIエネルギー管理基盤。使用分析、需要予測、省エネ提案を提供。', 'zh-tw': '企業級 AI 能源管理平台，可分析用能模式、預測需求並提出節能建議。', ms: 'Platform pengurusan tenaga perusahaan berkuasa AI untuk analisis corak penggunaan dan ramalan permintaan.' },
    specs: [{ th: 'AI Analytics', en: 'AI Analytics', zh: 'AI 分析', vi: 'AI Analytics', ko: 'AI 분석', ja: 'AI分析', 'zh-tw': 'AI 分析', ms: 'Analitik AI' }, { th: 'คาดการณ์ความต้องการ', en: 'Demand forecast', zh: '需求预测', vi: 'Dự báo nhu cầu', ko: '수요 예측', ja: '需要予測', 'zh-tw': '需求預測', ms: 'Ramalan Permintaan' }, { th: 'หลายไซต์', en: 'Multi-site', zh: '多站点', vi: 'Đa cơ sở', ko: '멀티 사이트', ja: 'マルチサイト', 'zh-tw': '多據點', ms: 'Pelbagai Tapak' }],
    color: '#7c3aed',
    badge: { th: 'Cloud SaaS', en: 'Cloud SaaS', zh: '云端 SaaS', vi: 'Cloud SaaS', ko: '클라우드 SaaS', ja: 'クラウドSaaS', 'zh-tw': '雲端 SaaS', ms: 'Cloud SaaS' },
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
          <a href="#credibility">{t.nav.technology}</a>
          <a href="#contact">{t.nav.contact}</a>
          <a href={publicHubHref('/ge-energy-tech/shipping-tracking')}>{navExtra.tracking}</a>
          <a href={publicHubHref('/ge-energy-tech/after-sales-chat')}>{navExtra.afterSales}</a>
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
                  {item.tags.map((tag, idx) => (
                    <span key={`${item.title}-${idx}`} className="get-service-tag">{pickLang(tag, lang)}</span>
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
                  {service.tags.map((tag, idx) => (
                    <span key={`${pickLang(service.title, lang)}-${idx}`} className="get-service-tag">{pickLang(tag, lang)}</span>
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
                  {p.specs.map((s, idx) => (
                    <span key={`${pickLang(p.name, lang)}-${idx}`} className="get-product-spec">{pickLang(s, lang)}</span>
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

      <section className="get-section get-tech get-credibility" id="credibility">
        <div className="get-container">
          <div className="get-section-head">
            <div className="get-badge get-badge--green">{t.tech.badge}</div>
            <h2 className="get-section-h2">
              {t.tech.title[0]} <em>{t.tech.title[1]}</em>
            </h2>
            <p className="get-section-sub">{t.tech.sub}</p>
          </div>
          <div className="get-tech-grid get-credibility-grid">
            {CREDENTIALS.map((item) => (
              <div key={pickLang(item.name, lang)} className="get-tech-card get-credibility-card">
                <span className="get-credibility-icon" aria-hidden>
                  {item.icon}
                </span>
                <strong>{pickLang(item.name, lang)}</strong>
                <p>{pickLang(item.desc, lang)}</p>
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
                    <span>{t.contact.systemsValue}</span>
                  </div>
                </div>
                <div className="get-contact-item">
                  <span className="get-contact-item-icon">🌏</span>
                  <div className="get-contact-item-text">
                    <strong>{t.contact.languages}</strong>
                    <span>{t.contact.languagesValue}</span>
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
              <p>{t.footer.brandDesc}</p>
            </div>
            <div className="get-footer-col">
              <h5>{t.footer.services}</h5>
              <ul>
                <li><a href="#services">{t.footer.serviceLinks[0]}</a></li>
                <li><a href="#services">{t.footer.serviceLinks[1]}</a></li>
                <li><a href="#services">{t.footer.serviceLinks[2]}</a></li>
                <li><a href="#services">{t.footer.serviceLinks[3]}</a></li>
              </ul>
            </div>
            <div className="get-footer-col">
              <h5>{t.footer.systems}</h5>
              <ul>
                <li><a href="#contact">{t.footer.systemLinks[0]}</a></li>
                <li><a href="#services">{t.footer.systemLinks[1]}</a></li>
                <li>
                  <button type="button" className="get-footer-link" onClick={() => setLegalOpen('portals')}>
                    {t.footer.systemLinks[2]}
                  </button>
                </li>
                <li><a href="#hero">{t.footer.systemLinks[3]}</a></li>
              </ul>
            </div>
          </div>
          <div className="get-footer-bottom">
            <p>© {new Date().getFullYear()} GE Energy Tech Co., Ltd. {t.footer.rights}</p>
            <div className="get-footer-bottom-links">
              <a href="/ge-energy-tech/privacy" className="get-footer-link">
                {t.footer.privacy}
              </a>
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
            <button type="button" className="get-legal-modal-close" onClick={() => setLegalOpen(null)} aria-label={t.footer.close}>
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
                  <a href={publicHubHref('/register-geet')}>{t.footer.portalLinks.register}</a>
                  <a href={publicHubHref('/ge-energy-tech/login')}>{t.footer.portalLinks.signIn}</a>
                  <a href={publicHubHref('/ge-energy-erp-login')}>{t.footer.portalLinks.admin}</a>
                  <a href={publicHubHref('/ge-energy-tech/shipping-tracking')}>{t.footer.portalLinks.shipping}</a>
                  <a href={publicHubHref('/ge-energy-tech/after-sales-chat')}>{t.footer.portalLinks.afterSales}</a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

