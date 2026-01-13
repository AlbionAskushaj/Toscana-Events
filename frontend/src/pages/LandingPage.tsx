import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="page page-landing">
      <div className="landing-hero">
        <div className="container py-5">
          <div className="row align-items-center g-5">
            <div className="col-12 col-lg-7">
              <p className="eyebrow brand-italiana mb-3">
                Toscana Italian Grill
              </p>
              <p className="hero-subtitle">Private Dining, Toscana style</p>
              <p className="text-muted mb-2">Most guests finish in 3–5 minutes.</p>
              <div className="d-flex gap-3 flex-wrap mt-4">
                <Link className="btn btn-gold btn-lg" to="/build">
                  Begin the Experience
                </Link>
                <span className="hero-note">
                  No account required to craft a proposal.
                </span>
              </div>
              <div className="hero-metrics mt-5">
                <div>
                  <div className="metric-value">4</div>
                  <div className="metric-label">Steps to submit</div>
                </div>
                <div>
                  <div className="metric-value">20x20</div>
                  <div className="metric-label">Seating grid</div>
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
