import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCitizenAuth } from '../contexts/CitizenAuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const COMPLETE_PROFILE_PATH = '/citizen/complete-profile';

const CitizenProtectedRoute = () => {
  const { citizen, isLoading } = useCitizenAuth();
  const location = useLocation();
  if (isLoading) return <LoadingSpinner />;
  if (!citizen) return <Navigate to="/citizen/login" replace />;
  // Provisional (LINE) accounts must finish profile + consent before anything else
  if (citizen.is_provisional && location.pathname !== COMPLETE_PROFILE_PATH) {
    return <Navigate to={COMPLETE_PROFILE_PATH} replace />;
  }
  return <Outlet />;
};

export default CitizenProtectedRoute;
