import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue with webpack/vite
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Default center: ศรีสะเกษ
const DEFAULT_LAT = 15.1186;
const DEFAULT_LNG = 104.3197;

const LocationMapPicker = ({ latitude, longitude, onChange, readOnly = false }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const readOnlyRef = useRef(readOnly);
  const onChangeRef = useRef(onChange);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Keep refs current so click handler never captures stale values
  useEffect(() => { readOnlyRef.current = readOnly; }, [readOnly]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const lat = parseFloat(latitude) || null;
  const lng = parseFloat(longitude) || null;

  useEffect(() => {
    if (mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView(
      [lat || DEFAULT_LAT, lng || DEFAULT_LNG],
      lat ? 15 : 12
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    if (lat && lng) {
      markerRef.current = L.marker([lat, lng]).addTo(map);
    }

    // Always register click; check readOnlyRef at call-time (not capture-time)
    // This prevents the bug where readOnly=true on first render (while masterData
    // loads) causes the handler to be skipped permanently.
    map.on('click', (e) => {
      if (readOnlyRef.current) return;
      const { lat: newLat, lng: newLng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([newLat, newLng]);
      } else {
        markerRef.current = L.marker([newLat, newLng]).addTo(map);
      }
      onChangeRef.current?.({ latitude: newLat.toFixed(7), longitude: newLng.toFixed(7) });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external lat/lng changes (e.g. GPS)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !lat || !lng) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng]).addTo(map);
    }
    map.setView([lat, lng], 15);
  }, [lat, lng]);

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: gLat, longitude: gLng } = pos.coords;
        onChangeRef.current?.({ latitude: gLat.toFixed(7), longitude: gLng.toFixed(7) });
        setGpsLoading(false);
      },
      () => {
        alert('ไม่สามารถระบุตำแหน่งได้ กรุณาอนุญาตการเข้าถึง GPS');
        setGpsLoading(false);
      }
    );
  };

  return (
    <Box>
      {!readOnly && (
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<GpsFixedIcon />}
            onClick={handleGPS}
            disabled={gpsLoading}
          >
            {gpsLoading ? 'กำลังระบุตำแหน่ง...' : 'ใช้ GPS ปัจจุบัน'}
          </Button>
          {lat && lng && (
            <Typography variant="caption" color="text.secondary">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </Typography>
          )}
          <Typography variant="caption" color="text.disabled">
            (หรือคลิกบนแผนที่เพื่อเลือกพิกัด)
          </Typography>
        </Box>
      )}

      {readOnly && lat && lng && (
        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
          พิกัด: {lat}, {lng}
        </Typography>
      )}

      <Box
        ref={mapRef}
        sx={{
          height: 280,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          cursor: readOnly ? 'default' : 'crosshair',
        }}
      />
    </Box>
  );
};

export default LocationMapPicker;
