import { createPortal } from 'react-dom';
import appIcon from '../icons/app-icon-v3.png';
import { formatDateTime } from '../../utils/formatters';

// สำเนาคำร้องสำหรับผู้ร้องพิมพ์เก็บไว้ — แสดงเฉพาะตอนพิมพ์ (window.print)
// render ผ่าน portal เป็นลูกของ <body> เพื่อซ่อนส่วนอื่นของหน้าได้ทั้งหมดขณะพิมพ์
const RECEIPT_CSS = `
  @media screen { .rc-print { display: none; } }
  @media print {
    @page { size: A4; margin: 14mm 14mm 16mm; }
    body > *:not(.rc-print) { display: none !important; }
    .rc-print { display: block; color: #111; font-size: 13px; line-height: 1.55; }
    .rc-head { display: flex; gap: 14px; align-items: center; border-bottom: 2px solid #1565C0; padding-bottom: 10px; margin-bottom: 12px; }
    .rc-head img { width: 54px; height: 54px; border-radius: 10px; }
    .rc-head h1 { font-size: 18px; margin: 0; font-weight: 600; }
    .rc-head p { margin: 2px 0 0; color: #444; font-size: 13px; }
    .rc-code { margin-left: auto; text-align: center; border: 2px solid #1565C0; border-radius: 8px; padding: 4px 14px; white-space: nowrap; }
    .rc-code small { display: block; font-size: 11px; color: #444; }
    .rc-code b { font-size: 26px; letter-spacing: 6px; color: #0D47A1; }
    .rc-warn { margin: 0 0 10px; padding: 6px 10px; border: 1px solid #C62828; border-radius: 4px; color: #B71C1C; font-weight: 700; }
    .rc-section { margin-top: 14px; }
    .rc-grid, .rc-title { break-inside: avoid; }
    .rc-section h2 { break-after: avoid; font-size: 14px; font-weight: 600; margin: 0 0 6px; padding: 4px 8px; background: #E3F0FC; color: #0D47A1; border-radius: 4px; }
    .rc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; padding: 0 8px; }
    .rc-row { display: flex; gap: 8px; min-width: 0; }
    .rc-row .k { color: #555; flex: 0 0 120px; }
    .rc-row .v { font-weight: 500; word-break: break-word; min-width: 0; }
    .rc-full { grid-column: 1 / -1; }
    .rc-title { font-size: 15px; font-weight: 600; padding: 0 8px; margin-bottom: 4px; }
    .rc-text { white-space: pre-wrap; word-break: break-word; padding: 0 8px; }
    .rc-list { margin: 0; padding: 0 8px 0 28px; }
    .rc-muted { color: #777; padding: 0 8px; margin: 0; }
    .rc-foot { margin-top: 24px; padding-top: 6px; border-top: 1px solid #ccc; font-size: 11px; color: #666; display: flex; justify-content: space-between; gap: 12px; }
    .rc-code, .rc-warn, .rc-section h2 { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

const Row = ({ label, value, full }) => (
  <div className={`rc-row${full ? ' rc-full' : ''}`}>
    <span className="k">{label}</span>
    <span className="v">{value || '-'}</span>
  </div>
);

const ComplaintReceiptPrint = ({ trackingCode, receipt }) => {
  const r = receipt || {};
  const trackUrl = `${window.location.origin}${import.meta.env.BASE_URL}public/track`;

  return createPortal(
    <div className="rc-print">
      <style>{RECEIPT_CSS}</style>

      <div className="rc-head">
        <img src={appIcon} alt="" />
        <div>
          <h1>แบบคำร้องเรียน / ร้องทุกข์ (สำเนาผู้ร้อง)</h1>
          <p>ศูนย์ดำรงธรรมจังหวัดศรีสะเกษ</p>
          <p>วันที่ยื่นเรื่อง {r.submitted_at ? formatDateTime(r.submitted_at) : '-'}</p>
        </div>
        <div className="rc-code">
          <small>รหัสติดตามเรื่อง</small>
          <b>{trackingCode}</b>
        </div>
      </div>

      <p className="rc-warn">กรุณาเก็บรักษารหัสนี้ไว้ และไม่เปิดเผยให้ผู้อื่นทราบ</p>

      <section className="rc-section">
        <h2>ข้อมูลผู้ร้องเรียน</h2>
        <div className="rc-grid">
          <Row label="ประเภทผู้ร้อง" value={r.complainant_type_name} />
          <Row label="ปกปิดตัวตน" value={r.is_anonymous ? 'ใช่' : 'ไม่'} />
          {!r.is_anonymous && <Row label="ชื่อ-นามสกุล" value={r.complainant_name} />}
          {!r.is_anonymous && <Row label="เลขบัตรประชาชน" value={r.complainant_id_card} />}
          <Row label="เบอร์โทรศัพท์" value={r.complainant_phone} />
          {!r.is_anonymous && <Row label="อีเมล" value={r.complainant_email} />}
          {!r.is_anonymous && <Row label="ที่อยู่" value={r.complainant_address} full />}
        </div>
      </section>

      <section className="rc-section">
        <h2>รายละเอียดเรื่องร้องเรียน</h2>
        <div className="rc-grid" style={{ marginBottom: 6 }}>
          <Row label="ประเภทเรื่อง" value={r.category_name} full />
        </div>
        <div className="rc-title">{r.title}</div>
        <div className="rc-text">{r.description}</div>
      </section>

      <section className="rc-section">
        <h2>จุดเกิดเหตุ</h2>
        <div className="rc-grid">
          <Row label="จังหวัด" value={r.province_name} />
          <Row label="อำเภอ" value={r.district_name} />
          <Row label="ตำบล" value={r.subdistrict_name} />
          <Row label="รหัสไปรษณีย์" value={r.postal_code} />
          <Row label="สถานที่" value={r.incident_address} full />
          {r.latitude && r.longitude && <Row label="พิกัด" value={`${r.latitude}, ${r.longitude}`} full />}
        </div>
      </section>

      <section className="rc-section">
        <h2>ไฟล์แนบ ({r.attachments?.length || 0})</h2>
        {r.attachments?.length ? (
          <ol className="rc-list">
            {r.attachments.map((name, i) => <li key={`${name}-${i}`}>{name}</li>)}
          </ol>
        ) : <p className="rc-muted">ไม่มีไฟล์แนบ</p>}
      </section>

      <section className="rc-section">
        <h2>การติดตามสถานะ</h2>
        <p className="rc-muted" style={{ color: '#111' }}>
          ติดตามสถานะได้ที่ {trackUrl} โดยใช้รหัสติดตามเรื่อง <b>{trackingCode}</b>
        </p>
      </section>

      <div className="rc-foot">
        <span>เอกสารนี้มีข้อมูลส่วนบุคคล โปรดเก็บรักษาอย่างปลอดภัย</span>
        <span>พิมพ์เมื่อ {formatDateTime(new Date())}</span>
      </div>
    </div>,
    document.body
  );
};

export default ComplaintReceiptPrint;
