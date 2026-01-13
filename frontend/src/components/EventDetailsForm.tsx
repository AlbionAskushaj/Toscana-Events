import React, { useState } from "react";
import { EventDetailsInput } from "../types";

interface Props {
  value: EventDetailsInput;
  onChange: (value: EventDetailsInput) => void;
  mode: "contact" | "basics" | "buyout";
}

const EventDetailsForm: React.FC<Props> = ({ value, onChange, mode }) => {
  const handleChange = (field: keyof EventDetailsInput, val: string | number | boolean) => {
    onChange({ ...value, [field]: val });
  };
  const [showNotes, setShowNotes] = useState(false);

  return (
    <div className="card">
      <div className="card-body">
        {mode === "contact" && (
          <p className="text-muted">We only use this to confirm your details.</p>
        )}
        {mode === "basics" && (
          <p className="text-muted">These can be approximate. You can adjust later.</p>
        )}
        {mode === "buyout" && (
          <p className="text-muted">Only choose this if you want the entire restaurant.</p>
        )}
        <div className="row g-3">
          {mode === "contact" && (
            <>
              <div className="col-12 col-md-6">
                <label className="form-label">Contact Name</label>
                <input
                  className="form-control"
                  type="text"
                  value={value.contactName}
                  onChange={(e) => handleChange("contactName", e.target.value)}
                  required
                />
                <div className="form-text">Who should we reach out to?</div>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Contact Email</label>
                <input
                  className="form-control"
                  type="email"
                  value={value.contactEmail}
                  onChange={(e) => handleChange("contactEmail", e.target.value)}
                  required
                />
                <div className="form-text">For confirmations and details.</div>
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label">Contact Phone</label>
                <input
                  className="form-control"
                  type="tel"
                  value={value.contactPhone}
                  onChange={(e) => handleChange("contactPhone", e.target.value)}
                  required
                />
                <div className="form-text">Best day-of number.</div>
              </div>
            </>
          )}
          {mode === "basics" && (
            <>
              <div className="col-12 col-md-6">
                <label className="form-label">Occasion Type</label>
                <input
                  className="form-control"
                  type="text"
                  value={value.occasionType}
                  onChange={(e) => handleChange("occasionType", e.target.value)}
                  placeholder="Birthday, corporate, rehearsal..."
                />
                <div className="form-text">We’ll use this to tailor recommendations.</div>
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label">Event Date</label>
                <input
                  className="form-control"
                  type="date"
                  value={value.eventDate}
                  onChange={(e) => handleChange("eventDate", e.target.value)}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label">Event Time</label>
                <input
                  className="form-control"
                  type="time"
                  value={value.eventTime}
                  onChange={(e) => handleChange("eventTime", e.target.value)}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label">Guest Count</label>
                <input
                  className="form-control"
                  type="number"
                  min={1}
                  value={value.guestCount}
                  onChange={(e) => handleChange("guestCount", Number(e.target.value))}
                />
                <div className="form-text">We’ll size the menu and seating for you.</div>
              </div>
              <div className="col-12">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  type="button"
                  onClick={() => setShowNotes((prev) => !prev)}
                >
                  {showNotes ? "Hide extra details" : "Add dietary notes or requests"}
                </button>
              </div>
              {showNotes && (
                <>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Dietary Notes</label>
                    <textarea
                      className="form-control"
                      value={value.dietaryNotes}
                      onChange={(e) => handleChange("dietaryNotes", e.target.value)}
                      placeholder="Allergies or preferences"
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Special Requests</label>
                    <textarea
                      className="form-control"
                      value={value.specialRequests}
                      onChange={(e) => handleChange("specialRequests", e.target.value)}
                      placeholder="AV setup, decor, timing"
                    />
                  </div>
                </>
              )}
            </>
          )}
          {mode === "buyout" && (
            <>
              <div className="col-12 col-md-8">
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={value.isBuyout || false}
                    onChange={(e) => handleChange("isBuyout", e.target.checked)}
                    id="buyout-toggle"
                  />
                  <label className="form-check-label" htmlFor="buyout-toggle">
                    Full Venue Buyout (includes food & drinks)
                  </label>
                </div>
                <div className="form-text">Select this if you need full privacy for your event.</div>
              </div>
              {value.isBuyout && (
                <div className="col-12 col-md-6">
                  <label className="form-label">Buyout Total (optional)</label>
                  <input
                    className="form-control"
                    type="number"
                    min={0}
                    value={value.buyoutAmount || ""}
                    onChange={(e) => handleChange("buyoutAmount", Number(e.target.value))}
                    placeholder="Enter total buyout amount"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsForm;
