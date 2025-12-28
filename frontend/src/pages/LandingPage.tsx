import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="container py-5">
      <div className="row align-items-center g-4">
        <div className="col-12 col-lg-7">
          <p className="eyebrow mb-2">Toscana Italian Grill</p>
          <h1 className="display-5 fw-semibold">Build Your Private Dining Experience</h1>
          <p className="lead text-muted">
            Design your set menu, seating layout, and event details in minutes.
          </p>
          <div className="d-flex gap-3 flex-wrap">
            <Link className="btn btn-primary btn-lg" to="/build">
              Start Building
            </Link>
            <Link className="btn btn-outline-secondary btn-lg" to="/admin/inquiries">
              View Inquiries
            </Link>
          </div>
        </div>
        <div className="col-12 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">What you can do</h5>
              <ul className="mb-0">
                <li>Customize menu courses with live pricing.</li>
                <li>Preview seating layouts and table combinations.</li>
                <li>Submit inquiries with a full pricing breakdown.</li>
                <li>Manage menus and inquiries in the admin panel.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
