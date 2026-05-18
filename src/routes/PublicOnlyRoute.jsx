import { useContext } from "react";
import { Navigate } from "react-router-dom";
import AuthContext from "../auth/authContext";

const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

export default PublicOnlyRoute;
