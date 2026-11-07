import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { LoadingState } from "./components/common/LoadingState";
import { ToastViewport } from "./components/common/ToastViewport";
import { useAuthStore } from "./store/authStore";

const AppLayout = lazy(() =>
  import("./components/layout/AppLayout").then((module) => ({ default: module.AppLayout })),
);
const AuthPage = lazy(() =>
  import("./pages/AuthPage").then((module) => ({ default: module.AuthPage })),
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage })),
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((module) => ({ default: module.ProfilePage })),
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((module) => ({ default: module.SettingsPage })),
);
const TaskBoardPage = lazy(() =>
  import("./pages/TaskBoardPage").then((module) => ({ default: module.TaskBoardPage })),
);
const TaskDetailsPage = lazy(() =>
  import("./pages/TaskDetailsPage").then((module) => ({ default: module.TaskDetailsPage })),
);

function ProtectedRoutes() {
  const status = useAuthStore((state) => state.status);
  if (status === "loading") {
    return <LoadingState />;
  }
  if (status !== "authenticated") {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

function PublicRoutes() {
  const status = useAuthStore((state) => state.status);
  if (status === "loading") {
    return <LoadingState />;
  }
  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

function AppRoutes() {
  const initialize = useAuthStore((state) => state.initialize);
  const initializationError = useAuthStore((state) => state.initializationError);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  return (
    <>
      {initializationError && (
        <div className="bg-rose-700 px-4 py-2 text-center text-sm text-white" role="alert">
          {initializationError}
        </div>
      )}
      <Suspense fallback={<LoadingState />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<PublicRoutes />}>
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
          </Route>
          <Route element={<ProtectedRoutes />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/board" element={<TaskBoardPage />} />
              <Route path="/tasks/:taskId" element={<TaskDetailsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <ToastViewport />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
