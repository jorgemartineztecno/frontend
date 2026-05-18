import LoginPage from "../auth/LoginPage";
import RegisterPage from "../auth/RegisterPage";
import Support from "./support";
import PublicOnlyRoute from "./PublicOnlyRoute";

const PublicRoutes = [
  {
    path: "/login",
    element: (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/register",
    element: (
      <PublicOnlyRoute>
        <RegisterPage />
      </PublicOnlyRoute>
    ),
  },
  { path: "/support", element: <Support /> },
];

export default PublicRoutes;
