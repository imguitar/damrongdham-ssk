import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import ComplaintForm from '../../components/complaints/ComplaintForm';
import ErrorAlert from '../../components/common/ErrorAlert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import useMasterData from '../../hooks/useMasterData';
import * as complaintApi from '../../api/complaintApi';

const ComplaintEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const masterData = useMasterData();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    complaintApi.getById(id)
      .then((res) => {
        const c = res.data?.data?.complaint || res.data?.data;
        setForm({
          title: c.title || '',
          description: c.description || '',
          service_type_id: c.service_type_id || '',
          complaint_nature_id: c.complaint_nature_id || '',
          complainant_type_id: c.complainant_type_id || '',
          channel_id: c.channel_id || '',
          category_id: c.category_id || '',
          priority: c.priority || 'MEDIUM',
          is_anonymous: Boolean(c.is_anonymous),
          complainant_name: c.complainant_name || '',
          complainant_id_card: c.complainant_id_card || '',
          complainant_phone: c.complainant_phone || '',
          complainant_address: c.complainant_address || '',
          complainant_email: c.complainant_email || '',
          province_id: c.province_id || '',
          district_id: c.district_id || '',
          subdistrict_id: c.subdistrict_id || '',
          postal_code: c.postal_code || '',
          incident_address: c.incident_address || '',
          latitude: c.latitude || '',
          longitude: c.longitude || '',
        });
      })
      .catch(() => setErrorMsg('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [id]);

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

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const toNum = (v) => (v !== '' && v != null ? Number(v) || undefined : undefined);
      const payload = {
        ...form,
        service_type_id: toNum(form.service_type_id),
        complaint_nature_id: toNum(form.complaint_nature_id),
        complainant_type_id: toNum(form.complainant_type_id),
        channel_id: toNum(form.channel_id),
        category_id: toNum(form.category_id),
        province_id: toNum(form.province_id),
        district_id: toNum(form.district_id),
        subdistrict_id: toNum(form.subdistrict_id),
        latitude: form.latitude !== '' && form.latitude != null ? Number(form.latitude) : undefined,
        longitude: form.longitude !== '' && form.longitude != null ? Number(form.longitude) : undefined,
      };
      await complaintApi.update(id, payload);
      navigate(`/complaints/${id}`);
    } catch (err) {
      setErrorMsg(err?.response?.data?.error?.message || 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => navigate(`/complaints/${id}`)}>
          กลับ
        </Button>
        <Typography variant="h5" fontWeight={700}>แก้ไขเรื่องร้องเรียน</Typography>
      </Box>

      {errorMsg && <ErrorAlert message={errorMsg} sx={{ mb: 2 }} />}

      {form && (
        <Card>
          <CardContent sx={{ p: 3 }}>
            <ComplaintForm
              form={form}
              setForm={setForm}
              masterData={masterData}
              errors={errors}
              disabled={saving || masterData.loading}
              showComplainantInfo
              showAnonymous
            />
          </CardContent>
        </Card>
      )}

      <Box display="flex" gap={2} mt={3}>
        <Button variant="outlined" onClick={() => navigate(`/complaints/${id}`)} disabled={saving}>
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving || masterData.loading}
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
        </Button>
      </Box>
    </Box>
  );
};

export default ComplaintEditPage;
