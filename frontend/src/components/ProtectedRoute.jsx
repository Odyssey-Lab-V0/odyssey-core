import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useEffect } from "react";
import { initUserData } from "../lib/store";

const ProtectedRoute = ({ children }) => {
  const { session } = useAuth();
  const loc = useLocation();
  useEffect(() => {
    if (session?.user?.id) initUserData(session.user.id);
  }, [session?.user?.id]);
  if (!session) return <Navigate to="/login" state={{ from: loc }} replace />;
  return children;
};

export default ProtectedRoute;
