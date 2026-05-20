import { createBrowserRouter } from "react-router-dom";
import { PublicLayout } from "../components/layout/PublicLayout";
import { AdminLayout } from "../components/layout/AdminLayout";
import { PublicApplicationForm } from "../features/applications/PublicApplicationForm";
import { LoginPage } from "../features/admin/LoginPage";
import { DashboardPage } from "../features/admin/DashboardPage";
import { ProtectedRoute } from "./ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <PublicApplicationForm /> },
    ],
  },
  {
    path: "/admin/login",
    element: <LoginPage />,
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
    ],
  },
]);
