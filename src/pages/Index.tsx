import { Navigate } from 'react-router-dom';

// Index page redirects to dashboard
const Index = () => {
  return <Navigate to="/dashboard" replace />;
};

export default Index;
