import { Link } from "react-router-dom";
import ToscanaLogo from "../assets/ToscanaMainLogo.png";

const LandingPage = () => {
  return (
    <div className="page page-landing">
      <div className="landing-hero">
        <div className="container py-5">
          <div className="row align-items-center g-5">
            <div className="col-12 col-lg-7">
              <div className="hero-copy">
                <div className="hero-logo-wrap">
                  <img className="hero-logo" src={ToscanaLogo} alt="Toscana Italian Grill" />
                </div>
                <p className="eyebrow mb-2">Private Dining</p>
                <h1 className="hero-title mb-3">Private dining & events, Toscana style.</h1>
                <p className="hero-subtitle hero-reveal">
                  Build a tailored dining experience inspired by Toscana’s private dining spaces.
                  Craft menus, seating, and timing in minutes.
                </p>
                <div className="d-flex gap-3 flex-wrap mt-4">
                  <Link className="btn btn-gold btn-lg" to="/build">
                    Begin the Experience
                  </Link>
                  <span className="hero-note">
                    No account required to craft a proposal.
                  </span>
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-5">
              <div className="hero-panel-wrap">
                <div className="hero-panel">
                  <div className="hero-panel-inner">
                    <div className="panel-header">
                      <span className="panel-kicker">Signature Flow</span>
                      <h2>Design in Three Acts</h2>
                    </div>
                    <ol className="panel-steps">
                      <li>
                        <strong>Essentials</strong>
                        <span>Guest count, occasion, and timing.</span>
                      </li>
                      <li>
                        <strong>Menu</strong>
                        <span>Course-by-course selections and pricing.</span>
                      </li>
                      <li>
                        <strong>Seating</strong>
                        <span>Assign tables across custom rooms.</span>
                      </li>
                    </ol>
                    <div className="panel-footer">
                      <div className="gold-divider" />
                      <p>
                        Finish with a polished inquiry summary for your private
                        dining team.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="hero-frame" aria-hidden="true">
                  <div className="frame-glow" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
