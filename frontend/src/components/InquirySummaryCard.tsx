import React, { useMemo, useState } from "react";
import type { ChatInquiryPayload, MenuItem, RoomLayout } from "../types";
import { computePricing, getDepositAmount } from "../utils/pricing";
import PricingSummary from "./PricingSummary";

interface Props {
  payload: ChatInquiryPayload;
  rooms: RoomLayout[];
  allMenuItems: MenuItem[];
  onConfirm: () => Promise<void>;
  submitted: boolean;
  submitError: string;
}

const InquirySummaryCard: React.FC<Props> = ({
  payload,
  rooms,
  allMenuItems,
  onConfirm,
  submitted,
  submitError,
}) => {
  const [confirming, setConfirming] = useState(false);

  const room = useMemo(
    () => rooms.find((r) => r._id === payload.roomLayoutId),
    [rooms, payload.roomLayoutId]
  );

  const pricing = useMemo(
    () =>
      computePricing(
        payload.menuSelection.courses,
        allMenuItems,
        payload.guestCount,
        payload.isBuyout,
        payload.buyoutAmount
      ),
    [payload, allMenuItems]
  );

  const depositAmount = getDepositAmount(payload.guestCount);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm();
    } finally {
      setConfirming(false);
    }
  };

  if (submitted) {
    return (
      <div className="summary-card summary-card--success">
        <div className="summary-card__icon">✓</div>
        <h2 className="summary-card__title">Inquiry Submitted</h2>
        <p className="summary-card__text">
          Thank you, {payload.contactName}. We've received your private dining inquiry and will be in touch at{" "}
          <strong>{payload.contactEmail}</strong> shortly.
        </p>
        {depositAmount && (
          <p className="summary-card__text">
            A <strong>${depositAmount} deposit</strong> will be required within 3 days to hold your booking.
            We'll send payment details by email.
          </p>
        )}
        {!depositAmount && (
          <p className="summary-card__text">
            No deposit is required for events under 10 guests. We'll confirm availability and next steps by email or phone.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="summary-card">
      <div className="summary-card__header">
        <h2 className="summary-card__title">Your Inquiry Summary</h2>
        <p className="summary-card__subtitle">Please review the details before submitting.</p>
      </div>

      <div className="summary-card__sections">
        {/* Contact */}
        <div className="summary-section">
          <div className="summary-section__label">Contact</div>
          <div className="summary-section__content">
            <div>{payload.contactName}</div>
            <div className="text-muted">{payload.contactEmail}</div>
            <div className="text-muted">{payload.contactPhone}</div>
          </div>
        </div>

        {/* Event Details */}
        <div className="summary-section">
          <div className="summary-section__label">Event</div>
          <div className="summary-section__content">
            <div>
              {payload.eventDate} at {payload.eventTime}
            </div>
            <div className="text-muted">
              {payload.occasionType} &middot; {payload.guestCount} guests
            </div>
            {payload.isBuyout && (
              <div className="text-muted">
                Buyout{payload.buyoutAmount ? ` — $${payload.buyoutAmount.toLocaleString()}` : ""}
              </div>
            )}
          </div>
        </div>

        {/* Room */}
        <div className="summary-section">
          <div className="summary-section__label">Room</div>
          <div className="summary-section__content">
            {room ? (
              <>
                <div>{room.name}</div>
                <div className="text-muted">Capacity: {room.capacity} guests</div>
                {room.description && <div className="text-muted">{room.description}</div>}
              </>
            ) : (
              <div className="text-muted">To be assigned by our team</div>
            )}
          </div>
        </div>

        {/* Menu */}
        <div className="summary-section">
          <div className="summary-section__label">Menu</div>
          <div className="summary-section__content">
            {payload.menuSelection.courses.length > 0 ? (
              payload.menuSelection.courses.map((course, i) => (
                <div key={i} className="text-muted">
                  {course.courseType}
                  {course.itemIds.length > 0 && ` (${course.itemIds.length} item${course.itemIds.length === 1 ? "" : "s"} selected)`}
                </div>
              ))
            ) : (
              <div className="text-muted">To be finalised with the team</div>
            )}
          </div>
        </div>

        {/* Dietary & Special */}
        {(payload.dietaryNotes || payload.specialRequests) && (
          <div className="summary-section">
            <div className="summary-section__label">Notes</div>
            <div className="summary-section__content">
              {payload.dietaryNotes && (
                <div className="text-muted">Dietary: {payload.dietaryNotes}</div>
              )}
              {payload.specialRequests && (
                <div className="text-muted">Special: {payload.specialRequests}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pricing */}
      {pricing.estimatedTotal > 0 && (
        <div className="summary-card__pricing">
          <PricingSummary pricing={pricing} guestCount={payload.guestCount} />
        </div>
      )}

      {/* Deposit notice */}
      {depositAmount && (
        <p className="summary-card__deposit-note">
          A <strong>${depositAmount} deposit</strong> will be required within 3 days to hold your booking.
        </p>
      )}

      {submitError && (
        <div className="alert alert-danger mt-3" role="alert">
          {submitError}
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary summary-card__confirm-btn"
        onClick={handleConfirm}
        disabled={confirming}
      >
        {confirming ? "Submitting…" : "Confirm & Submit Inquiry"}
      </button>
    </div>
  );
};

export default InquirySummaryCard;
