// ภาพประกอบ (inline SVG) สำหรับกล่องเลือกโหมดเข้าใช้งานของประชาชน
// วาดด้วย SVG ล้วน — คมทุกขนาดจอ ไม่ต้องโหลดไฟล์ภาพเพิ่ม

const svgProps = {
  viewBox: '0 0 160 120',
  width: '100%',
  height: '100%',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true,
  focusable: false,
};

// 1) ยื่นเรื่องโดยไม่ต้องเข้าสู่ระบบ — เอกสาร + เครื่องบินกระดาษ (ส่งได้ทันที)
export const QuickSubmitIllustration = () => (
  <svg {...svgProps}>
    <circle cx="80" cy="62" r="50" fill="#E3F0FC" />
    <circle cx="132" cy="24" r="6" fill="#BBD9F7" />
    <circle cx="24" cy="96" r="4" fill="#BBD9F7" />
    {/* เอกสาร */}
    <g transform="rotate(-6 66 64)">
      <rect x="40" y="28" width="52" height="68" rx="6" fill="#FFFFFF" stroke="#90C2F0" strokeWidth="2" />
      <rect x="49" y="40" width="26" height="5" rx="2.5" fill="#1565C0" />
      <rect x="49" y="52" width="34" height="4" rx="2" fill="#CFE3F8" />
      <rect x="49" y="61" width="30" height="4" rx="2" fill="#CFE3F8" />
      <rect x="49" y="70" width="34" height="4" rx="2" fill="#CFE3F8" />
      <rect x="49" y="79" width="20" height="4" rx="2" fill="#CFE3F8" />
    </g>
    {/* เส้นทางบิน */}
    <path d="M86 84 C 100 92, 112 80, 110 66" fill="none" stroke="#42A5F5" strokeWidth="2" strokeDasharray="3 4" strokeLinecap="round" />
    {/* เครื่องบินกระดาษ */}
    <g transform="translate(104 30)">
      <path d="M0 22 L40 4 L26 36 L18 26 Z" fill="#1565C0" />
      <path d="M18 26 L40 4 L14 22 Z" fill="#0D47A1" />
      <path d="M18 26 L20 36 L24 30 Z" fill="#0D47A1" />
    </g>
    {/* สายฟ้าเล็ก = รวดเร็ว */}
    <path d="M30 34 l-6 11 h6 l-4 10 l11 -14 h-6 l4 -7 Z" fill="#FFB74D" />
  </svg>
);

// 2) เข้าสู่ระบบ — บัตรสมาชิก + โล่ + กระดิ่งแจ้งเตือน
export const MemberLoginIllustration = () => (
  <svg {...svgProps}>
    <circle cx="80" cy="62" r="50" fill="#E6F4E9" />
    <circle cx="28" cy="26" r="5" fill="#C3E5C9" />
    <circle cx="138" cy="98" r="6" fill="#C3E5C9" />
    {/* บัตรสมาชิก */}
    <rect x="30" y="38" width="84" height="56" rx="8" fill="#FFFFFF" stroke="#A5D6A7" strokeWidth="2" />
    <rect x="30" y="38" width="84" height="14" rx="8" fill="#2E7D32" />
    <rect x="30" y="46" width="84" height="6" fill="#2E7D32" />
    <circle cx="52" cy="72" r="11" fill="#E6F4E9" />
    <circle cx="52" cy="69" r="4.5" fill="#2E7D32" />
    <path d="M44 80 a8 7 0 0 1 16 0 Z" fill="#2E7D32" />
    <rect x="70" y="63" width="32" height="5" rx="2.5" fill="#1B5E20" />
    <rect x="70" y="73" width="24" height="4" rx="2" fill="#C3E5C9" />
    <rect x="70" y="81" width="28" height="4" rx="2" fill="#C3E5C9" />
    {/* โล่ความปลอดภัย */}
    <g transform="translate(104 60)">
      <path d="M18 0 L34 6 V18 C34 30 26 37 18 40 C10 37 2 30 2 18 V6 Z" fill="#06C755" stroke="#FFFFFF" strokeWidth="3" />
      <path d="M11 20 l5 5 l9 -10" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    {/* กระดิ่งแจ้งเตือน */}
    <g transform="translate(112 16)">
      <path d="M12 2 C6 2 4 7 4 12 V18 L1 22 H23 L20 18 V12 C20 7 18 2 12 2 Z" fill="#FFB74D" />
      <circle cx="12" cy="25" r="3" fill="#F57C00" />
      <circle cx="21" cy="4" r="4" fill="#E53935" />
    </g>
  </svg>
);

// 3) ติดตามสถานะ — ไทม์ไลน์ขั้นตอน + แว่นขยาย
export const TrackStatusIllustration = () => (
  <svg {...svgProps}>
    <circle cx="80" cy="62" r="50" fill="#FFF3E0" />
    <circle cx="136" cy="26" r="5" fill="#FFE0B2" />
    <circle cx="22" cy="92" r="5" fill="#FFE0B2" />
    {/* การ์ดไทม์ไลน์ */}
    <rect x="34" y="24" width="70" height="78" rx="8" fill="#FFFFFF" stroke="#FFCC80" strokeWidth="2" />
    <line x1="50" y1="40" x2="50" y2="86" stroke="#FFE0B2" strokeWidth="3" />
    <line x1="50" y1="40" x2="50" y2="63" stroke="#F57C00" strokeWidth="3" />
    <circle cx="50" cy="40" r="6" fill="#2E7D32" />
    <path d="M47 40 l2 2 l4 -4" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="50" cy="63" r="6" fill="#F57C00" />
    <circle cx="50" cy="63" r="2.2" fill="#fff" />
    <circle cx="50" cy="86" r="6" fill="#FFFFFF" stroke="#FFCC80" strokeWidth="2" />
    <rect x="62" y="36" width="30" height="4" rx="2" fill="#1A2233" opacity="0.7" />
    <rect x="62" y="43" width="22" height="3" rx="1.5" fill="#FFE0B2" />
    <rect x="62" y="59" width="30" height="4" rx="2" fill="#E65100" />
    <rect x="62" y="66" width="18" height="3" rx="1.5" fill="#FFE0B2" />
    <rect x="62" y="82" width="26" height="4" rx="2" fill="#FFE0B2" />
    {/* แว่นขยาย */}
    <g transform="translate(96 54)">
      <line x1="30" y1="30" x2="44" y2="44" stroke="#5A6B82" strokeWidth="7" strokeLinecap="round" />
      <circle cx="18" cy="18" r="17" fill="rgba(255,255,255,0.75)" stroke="#1A2233" strokeWidth="5" />
      <path d="M10 13 a10 10 0 0 1 9 -6" fill="none" stroke="#FFB74D" strokeWidth="3" strokeLinecap="round" />
    </g>
  </svg>
);
