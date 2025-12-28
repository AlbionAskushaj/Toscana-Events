import { Link, useLocation } from "react-router-dom";
import React from "react";

interface Props {
  children: React.ReactNode;
}

const Layout: React.FC<Props> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="app-shell">
      <header className="navbar navbar-expand-lg bg-white border-bottom sticky-top">
        <div className="container">
          <Link to="/" className="navbar-brand fw-semibold">
            Toscana Italian Grill · Private Dining Builder
          </Link>
          <nav className="navbar-nav ms-auto gap-2">
            <Link className={`nav-link ${location.pathname === "/" ? "active fw-semibold" : ""}`} to="/">
              Home
            </Link>
            <Link
              className={`nav-link ${location.pathname.startsWith("/build") ? "active fw-semibold" : ""}`}
              to="/build"
            >
              Build an Event
            </Link>
            <Link
              className={`nav-link ${location.pathname.startsWith("/admin") ? "active fw-semibold" : ""}`}
              to="/admin/inquiries"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        <div className="container py-3 text-muted small">Crafted for Toscana Italian Grill</div>
      </footer>
    </div>
  );
};

export default Layout;
