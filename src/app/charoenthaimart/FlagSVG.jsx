export const LANGS = [
  { key: "th",  label: "ไทย" },
  { key: "ko",  label: "한국어" },
  { key: "en",  label: "English" },
  { key: "zh",  label: "中文" },
  { key: "vi",  label: "Tiếng Việt" },
];

export function FlagSVG({ langKey, size = 22 }) {
  const h = Math.round(size * 0.67);
  if (langKey === "th") return (
    <svg width={size} height={h} viewBox="0 0 30 20" style={{ borderRadius: 2, display: "block", flexShrink: 0 }}>
      <rect width="30" height="20" fill="#A51931"/>
      <rect y="3.33" width="30" height="13.34" fill="#F4F5F8"/>
      <rect y="6.67" width="30" height="6.66" fill="#2D2A4A"/>
    </svg>
  );
  if (langKey === "ko") {
    const S = { stroke: "#000", strokeWidth: "1.3" };
    const solid = (y) => <line x1="-3.8" y1={y} x2="3.8" y2={y} {...S}/>;
    const broken = (y) => <><line x1="-3.8" y1={y} x2="-0.8" y2={y} {...S}/><line x1="0.8" y1={y} x2="3.8" y2={y} {...S}/></>;
    return (
      <svg width={size} height={h} viewBox="0 0 30 20" style={{ borderRadius: 2, display: "block", flexShrink: 0 }}>
        <rect width="30" height="20" fill="#fff"/>
        {/* 건 (Heaven) top-left: 3 solid — rotated -45° so bars go / */}
        <g transform="translate(6,4.5) rotate(-45)">{solid(-2)}{solid(0)}{solid(2)}</g>
        {/* 리 (Fire) top-right: solid/broken/solid — rotated +45° so bars go \ */}
        <g transform="translate(24,4.5) rotate(45)">{solid(-2)}{broken(0)}{solid(2)}</g>
        {/* 감 (Water) bottom-left: broken/solid/broken — rotated +45° so bars go \ */}
        <g transform="translate(6,15.5) rotate(45)">{broken(-2)}{solid(0)}{broken(2)}</g>
        {/* 곤 (Earth) bottom-right: 3 broken — rotated -45° so bars go / */}
        <g transform="translate(24,15.5) rotate(-45)">{broken(-2)}{broken(0)}{broken(2)}</g>
        {/* Taeguk */}
        <circle cx="15" cy="10" r="5" fill="#CD2E3A"/>
        <path d="M15 5 A2.5 2.5 0 0 1 15 10 A2.5 2.5 0 0 0 15 15 A5 5 0 0 1 15 5Z" fill="#0047A0"/>
        <circle cx="15" cy="7.5" r="1.25" fill="#CD2E3A"/>
        <circle cx="15" cy="12.5" r="1.25" fill="#0047A0"/>
      </svg>
    );
  }
  if (langKey === "en") return (
    <svg width={size} height={h} viewBox="0 0 30 20" style={{ borderRadius: 2, display: "block", flexShrink: 0 }}>
      <rect width="30" height="20" fill="#012169"/>
      <line x1="0" y1="0" x2="30" y2="20" stroke="#fff" strokeWidth="4"/>
      <line x1="30" y1="0" x2="0" y2="20" stroke="#fff" strokeWidth="4"/>
      <line x1="0" y1="0" x2="30" y2="20" stroke="#C8102E" strokeWidth="2.5"/>
      <line x1="30" y1="0" x2="0" y2="20" stroke="#C8102E" strokeWidth="2.5"/>
      <rect x="12" y="0" width="6" height="20" fill="#fff"/>
      <rect x="0" y="7" width="30" height="6" fill="#fff"/>
      <rect x="13" y="0" width="4" height="20" fill="#C8102E"/>
      <rect x="0" y="8" width="30" height="4" fill="#C8102E"/>
    </svg>
  );
  if (langKey === "zh") return (
    <svg width={size} height={h} viewBox="0 0 30 20" style={{ borderRadius: 2, display: "block", flexShrink: 0 }}>
      <rect width="30" height="20" fill="#DE2910"/>
      <polygon points="6,2 7.2,5.8 11,5.8 8,8 9.2,11.8 6,9.5 2.8,11.8 4,8 1,5.8 4.8,5.8" fill="#FFDE00"/>
      <polygon points="12,2 12.8,4.4 15.3,4.4 13.3,5.8 14,8.2 12,6.8 10,8.2 10.7,5.8 8.7,4.4 11.2,4.4" fill="#FFDE00" transform="scale(0.55) translate(10,0)"/>
      <polygon points="14,4 14.6,5.9 16.6,5.9 15,7 15.6,9 14,7.8 12.4,9 13,7 11.4,5.9 13.4,5.9" fill="#FFDE00" transform="scale(0.45) translate(16,2)"/>
      <polygon points="14,7 14.6,8.9 16.6,8.9 15,10 15.6,12 14,10.8 12.4,12 13,10 11.4,8.9 13.4,8.9" fill="#FFDE00" transform="scale(0.45) translate(14,8)"/>
    </svg>
  );
  if (langKey === "vi") return (
    <svg width={size} height={h} viewBox="0 0 30 20" style={{ borderRadius: 2, display: "block", flexShrink: 0 }}>
      <rect width="30" height="20" fill="#DA251D"/>
      <polygon points="15,3 16.8,8.5 22.5,8.5 17.8,12 19.6,17.5 15,14 10.4,17.5 12.2,12 7.5,8.5 13.2,8.5" fill="#FFFF00"/>
    </svg>
  );
  return null;
}
