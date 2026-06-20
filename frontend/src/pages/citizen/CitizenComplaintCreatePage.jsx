import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import ComplaintForm from '../../components/complaints/ComplaintForm';
import FileUpload from '../../components/common/FileUpload';
import ErrorAlert from '../../components/common/ErrorAlert';
import useMasterData from '../../hooks/useMasterData';
import * as citizenApi from '../../api/citizenApi';

const INITIAL = {
  title: '', description: '',
  service_type_id: '', complaint_nature_id: '', complainant_type_id: '',
  channel_id: '', category_id: '', priority: 'MEDIUM',
  is_anonymous: false,
  complainant_phone: '',
  province_id: '', district_id: '', subdistrict_id: '',
  postal_code: '', incident_address: '', latitude: '', longitude: '',
};

const CitizenComplaintCreatePage = () => {
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
      };
      const res = await citizenApi.submitComplaint(payload);
      const complaintNumber = res.data?.data?.complaint_number;

      if (pendingFiles.length) {
        await Promise.all(
          pendingFiles.map((file) => {
            const fd = new FormData();
            fd.append('file', file);
            return citizenApi.uploadAttachment(fd).catch(() => {});
          })
        );
      }

      navigate(`/citizen/complaints/${complaintNumber}`);
    } catch (err) {
      setErrorMsg(err?.response?.data?.error?.message || 'เกิดข้อผิดพลาด');
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
