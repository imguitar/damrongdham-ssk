import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import appIcon from '../../components/icons/app-icon-v2.png';
import * as complaintApi from '../../api/complaintApi';
import { useAuth } from '../../contexts/AuthContext';
import { PRIORITY_LABELS, ROLES, STATUS_LABELS } from '../../utils/constants';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { extractError } from '../../utils/alert';

// ต้องตรงกับหน้า ComplaintDetailPage — บทบาทที่เห็นข้อมูลติดต่อของผู้ร้อง
const CAN_SEE_PII = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OFFICER];

const SOURCE_LABELS = { STAFF: 'เจ้าหน้าที่บันทึก', PUBLIC: 'ประชาชนยื่นเอง', LINE: 'LINE' };

// จัดหน้าสำหรับกระดาษ A4 — ส่วนควบคุม (.no-print) ซ่อนเมื่อพิมพ์
const PRINT_CSS = `
  @page { size: A4; margin: 14mm 14mm 16mm; }
  .cp-root { background: #eef1f5; min-height: 100vh; padding: 24px 12px 48px; color: #111; }
  .cp-toolbar { max-width: 210mm; margin: 0 auto 12px; display: flex; gap: 8px; justify-content: flex-end; align-items: center; }
  .cp-toolbar span { margin-right: auto; font-size: 13px; color: #555; }
  .cp-btn { font: inherit; font-size: 14px; padding: 8px 16px; border-radius: 8px; border: 1px solid #1565C0; background: #fff; color: #1565C0; cursor: pointer; }
  .cp-btn.primary { background: #1565C0; color: #fff; }
  .cp-sheet { max-width: 210mm; margin: 0 auto; background: #fff; padding: 14mm; box-shadow: 0 2px 12px rgba(0,0,0,.12); font-size: 13px; line-height: 1.55; }
  .cp-head { display: flex; gap: 14px; align-items: center; border-bottom: 2px solid #1565C0; padding-bottom: 10px; margin-bottom: 12px; }
  .cp-head img { width: 54px; height: 54px; border-radius: 10px; }
  .cp-head h1 { font-size: 18px; margin: 0; font-weight: 600; }
  .cp-head p { margin: 2px 0 0; color: #444; font-size: 13px; }
  .cp-ids { margin-left: auto; text-align: right; font-size: 12px; white-space: nowrap; }
  .cp-ids b { font-size: 13px; }
  .cp-section { margin-top: 14px; }
  .cp-grid, .cp-note, .cp-title { break-inside: avoid; }
  .cp-section h2 { break-after: avoid; font-size: 14px; font-weight: 600; margin: 0 0 6px; padding: 4px 8px; background: #E3F0FC; color: #0D47A1; border-radius: 4px; }
  .cp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; padding: 0 8px; }
  .cp-row { display: flex; gap: 8px; min-width: 0; }
  .cp-row .k { color: #555; flex: 0 0 120px; }
  .cp-row .v { font-weight: 500; word-break: break-word; min-width: 0; }
  .cp-full { grid-column: 1 / -1; }
  .cp-text { white-space: pre-wrap; word-break: break-word; padding: 0 8px; }
  .cp-title { font-size: 15px; font-weight: 600; padding: 0 8px; margin-bottom: 4px; }
  .cp-note { margin: 6px 8px 0; padding: 6px 10px; border-left: 3px solid #999; background: #f6f6f6; white-space: pre-wrap; }
  .cp-note.red { border-color: #C62828; background: #FDECEA; }
  .cp-note.green { border-color: #2E7D32; background: #E6F4E9; }
  table.cp-table { width: 100%; border-collapse: collapse; font-size: 12px; }
  .cp-table th, .cp-table td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; vertical-align: top; }
  .cp-table th { background: #f3f5f8; font-weight: 600; }
  .cp-table tr { break-inside: avoid; }
  .cp-table td.pre { white-space: pre-wrap; word-break: break-word; }
  .cp-muted { color: #777; padding: 0 8px; }
  .cp-sign { display: flex; justify-content: space-around; margin-top: 36px; break-inside: avoid; text-align: center; font-size: 13px; }
  .cp-sign div { width: 42%; }
  .cp-foot { margin-top: 18px; padding-top: 6px; border-top: 1px solid #ccc; font-size: 11px; color: #666; display: flex; justify-content: space-between; gap: 12px; }
  @media print {
    .no-print { display: none !important; }
    .cp-root { background: #fff; padding: 0; min-height: 0; }
    .cp-sheet { box-shadow: none; padding: 0; max-width: none; }
    .cp-section h2, .cp-note, .cp-table th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  @media (max-width: 640px) {
    .cp-grid { grid-template-columns: 1fr; }
    .cp-head { flex-wrap: wrap; }
    .cp-ids { margin-left: 0; text-align: left; }
  }
`;

const Row = ({ label, value, full }) => (
  <div className={`cp-row${full ? ' cp-full' : ''}`}>
    <span className="k">{label}</span>
    <span className="v">{value || '-'}</span>
  </div>
);

const eventLabel = (ev) => {
  if (ev.event_type === 'status_change') {
    const to = STATUS_LABELS[ev.to_status] || ev.to_status;
    return ev.from_status ? `เปลี่ยนสถานะ: ${STATUS_LABELS[ev.from_status] || ev.from_status} → ${to}` : `สถานะ: ${to}`;
  }
  if (ev.event_type === 'update') return ev.update_type === 'RESULT' ? 'ผลการดำเนินการ' : 'บันทึก';
  return ev.event_type;
};

const ComplaintPrintPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const printed = useRef(false);

  useEffect(() => {
    Promise.all([
      complaintApi.getById(id),
      complaintApi.getTimeline(id),
      complaintApi.getAttachments(id),
      complaintApi.getAssignments(id),
    ])
      .then(([cRes, tRes, aRes, asRes]) => {
        setData({
          complaint: cRes.data?.data?.complaint || cRes.data?.data,
          timeline: tRes.data?.data?.timeline || [],
          attachments: aRes.data?.data?.attachments || [],
          assignments: asRes.data?.data?.assignments || [],
        });
      })
      .catch((err) => setError(extractError(err, 'โหลดข้อมูลเรื่องร้องเรียนไม่สำเร็จ')));
  }, [id]);

  const handlePrint = () => {
    complaintApi.logPrint(id).catch(() => {}); // audit: เอกสารมีข้อมูลส่วนบุคคล
    window.print();
  };

  // เปิดหน้าต่างพิมพ์อัตโนมัติครั้งแรก เมื่อข้อมูลและฟอนต์พร้อม
  useEffect(() => {
    if (!data || printed.current) return;
    printed.current = true;
    const title = document.title;
    document.title = `เรื่องร้องเรียน ${data.complaint.complaint_number}`;
    (document.fonts?.ready || Promise.resolve()).then(() => setTimeout(handlePrint, 300));
    return () => { document.title = title; };
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <ErrorAlert message={error} />;
  if (!data) return <LoadingSpinner fullPage />;

  const { complaint: c, timeline, attachments, assignments } = data;
  const canSeePII = CAN_SEE_PII.includes(user?.role);
  const hideIdentity = !!c.is_anonymous && !canSeePII;

  return (
    <div className="cp-root">
      <style>{PRINT_CSS}</style>

      <div className="cp-toolbar no-print">
        <span>ตัวอย่างก่อนพิมพ์ — เลือกปลายทาง “บันทึกเป็น PDF” เพื่อได้ไฟล์ PDF</span>
        <button type="button" className="cp-btn" onClick={() => window.close()}>ปิด</button>
        <button type="button" className="cp-btn primary" onClick={handlePrint}>พิมพ์ / บันทึก PDF</button>
      </div>

      <div className="cp-sheet">
        <div className="cp-head">
          <img src={appIcon} alt="" />
          <div>
            <h1>แบบบันทึกเรื่องร้องเรียน / ร้องทุกข์</h1>
            <p>ศูนย์ดำรงธรรมจังหวัดศรีสะเกษ</p>
          </div>
          <div className="cp-ids">
            <div>เลขที่เอกสาร <b>{c.complaint_number}</b></div>
            <div>รหัสติดตาม <b>{c.tracking_code || '-'}</b></div>
            {c.reference_number && <div>เลขอ้างอิงหน่วยงาน <b>{c.reference_number}</b></div>}
          </div>
        </div>

        <section className="cp-section">
          <h2>ข้อมูลการรับเรื่อง</h2>
          <div className="cp-grid">
            <Row label="สถานะ" value={STATUS_LABELS[c.status] || c.status} />
            <Row label="ความสำคัญ" value={PRIORITY_LABELS[c.priority] || c.priority} />
            <Row label="วันที่รับเรื่อง" value={formatDateTime(c.created_at)} />
            <Row label="กำหนดแล้วเสร็จ" value={c.due_date ? formatDate(c.due_date) : 'ยังไม่กำหนด'} />
            <Row label="ช่องทางรับเรื่อง" value={c.channel_name} />
            <Row label="ที่มา" value={SOURCE_LABELS[c.source] || c.source} />
            <Row label="ประเภทงานบริการ" value={c.service_type_name} />
            <Row label="ลักษณะเรื่อง" value={c.complaint_nature_name} />
            <Row label="ประเภทเรื่อง" value={c.category_name} />
            <Row label="ผู้รับเรื่อง" value={c.received_by_name} />
            {c.closed_at && <Row label="วันที่ปิดเรื่อง" value={formatDateTime(c.closed_at)} />}
            {!!c.is_overdue && <Row label="หมายเหตุ" value="เกินกำหนด" />}
          </div>
        </section>

        <section className="cp-section">
          <h2>ข้อมูลผู้ร้อง</h2>
          {hideIdentity ? (
            <p className="cp-muted">เรื่องนี้ปกปิดตัวตน — ข้อมูลผู้ร้องถูกซ่อน</p>
          ) : (
            <div className="cp-grid">
              <Row label="ชื่อ-นามสกุล" value={c.complainant_name || (c.is_anonymous ? '[ปกปิดตัวตน]' : '-')} />
              <Row label="ประเภทผู้ร้อง" value={c.complainant_type_name} />
              {canSeePII && (
                <>
                  <Row label="เลขบัตรประชาชน" value={c.complainant_id_card} />
                  <Row label="เบอร์โทรศัพท์" value={c.complainant_phone} />
                  <Row label="อีเมล" value={c.complainant_email} />
                  <Row label="ปกปิดตัวตน" value={c.is_anonymous ? 'ใช่' : 'ไม่'} />
                  <Row label="ที่อยู่" value={c.complainant_address} full />
                </>
              )}
            </div>
          )}
        </section>

        <section className="cp-section">
          <h2>รายละเอียดเรื่องร้องเรียน</h2>
          <div className="cp-title">{c.title}</div>
          <div className="cp-text">{c.description}</div>
        </section>

        <section className="cp-section">
          <h2>จุดเกิดเหตุ</h2>
          <div className="cp-grid">
            <Row label="จังหวัด" value={c.province_name} />
            <Row label="อำเภอ" value={c.district_name} />
            <Row label="ตำบล" value={c.subdistrict_name} />
            <Row label="รหัสไปรษณีย์" value={c.postal_code} />
            <Row label="สถานที่" value={c.incident_address} full />
            {c.latitude && c.longitude && <Row label="พิกัด" value={`${c.latitude}, ${c.longitude}`} full />}
          </div>
        </section>

        {(c.rejection_reason || c.closed_summary) && (
          <section className="cp-section">
            <h2>ผลการพิจารณา</h2>
            {c.rejection_reason && <div className="cp-note red"><b>เหตุผลที่ไม่รับเรื่อง:</b> {c.rejection_reason}</div>}
            {c.closed_summary && <div className="cp-note green"><b>สรุปผลการดำเนินการ:</b> {c.closed_summary}</div>}
          </section>
        )}

        <section className="cp-section">
          <h2>การมอบหมายหน่วยงาน</h2>
          {assignments.length ? (
            <table className="cp-table">
              <thead>
                <tr><th style={{ width: '30%' }}>หน่วยงาน</th><th style={{ width: '14%' }}>สถานะ</th><th style={{ width: '18%' }}>วันที่มอบหมาย</th><th style={{ width: '14%' }}>กำหนดเสร็จ</th><th>หมายเหตุ</th></tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.agency_name}</td>
                    <td>{STATUS_LABELS[a.status] || a.status}</td>
                    <td>{formatDateTime(a.assigned_at)}</td>
                    <td>{a.due_date ? formatDate(a.due_date) : '-'}</td>
                    <td className="pre">{a.note || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="cp-muted">ยังไม่มีการมอบหมาย</p>}
        </section>

        <section className="cp-section">
          <h2>ประวัติการดำเนินการ</h2>
          {timeline.length ? (
            <table className="cp-table">
              <thead>
                <tr><th style={{ width: '17%' }}>วันที่</th><th style={{ width: '25%' }}>รายการ</th><th>รายละเอียด / หมายเหตุ</th><th style={{ width: '20%' }}>ผู้ดำเนินการ</th></tr>
              </thead>
              <tbody>
                {timeline.map((ev, i) => (
                  <tr key={`${ev.event_type}-${ev.id || i}`}>
                    <td>{formatDateTime(ev.created_at)}</td>
                    <td>{eventLabel(ev)}</td>
                    <td className="pre">{[ev.content, ev.note && `หมายเหตุ: ${ev.note}`].filter(Boolean).join('\n') || '-'}</td>
                    <td>{ev.actor_name || '-'}{ev.actor_agency ? ` (${ev.actor_agency})` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="cp-muted">ยังไม่มีประวัติ</p>}
        </section>

        <section className="cp-section">
          <h2>ไฟล์แนบ ({attachments.length})</h2>
          {attachments.length ? (
            <table className="cp-table">
              <thead>
                <tr><th style={{ width: '6%' }}>#</th><th>ชื่อไฟล์</th><th style={{ width: '22%' }}>วันที่แนบ</th><th style={{ width: '22%' }}>ผู้แนบ</th></tr>
              </thead>
              <tbody>
                {attachments.map((f, i) => (
                  <tr key={f.id}>
                    <td>{i + 1}</td>
                    <td style={{ wordBreak: 'break-all' }}>{f.file_name}</td>
                    <td>{formatDateTime(f.created_at)}</td>
                    <td>{f.uploaded_by_name || (f.uploaded_by_citizen ? 'ผู้ร้อง' : '-')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="cp-muted">ไม่มีไฟล์แนบ</p>}
        </section>

        <div className="cp-sign">
          <div>
            ลงชื่อ ........................................................<br />
            (........................................................)<br />
            เจ้าหน้าที่ผู้รับผิดชอบ
          </div>
          <div>
            ลงชื่อ ........................................................<br />
            (........................................................)<br />
            ผู้ตรวจสอบ / หัวหน้า
          </div>
        </div>

        <div className="cp-foot">
          <span>เอกสารนี้มีข้อมูลส่วนบุคคล ใช้เพื่อการปฏิบัติงานเท่านั้น</span>
          <span>พิมพ์โดย {user?.full_name || '-'} · {formatDateTime(new Date())}</span>
        </div>
      </div>
    </div>
  );
};

export default ComplaintPrintPage;
