import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LocationMapPicker from '../common/LocationMapPicker';

// Separate selects to avoid re-render focus loss
const SelectField = ({ label, name, value, onChange, options = [], required, error, helperText, disabled }) => (
  <FormControl fullWidth required={required} error={error} size="small">
    <InputLabel>{label}</InputLabel>
    <Select name={name} value={value ?? ''} label={label} onChange={onChange} disabled={disabled}>
      {!required && <MenuItem value="">-- ไม่ระบุ --</MenuItem>}
      {options.map((o) => (
        <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
      ))}
    </Select>
    {helperText && <FormHelperText>{helperText}</FormHelperText>}
  </FormControl>
);

const ComplaintForm = ({
  form,
  setForm,
  masterData,
  errors = {},
  disabled = false,
  showComplainantInfo = true,
  showAnonymous = false,
}) => {
  const [districts, setDistricts] = useState([]);
  const [subdistricts, setSubdistricts] = useState([]);

  const md = masterData || {};

  // Load districts when province changes
  useEffect(() => {
    if (!form.province_id) { setDistricts([]); setSubdistricts([]); return; }
    md.fetchDistricts?.(form.province_id).then(setDistricts).catch(() => {});
  }, [form.province_id]); // eslint-disable-line

  // Load subdistricts when district changes
  useEffect(() => {
    if (!form.district_id) { setSubdistricts([]); return; }
    md.fetchSubdistricts?.(form.district_id).then(setSubdistricts).catch(() => {});
  }, [form.district_id]); // eslint-disable-line

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      // Reset dependent selects
      ...(name === 'province_id' ? { district_id: '', subdistrict_id: '' } : {}),
      ...(name === 'district_id' ? { subdistrict_id: '' } : {}),
    }));
  };

  const handleMapChange = ({ latitude, longitude }) => {
    setForm((prev) => ({ ...prev, latitude, longitude }));
  };

  return (
    <Box display="flex" flexDirection="column" gap={2.5}>
      {/* ── ข้อมูลเรื่องร้องเรียน ── */}
      <Typography variant="subtitle1" fontWeight={700} color="primary">
        ข้อมูลเรื่องร้องเรียน
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            label="หัวเรื่อง"
            name="title"
            value={form.title ?? ''}
            onChange={handleChange}
            disabled={disabled}
            error={Boolean(errors.title)}
            helperText={errors.title}
            size="small"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            required
            multiline
            minRows={3}
            label="รายละเอียด"
            name="description"
            value={form.description ?? ''}
            onChange={handleChange}
            disabled={disabled}
            error={Boolean(errors.description)}
            helperText={errors.description}
            size="small"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <SelectField
            label="ประเภทงานบริการ *"
            name="service_type_id"
            value={form.service_type_id}
            onChange={handleChange}
            options={md.serviceTypes || []}
            required
            error={Boolean(errors.service_type_id)}
            helperText={errors.service_type_id}
            disabled={disabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <SelectField
            label="ลักษณะเรื่อง *"
            name="complaint_nature_id"
            value={form.complaint_nature_id}
            onChange={handleChange}
            options={md.complaintNatures || []}
            required
            error={Boolean(errors.complaint_nature_id)}
            helperText={errors.complaint_nature_id}
            disabled={disabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <SelectField
            label="ช่องทางรับเรื่อง *"
            name="channel_id"
            value={form.channel_id}
            onChange={handleChange}
            options={md.channels || []}
            required
            error={Boolean(errors.channel_id)}
            helperText={errors.channel_id}
            disabled={disabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <SelectField
            label="ประเภทเรื่อง (หมวดหมู่)"
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            options={md.categories || []}
            disabled={disabled}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>ความสำคัญ</InputLabel>
            <Select
              name="priority"
              value={form.priority ?? 'MEDIUM'}
              label="ความสำคัญ"
              onChange={handleChange}
              disabled={disabled}
            >
              <MenuItem value="LOW">ต่ำ</MenuItem>
              <MenuItem value="MEDIUM">ปานกลาง</MenuItem>
              <MenuItem value="HIGH">สูง</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Divider />

      {/* ── ข้อมูลผู้ร้องเรียน ── */}
      {showComplainantInfo && (
        <>
          <Typography variant="subtitle1" fontWeight={700} color="primary">
            ข้อมูลผู้ร้องเรียน
          </Typography>

          {showAnonymous && (
            <FormControlLabel
              control={
                <Checkbox
                  name="is_anonymous"
                  checked={Boolean(form.is_anonymous)}
                  onChange={handleChange}
                  disabled={disabled}
                />
              }
              label="ปกปิดตัวตน (ชื่อ-ที่อยู่ จะไม่แสดงต่อเจ้าหน้าที่)"
            />
          )}

          {form.is_anonymous && (
            <Alert severity="info" sx={{ mt: -1 }}>
              เรื่องแบบปกปิดตัวตน — กรุณาระบุเบอร์โทรศัพท์เพื่อรับผลการดำเนินการ
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <SelectField
                label="ประเภทผู้ร้องเรียน *"
                name="complainant_type_id"
                value={form.complainant_type_id}
                onChange={handleChange}
                options={md.complainantTypes || []}
                required
                error={Boolean(errors.complainant_type_id)}
                helperText={errors.complainant_type_id}
                disabled={disabled}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label="เบอร์โทรศัพท์ผู้ร้อง"
                name="complainant_phone"
                value={form.complainant_phone ?? ''}
                onChange={handleChange}
                disabled={disabled}
                error={Boolean(errors.complainant_phone)}
                helperText={errors.complainant_phone || 'บังคับกรอก (รวมกรณีปกปิดตัวตน)'}
                size="small"
                inputProps={{ maxLength: 20 }}
              />
            </Grid>

            {!form.is_anonymous && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="ชื่อ-นามสกุลผู้ร้อง"
                    name="complainant_name"
                    value={form.complainant_name ?? ''}
                    onChange={handleChange}
                    disabled={disabled}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="เลขบัตรประชาชน"
                    name="complainant_id_card"
                    value={form.complainant_id_card ?? ''}
                    onChange={handleChange}
                    disabled={disabled}
                    size="small"
                    inputProps={{ maxLength: 13 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="อีเมล"
                    name="complainant_email"
                    type="email"
                    value={form.complainant_email ?? ''}
                    onChange={handleChange}
                    disabled={disabled}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label="ที่อยู่ผู้ร้อง"
                    name="complainant_address"
                    value={form.complainant_address ?? ''}
                    onChange={handleChange}
                    disabled={disabled}
                    size="small"
                  />
                </Grid>
              </>
            )}
          </Grid>

          <Divider />
        </>
      )}

      {/* ── จุดเกิดเหตุ ── */}
      <Typography variant="subtitle1" fontWeight={700} color="primary">
        จุดเกิดเหตุ (ไม่บังคับ)
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <SelectField
            label="จังหวัด"
            name="province_id"
            value={form.province_id}
            onChange={handleChange}
            options={md.provinces || []}
            disabled={disabled}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <SelectField
            label="อำเภอ"
            name="district_id"
            value={form.district_id}
            onChange={handleChange}
            options={districts}
            disabled={disabled || !form.province_id}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <SelectField
            label="ตำบล"
            name="subdistrict_id"
            value={form.subdistrict_id}
            onChange={handleChange}
            options={subdistricts}
            disabled={disabled || !form.district_id}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="รหัสไปรษณีย์"
            name="postal_code"
            value={form.postal_code ?? ''}
            onChange={handleChange}
            disabled={disabled}
            size="small"
            inputProps={{ maxLength: 5 }}
          />
        </Grid>
        <Grid item xs={12} sm={8}>
          <TextField
            fullWidth
            label="สถานที่เกิดเหตุ (ที่อยู่โดยละเอียด)"
            name="incident_address"
            value={form.incident_address ?? ''}
            onChange={handleChange}
            disabled={disabled}
            size="small"
          />
        </Grid>
      </Grid>

      <Box>
        <Typography variant="body2" color="text.secondary" mb={1}>
          ปักหมุดบนแผนที่
        </Typography>
        <LocationMapPicker
          latitude={form.latitude}
          longitude={form.longitude}
          onChange={handleMapChange}
          readOnly={disabled}
        />
      </Box>
    </Box>
  );
};

export default ComplaintForm;
