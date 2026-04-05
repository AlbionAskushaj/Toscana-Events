import { Link } from "react-router-dom";
import CollageOne from "../assets/landingpage/collage-1.jpg";
import CollageTwo from "../assets/landingpage/collage-2.png";
import CollageThree from "../assets/landingpage/collage-3.webp";
import CollageFour from "../assets/landingpage/collage-4.webp";
import CollageLongTable from "../assets/collage-longtable.avif";
import CollageMahogany from "../assets/collage-mahogany.avif";

const LandingPage = () => {
  return (
    <div className="page page-landing">
      <div className="landing-hero">
        <div className="container py-5">
          <div className="landing-collage">
            <div className="hero-banner">
              <span className="hero-banner-kicker">AI Dining Concierge</span>
              <h1>Private dining, curated the Toscana way.</h1>
              <div className="hero-banner-rule" aria-hidden="true" />
            </div>
            <div className="d-flex gap-3 flex-wrap align-items-center mb-4">
              <Link className="btn btn-gold btn-lg hero-cta" to="/build">
                Plan Your Event
              </Link>
              <span className="hero-note">
                No account required to craft a proposal.
              </span>
            </div>
            <div className="hero-collage">
              <img className="collage-tile" src={CollageOne} alt="Toscana dining ambiance" />
              <img className="collage-tile" src={CollageTwo} alt="Toscana dining room scene" />
              <img className="collage-tile" src={CollageThree} alt="Toscana downtown location" />
              <img className="collage-tile" src={CollageFour} alt="Private dining setup" />
              <img className="collage-tile" src={CollageLongTable} alt="Long table private dining setup" />
              <img className="collage-tile" src={CollageMahogany} alt="Toscana Mahogany dining room" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
