import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import SaveIcon from '@mui/icons-material/Save';
import FileUpload from '../../components/common/FileUpload';
import ComplaintForm from '../../components/complaints/ComplaintForm';
import useMasterData from '../../hooks/useMasterData';
import * as publicApi from '../../api/publicApi';
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

const nameOf = (list, id) => list?.find((x) => String(x.id) === String(id))?.name || '';

const PublicComplaintPage = () => {
  const navigate = useNavigate();
  const masterData = useMasterData({ usePublic: true });
  const [form, setForm] = useState(INITIAL);
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
        source: 'PUBLIC',
      };
      const res = await publicApi.submitComplaint(payload);
      const trackingCode = res.data?.data?.tracking_code;
      const complaintId = res.data?.data?.id;

      let uploadedNames = [];
      if (pendingFiles.length && complaintId) {
        const uploaded = await Promise.all(
          pendingFiles.map((file) => {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('complaint_id', complaintId);
            return publicApi.uploadAttachment(fd).then(() => file.name).catch(() => null);
          })
        );
        uploadedNames = uploaded.filter(Boolean);
      }

      // สำเนาข้อมูลที่ยื่น สำหรับให้ผู้ร้องพิมพ์เก็บไว้ในหน้าสำเร็จ (ไม่ดึงจาก API สาธารณะ)
      const [districts, subdistricts] = await Promise.all([
        form.province_id ? masterData.fetchDistricts(Number(form.province_id)).catch(() => []) : [],
        form.district_id ? masterData.fetchSubdistricts(form.district_id).catch(() => []) : [],
      ]);
      const receipt = {
        ...form,
        submitted_at: new Date().toISOString(),
        complainant_type_name: nameOf(masterData.complainantTypes, form.complainant_type_id),
        category_name: nameOf(masterData.categories, form.category_id),
        province_name: nameOf(masterData.provinces, form.province_id),
        district_name: nameOf(districts, form.district_id),
        subdistrict_name: nameOf(subdistricts, form.subdistrict_id),
        attachments: uploadedNames,
      };

      toastSuccess('ส่งเรื่องร้องเรียนสำเร็จ');
      navigate('/public/success', { state: { tracking_code: trackingCode, receipt } });
    } catch (err) {
      alertError(err, { title: 'ส่งเรื่องร้องเรียนไม่สำเร็จ' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth={800} mx="auto">
      <Button
        component={RouterLink}
        to="/citizen"
        variant="outlined"
        size="small"
        startIcon={<HomeIcon />}
        sx={{ mb: 2 }}
      >
        กลับหน้าหลัก
      </Button>

      <Box textAlign="center" mb={3}>
        <Typography variant="h5" fontWeight={700}>ยื่นเรื่องร้องเรียน</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Sisaket E-Complaint Management System — ไม่ต้องสมัครสมาชิก
        </Typography>
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
