import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import EventBuilderPage from "./pages/EventBuilderPage";
import AdminInquiriesPage from "./pages/AdminInquiriesPage";
import AdminMenuPage from "./pages/AdminMenuPage";
import AdminRoomsPage from "./pages/AdminRoomsPage";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/build" element={<EventBuilderPage />} />
        <Route path="/admin/inquiries" element={<AdminInquiriesPage />} />
        <Route path="/admin/menu" element={<AdminMenuPage />} />
        <Route path="/admin/rooms" element={<AdminRoomsPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
