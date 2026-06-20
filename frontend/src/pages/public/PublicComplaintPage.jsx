import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import SaveIcon from '@mui/icons-material/Save';
import ErrorAlert from '../../components/common/ErrorAlert';
import FileUpload from '../../components/common/FileUpload';
import ComplaintForm from '../../components/complaints/ComplaintForm';
import useMasterData from '../../hooks/useMasterData';
import * as publicApi from '../../api/publicApi';

const INITIAL = {
  title: '', description: '',
  service_type_id: '', complaint_nature_id: '', complainant_type_id: '',
  channel_id: '', category_id: '', priority: 'MEDIUM',
  is_anonymous: false,
  complainant_name: '', complainant_id_card: '', complainant_phone: '',
  complainant_address: '', complainant_email: '',
  province_id: '', district_id: '', subdistrict_id: '',
  postal_code: '', incident_address: '', latitude: '', longitude: '',
};

const PublicComplaintPage = () => {
  const navigate = useNavigate();
  const masterData = useMasterData({ usePublic: true });
  const [form, setForm] = useState(INITIAL);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');

  const validate = () => {
    const e = {};
    if (!form.title?.trim()) e.title = 'กรุณาระบุหัวเรื่อง';
    if (!form.description?.trim()) e.description = 'กรุณาระบุรายละเอียด';
    if (!form.service_type_id) e.service_type_id = 'กรุณาเลือกประเภทงานบริการ';
    if (!form.complaint_nature_id) e.complaint_nature_id = 'กรุณาเลือกลักษณะเรื่อง';
    if (!form.complainant_type_id) e.complainant_type_id = 'กรุณาเลือกประเภทผู้ร้อง';
    if (!form.channel_id) e.channel_id = 'กรุณาเลือกช่องทางรับเรื่อง';
    if (!form.complainant_phone?.trim()) e.complainant_phone = 'กรุณาระบุเบอร์โทรศัพท์';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        ...form,
        service_type_id: Number(form.service_type_id) || undefined,
        complaint_nature_id: Number(form.complaint_nature_id) || undefined,
        complainant_type_id: Number(form.complainant_type_id) || undefined,
        channel_id: Number(form.channel_id) || undefined,
        category_id: Number(form.category_id) || undefined,
        province_id: Number(form.province_id) || undefined,
        district_id: Number(form.district_id) || undefined,
        subdistrict_id: Number(form.subdistrict_id) || undefined,
        source: 'PUBLIC',
      };
      const res = await publicApi.submitComplaint(payload);
      const complaintNumber = res.data?.data?.complaint_number;

      if (pendingFiles.length) {
        await Promise.all(
          pendingFiles.map((file) => {
            const fd = new FormData();
            fd.append('file', file);
            return publicApi.uploadAttachment(fd).catch(() => {});
          })
        );
      }

      navigate('/public/success', { state: { complaint_number: complaintNumber } });
    } catch (err) {
      setErrorMsg(err?.response?.data?.error?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={800} mx="auto">
      <Box textAlign="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>ยื่นเรื่องร้องเรียน</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          ศูนย์ดำรงธรรมจังหวัดศรีสะเกษ — ไม่ต้องสมัครสมาชิก
        </Typography>
      </Box>

      {errorMsg && <ErrorAlert message={errorMsg} sx={{ mb: 2 }} />}

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
          />

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" fontWeight={700} color="primary" mb={1}>
            ไฟล์แนบหลักฐาน (ไม่บังคับ)
          </Typography>
          <FileUpload
            files={pendingFiles}
            onAdd={(files) => setPendingFiles((p) => [...p, ...files])}
            onRemove={(idx) => setPendingFiles((p) => p.filter((_, i) => i !== idx))}
            disabled={loading}
          />
        </CardContent>
      </Card>

      <Box display="flex" gap={2} mt={3} justifyContent="flex-end">
        <Button
          variant="contained"
          size="large"
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

export default PublicComplaintPage;
