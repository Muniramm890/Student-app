// FILE: student-app/src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DialogProvider } from "./contexts/DialogContext";
import { ToastProvider } from "./contexts/ToastContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AppShell } from "./components/layout/AppShell";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Attendance } from "./pages/Attendance";
import { Fees } from "./pages/Fees";
import { Results } from "./pages/Results";
import { Profile } from "./pages/Profile";
import { Notifications } from "./pages/Notifications";
import { Homework } from "./pages/Homework";

// DialogProvider sits outside AuthProvider so AuthProvider (boot-check /
// connection-error / idle-timeout dialogs) can call useDialog() itself —
// see the admin app's provider-order fix for why this order matters.
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <DialogProvider>
          <ToastProvider>
            <AuthProvider>
              <Gate />
            </AuthProvider>
          </ToastProvider>
        </DialogProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

// Splits signed-in vs signed-out routing once AuthProvider has resolved.
const Gate = () => {
  const { student } = useAuth();

  if (!student) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Dashboard />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="fees" element={<Fees />} />
        <Route path="results" element={<Results />} />
        <Route path="homework" element={<Homework />} />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
