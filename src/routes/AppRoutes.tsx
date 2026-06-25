import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import { PublicLayout } from "../components/layout/PublicLayout";
import { AdminLayout } from "../components/layout/AdminLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { MaintenanceGuard } from "../components/security/MaintenanceGuard";
import { PageLoader } from "../components/ui/PageLoader";

const PublicApplicationForm = lazy(() => import("../features/applications/PublicApplicationForm").then(module => ({ default: module.PublicApplicationForm })));
const LoginPage = lazy(() => import("../features/admin/LoginPage").then(module => ({ default: module.LoginPage })));
const DashboardPage = lazy(() => import("../features/admin/DashboardPage").then(module => ({ default: module.DashboardPage })));


export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: (
        <MaintenanceGuard>
          <PublicLayout />
        </MaintenanceGuard>
      ),
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={<PageLoader text="جاري تحميل نموذج التسجيل..." />}>
              <PublicApplicationForm />
            </Suspense>
          ),
        },
      ],
    },
    {
      path: "/admin/login",
      element: (
        <Suspense fallback={<PageLoader text="جاري تحميل صفحة الدخول..." />}>
          <LoginPage />
        </Suspense>
      ),
    },
    {
      path: "/admin",
      element: (
        <ProtectedRoute>
          <MaintenanceGuard>
            <AdminLayout />
          </MaintenanceGuard>
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: (
            <Suspense fallback={<PageLoader text="جاري تحميل لوحة التحكم..." />}>
              <DashboardPage />
            </Suspense>
          ),
        },
      ],
    },
  ],
  {
    basename: "/aytam",
  }
);