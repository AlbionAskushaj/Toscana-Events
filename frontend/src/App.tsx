import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import EventBuilderPage from "./pages/EventBuilderPage";
import AdminInquiriesPage from "./pages/AdminInquiriesPage";
import AdminMenuPage from "./pages/AdminMenuPage";
import AdminRoomsPage from "./pages/AdminRoomsPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminTemplatesPage from "./pages/AdminTemplatesPage";
import RequireAdmin from "./components/RequireAdmin";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/build" element={<EventBuilderPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin/inquiries"
          element={
            <RequireAdmin>
              <AdminInquiriesPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/menu"
          element={
            <RequireAdmin>
              <AdminMenuPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/templates"
          element={
            <RequireAdmin>
              <AdminTemplatesPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/admin/rooms"
          element={
            <RequireAdmin>
              <AdminRoomsPage />
            </RequireAdmin>
          }
        />
      </Routes>
    </Layout>
  );
}

export default App;
