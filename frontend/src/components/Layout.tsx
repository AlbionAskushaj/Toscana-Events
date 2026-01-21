import { Link, useLocation } from "react-router-dom";
import React from "react";
import { useAuth } from "../auth/AuthContext";
import ToscanaLogo from "../assets/ToscanaMainLogo.png";

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
            <span className="brand-lockup">
              <img className="brand-logo" src={ToscanaLogo} alt="Toscana Italian Grill" />
              <span className="brand-text">
                <span className="brand-full">Toscana Italian Grill · Private Dining Builder</span>
                <span className="brand-short">Toscana · Events</span>
              </span>
            </span>
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
        <div className="container py-5">
          <div className="footer-grid">
            <div className="footer-brand">
              <img className="footer-logo" src={ToscanaLogo} alt="Toscana Italian Grill" />
              <p className="footer-tagline">Private dining planning, Toscana style.</p>
            </div>
            <div className="footer-location">
              <h3>Mahogany</h3>
              <address>
                7 Mahogany Plaza SE Unit 1370
                <br />
                Calgary, AB T3M 2P8
              </address>
              <p>
                <a href="tel:4034555050">403 455 5050</a>
                <br />
                <a href="mailto:mahogany@toscanagrill.ca">mahogany@toscanagrill.ca</a>
              </p>
            </div>
            <div className="footer-location">
              <h3>Heritage Plaza</h3>
              <address>
                8330 Macleod Trail SE #1B
                <br />
                Calgary, AB T2H 2V2
              </address>
              <p>
                <a href="tel:4032551212">403 255 1212</a>
                <br />
                <a href="mailto:info@toscanagrill.ca">info@toscanagrill.ca</a>
              </p>
            </div>
            <div className="footer-location">
              <h3>10th Avenue</h3>
              <address>
                317 10 Ave SW
                <br />
                Calgary, AB T2R 0A5
              </address>
              <p>
                <a href="tel:4033001414">403 300 1414</a>
                <br />
                <a href="mailto:info@toscanayyc.ca">info@toscanayyc.ca</a>
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            <span>Crafted for Toscana Italian Grill</span>
            <Link to="/admin/login" className="text-decoration-none">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
