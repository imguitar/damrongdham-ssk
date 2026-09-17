import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import ComplaintForm from '../../components/complaints/ComplaintForm';
import FileUpload from '../../components/common/FileUpload';
import useMasterData from '../../hooks/useMasterData';
import { useCitizenAuth } from '../../contexts/CitizenAuthContext';
import * as citizenApi from '../../api/citizenApi';
import { alertError, alertWarning, toastSuccess } from '../../utils/alert';

const INITIAL = {
  title: '', description: '',
  complainant_type_id: '', category_id: '',
  is_anonymous: false,
  complainant_name: '', complainant_id_card: '', complainant_phone: '',
  complainant_address: '', complainant_email: '',
  province_id: '', district_id: '', subdistrict_id: '',
  postal_code: '', incident_address: '', latitude: '', longitude: '',
};

// ข้อมูลผู้ร้องที่ดึงจากบัญชีที่ login
const profileToComplainant = (c) => ({
  complainant_name: c?.full_name || '',
  complainant_id_card: c?.id_card || '',
  complainant_phone: c?.phone || '',
  complainant_address: c?.address || '',
  complainant_email: c?.email || '',
});
const EMPTY_COMPLAINANT = profileToComplainant(null);

const CitizenComplaintCreatePage = () => {
  const navigate = useNavigate();
  const { citizen } = useCitizenAuth();
  const masterData = useMasterData({ usePublic: true });
  const [useProfile, setUseProfile] = useState(true);
  const [form, setForm] = useState(() => ({ ...INITIAL, ...profileToComplainant(citizen) }));

  // ใช้ข้อมูลจากบัญชี: ล็อกเฉพาะช่องที่มีข้อมูลในโปรไฟล์ (ช่องว่างยังกรอกเองได้)
  const profileValues = profileToComplainant(citizen);
  const lockedFields = useProfile
    ? Object.keys(profileValues).filter((k) => profileValues[k])
    : [];

  const handleToggleOwnInfo = (e) => {
    const manual = e.target.checked;
    setUseProfile(!manual);
    setForm((p) => ({ ...p, ...(manual ? EMPTY_COMPLAINANT : profileToComplainant(citizen)) }));
  };
  const [pendingFiles, setPendingFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.title?.trim()) e.title = 'กรุณาระบุหัวเรื่อง';
    if (!form.description?.trim()) e.description = 'กรุณาระบุรายละเอียด';
    if (!form.complainant_type_id) e.complainant_type_id = 'กรุณาเลือกประเภทผู้ร้อง';
    if (!form.complainant_phone?.trim()) e.complainant_phone = 'กรุณาระบุเบอร์โทรศัพท์';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      alertWarning('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ช่องที่มีเครื่องหมายแจ้งเตือนสีแดง)');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        complainant_type_id: Number(form.complainant_type_id) || undefined,
        category_id: Number(form.category_id) || undefined,
        province_id: Number(form.province_id) || undefined,
        district_id: Number(form.district_id) || undefined,
        subdistrict_id: Number(form.subdistrict_id) || undefined,
      };
      const res = await citizenApi.submitComplaint(payload);
      const complaintNumber = res.data?.data?.complaint?.complaint_number;
      const complaintId = res.data?.data?.complaint?.id;

      if (pendingFiles.length && complaintId) {
        await Promise.all(
          pendingFiles.map((file) => {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('complaint_id', complaintId);
            return citizenApi.uploadAttachment(fd).catch(() => {});
          })
        );
      }

      toastSuccess('ส่งเรื่องร้องเรียนสำเร็จ');
      navigate(`/citizen/complaints/${complaintNumber}`);
    } catch (err) {
      alertError(err, { title: 'ส่งเรื่องร้องเรียนไม่สำเร็จ' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => navigate('/citizen/complaints')}>
          กลับ
        </Button>
        <Typography variant="h5" fontWeight={700}>ยื่นเรื่องร้องเรียนใหม่</Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 3 }}>
          <ComplaintForm
            form={form}
            setForm={setForm}
            masterData={masterData}
            errors={errors}
            disabled={loading || masterData.loading}
            showComplainantInfo
            showAnonymous
            showClassification={false}
            defaultComplainantType="บุคคลธรรมดา"
            lockedFields={lockedFields}
            complainantExtra={
              <FormControlLabel
                sx={{ mt: -1.5 }}
                control={
                  <Checkbox
                    checked={!useProfile}
                    onChange={handleToggleOwnInfo}
                    disabled={loading}
                  />
                }
                label="ไม่ใช้ข้อมูลจากบัญชีที่เข้าสู่ระบบ (กรอกข้อมูลผู้ร้องเอง)"
              />
            }
          />
          <Divider sx={{ my: 3 }} />
          <Typography variant="subtitle1" fontWeight={700} color="primary" mb={1}>ไฟล์แนบ</Typography>
          <FileUpload
            files={pendingFiles}
            onAdd={(f) => setPendingFiles((p) => [...p, ...f])}
            onRemove={(i) => setPendingFiles((p) => p.filter((_, idx) => idx !== i))}
            disabled={loading}
          />
        </CardContent>
      </Card>

      <Box display="flex" gap={2} mt={3}>
        <Button variant="outlined" onClick={() => navigate('/citizen/complaints')} disabled={loading}>ยกเลิก</Button>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={handleSubmit}
          disabled={loading || masterData.loading}
        >
          {loading ? 'กำลังส่งเรื่อง...' : 'ส่งเรื่องร้องเรียน'}
        </Button>
      </Box>
    </Box>
  );
};

export default CitizenComplaintCreatePage;
