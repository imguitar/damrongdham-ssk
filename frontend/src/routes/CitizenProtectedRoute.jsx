import { Navigate, Outlet } from 'react-router-dom';
import { useCitizenAuth } from '../contexts/CitizenAuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CitizenProtectedRoute = () => {
  const { citizen, isLoading } = useCitizenAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!citizen) return <Navigate to="/citizen/login" replace />;
  return <Outlet />;
};

export default CitizenProtectedRoute;
