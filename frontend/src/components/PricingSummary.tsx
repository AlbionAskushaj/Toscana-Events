import React from "react";
import type { PricingSummary } from "../types";

interface Props {
  pricing: PricingSummary;
  guestCount: number;
}

const PricingSummary: React.FC<Props> = ({ pricing, guestCount }) => {
  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
          <h3 className="h5 mb-1">Estimated Pricing</h3>
          <span className="text-muted">Calculated for {guestCount || 0} guests</span>
        </div>
        <div className="row g-3 mt-2">
          <div className="col-12 col-md-6 col-lg-4">
            <div className="d-flex justify-content-between">
              <span className="text-muted">Per Person</span>
              <strong>${pricing.estimatedPricePerPerson.toFixed(2)}</strong>
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <div className="d-flex justify-content-between">
              <span className="text-muted">Subtotal</span>
              <strong>${pricing.estimatedSubtotal.toFixed(2)}</strong>
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <div className="d-flex justify-content-between">
              <span className="text-muted">Service (18%)</span>
              <strong>${pricing.estimatedServiceCharge.toFixed(2)}</strong>
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <div className="d-flex justify-content-between">
              <span className="text-muted">Tax (5%)</span>
              <strong>${pricing.estimatedTax.toFixed(2)}</strong>
            </div>
          </div>
          <div className="col-12 col-lg-4">
            <div className="d-flex justify-content-between bg-light border rounded-3 px-3 py-2">
              <span className="fw-semibold">Total Estimate</span>
              <strong>${pricing.estimatedTotal.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingSummary;
