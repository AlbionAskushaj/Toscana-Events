import { Link, useLocation } from "react-router-dom";
import React from "react";
import { useAuth } from "../auth/AuthContext";

interface Props {
  children: React.ReactNode;
}

const Layout: React.FC<Props> = ({ children }) => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <div className="app-shell">
      <header className="navbar navbar-expand-lg navbar-dark nav-gilded sticky-top">
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
            {user ? (
              <button className="btn btn-link nav-link" type="button" onClick={() => signOut()}>
                Sign out
              </button>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        <div className="container py-3 d-flex justify-content-between text-muted small">
          <span>Crafted for Toscana Italian Grill</span>
          <Link to="/admin/login" className="text-muted text-decoration-none">
            Admin
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
