import { useEffect, useState } from 'react';
import * as masterDataApi from '../api/masterDataApi';
import * as publicApi from '../api/publicApi';

// Loads all master data needed for complaint forms
const useMasterData = ({ usePublic = false } = {}) => {
  const api = usePublic ? publicApi : masterDataApi;

  const [categories, setCategories] = useState([]);
  const [channels, setChannels] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [complaintNatures, setComplaintNatures] = useState([]);
  const [complainantTypes, setComplainantTypes] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const extract = (res, key) => res?.data?.data?.[key] || res?.data?.data || [];

    Promise.all([
      api.getCategories?.() || api.listCategories?.(),
      api.getChannels?.() || api.listChannels?.(),
      api.getServiceTypes?.() || api.listServiceTypes?.(),
      api.getComplaintNatures?.() || api.listComplaintNatures?.(),
      api.getComplainantTypes?.() || api.listComplainantTypes?.(),
      api.getProvinces?.() || api.listProvinces?.(),
    ])
      .then(([catRes, chRes, stRes, cnRes, ctRes, provRes]) => {
        setCategories(extract(catRes, 'categories'));
        setChannels(extract(chRes, 'channels'));
        setServiceTypes(extract(stRes, 'service_types'));
        setComplaintNatures(extract(cnRes, 'complaint_natures'));
        setComplainantTypes(extract(ctRes, 'complainant_types'));
        setProvinces(extract(provRes, 'provinces'));
      })
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const fetchDistricts = async (province_id) => {
    if (usePublic) {
      const res = await publicApi.getDistricts();
      const all = res?.data?.data?.districts || [];
      return all.filter((d) => d.province_id === province_id);
    }
    const res = await masterDataApi.listDistricts(province_id);
    return res?.data?.data?.districts || [];
  };

  const fetchSubdistricts = async (district_id) => {
    const res = await masterDataApi.listSubdistricts(district_id);
    return res?.data?.data?.subdistricts || [];
  };

  return {
    categories,
    channels,
    serviceTypes,
    complaintNatures,
    complainantTypes,
    provinces,
    fetchDistricts,
    fetchSubdistricts,
    loading,
    error,
  };
};

export default useMasterData;
