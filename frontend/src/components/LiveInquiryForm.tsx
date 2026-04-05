import React from "react";
import type { ChatInquiryPayload, RoomLayout, MenuItem } from "../types";
import { computePricing, getDepositAmount } from "../utils/pricing";

interface Props {
  fields: Partial<ChatInquiryPayload>;
  highlightedFields: string[];
  rooms: RoomLayout[];
  allMenuItems: MenuItem[];
  onFieldChange: (update: Partial<ChatInquiryPayload>) => void;
  onSubmit: () => void;
  onStartOver: () => void;
  submitted: boolean;
  submitError: string;
  isSubmitting: boolean;
}

const REQUIRED: (keyof ChatInquiryPayload)[] = [
  "contactName",
  "contactEmail",
  "contactPhone",
  "occasionType",
  "eventDate",
  "eventTime",
  "guestCount",
  "menuSelection",
];

function isFilled(fields: Partial<ChatInquiryPayload>, key: keyof ChatInquiryPayload): boolean {
  if (key === "menuSelection") return !!fields.menuSelection?.courses?.length;
  const v = fields[key];
  return v !== undefined && v !== null && v !== "" && (key !== "guestCount" || (v as number) > 0);
}

const LiveInquiryForm: React.FC<Props> = ({
  fields,
  highlightedFields,
  rooms,
  allMenuItems,
  onFieldChange,
  onSubmit,
  onStartOver,
  submitted,
  submitError,
  isSubmitting,
}) => {
  const itemMap = new Map(allMenuItems.map((i) => [i._id, i]));
  const room = rooms.find((r) => r._id === fields.roomLayoutId);

  const filledCount = REQUIRED.filter((k) => isFilled(fields, k)).length;
  const progress = Math.round((filledCount / REQUIRED.length) * 100);
  const isComplete = filledCount === REQUIRED.length;

  const hasPricingData =
    !!fields.menuSelection?.courses?.some((c) => c.itemIds.length > 0) && !!fields.guestCount;

  const pricing = hasPricingData
    ? computePricing(
        fields.menuSelection!.courses,
        allMenuItems,
        fields.guestCount!,
        fields.isBuyout,
        fields.buyoutAmount,
      )
    : null;

  const deposit = fields.guestCount ? getDepositAmount(fields.guestCount) : null;

  const hi = (key: string) => highlightedFields.includes(key);
  const fc = (key: string) => `lif__field${hi(key) ? " lif__field--highlight" : ""}`;

  if (submitted) {
    return (
      <div className="lif">
        <div className="lif__success">
          <div className="lif__success-icon">✓</div>
          <h2 className="lif__success-title">Inquiry Submitted</h2>
          <p className="lif__success-body">
            Thank you! A member of our team will be in touch shortly to confirm your event details.
          </p>
          <button
            type="button"
            className="btn btn-outline-secondary mt-3"
            onClick={onStartOver}
          >
            Plan another event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lif">
      {/* Header */}
      <div className="lif__header">
        <h2 className="lif__title">Your Event Inquiry</h2>
        <div className="lif__progress-label">
          <span>{filledCount} of {REQUIRED.length} required fields</span>
          <span>{progress}% complete</span>
        </div>
        <div className="lif__progress">
          <div className="lif__progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Contact */}
      <div className="lif__section">
        <div className="lif__section-title">Contact</div>
        <div className={fc("contactName")}>
          <label className="lif__field-label">Full Name</label>
          <input
            type="text"
            placeholder="Your full name"
            value={fields.contactName || ""}
            onChange={(e) => onFieldChange({ contactName: e.target.value })}
          />
        </div>
        <div className="lif__row">
          <div className={fc("contactEmail")}>
            <label className="lif__field-label">Email</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={fields.contactEmail || ""}
              onChange={(e) => onFieldChange({ contactEmail: e.target.value })}
            />
          </div>
          <div className={fc("contactPhone")}>
            <label className="lif__field-label">Phone</label>
            <input
              type="tel"
              placeholder="403 000 0000"
              value={fields.contactPhone || ""}
              onChange={(e) => onFieldChange({ contactPhone: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Event */}
      <div className="lif__section">
        <div className="lif__section-title">Event</div>
        <div className={fc("occasionType")}>
          <label className="lif__field-label">Occasion</label>
          <input
            type="text"
            placeholder="Birthday, corporate dinner…"
            value={fields.occasionType || ""}
            onChange={(e) => onFieldChange({ occasionType: e.target.value })}
          />
        </div>
        <div className="lif__row">
          <div className={fc("eventDate")}>
            <label className="lif__field-label">Date</label>
            <input
              type="date"
              value={fields.eventDate || ""}
              onChange={(e) => onFieldChange({ eventDate: e.target.value })}
            />
          </div>
          <div className={fc("eventTime")}>
            <label className="lif__field-label">Time</label>
            <input
              type="time"
              value={fields.eventTime || ""}
              onChange={(e) => onFieldChange({ eventTime: e.target.value })}
            />
          </div>
        </div>
        <div className={fc("guestCount")}>
          <label className="lif__field-label">Number of Guests</label>
          <input
            type="number"
            min={1}
            placeholder="How many guests?"
            value={fields.guestCount || ""}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v > 0) onFieldChange({ guestCount: v });
              else if (e.target.value === "") onFieldChange({ guestCount: undefined as unknown as number });
            }}
          />
        </div>
      </div>

      {/* Room */}
      <div className="lif__section">
        <div className="lif__section-title">Room</div>
        <div className={fc("roomLayoutId")}>
          <label className="lif__field-label">Private Dining Room</label>
          <select
            value={fields.roomLayoutId || ""}
            onChange={(e) => onFieldChange({ roomLayoutId: e.target.value || undefined })}
          >
            <option value="">To be recommended by concierge</option>
            {rooms.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name} (up to {r.capacity} guests)
              </option>
            ))}
          </select>
        </div>
        {room?.description && (
          <p className="lif__room-desc">{room.description}</p>
        )}
      </div>

      {/* Menu */}
      <div className="lif__section">
        <div className="lif__section-title">Menu Selection</div>
        {fields.menuSelection?.courses?.length ? (
          <div className="lif__courses">
            {fields.menuSelection.courses.map((course, i) => (
              <div
                key={i}
                className={`lif__course${hi("menuSelection") ? " lif__course--highlight" : ""}`}
              >
                <div className="lif__course-type">{course.courseType}</div>
                <div className="lif__course-items">
                  {course.itemIds.length > 0
                    ? course.itemIds
                        .map((id) => itemMap.get(id)?.name)
                        .filter(Boolean)
                        .join(", ") || `${course.itemIds.length} item(s) selected`
                    : "Items to be selected"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="lif__empty">Your menu will be built as you chat with the concierge.</p>
        )}
      </div>

      {/* Notes */}
      <div className="lif__section">
        <div className="lif__section-title">Notes</div>
        <div className={fc("dietaryNotes")}>
          <label className="lif__field-label">Dietary Restrictions</label>
          <textarea
            rows={2}
            placeholder="Any allergies or dietary requirements?"
            value={fields.dietaryNotes || ""}
            onChange={(e) => onFieldChange({ dietaryNotes: e.target.value })}
          />
        </div>
        <div className={fc("specialRequests")}>
          <label className="lif__field-label">Special Requests</label>
          <textarea
            rows={2}
            placeholder="Decorations, cake, flowers, anything else?"
            value={fields.specialRequests || ""}
            onChange={(e) => onFieldChange({ specialRequests: e.target.value })}
          />
        </div>
      </div>

      {/* Pricing */}
      {pricing && (
        <div className="lif__section">
          <div className="lif__section-title">Estimated Pricing</div>
          <div className="lif__pricing">
            <div className="lif__pricing-row">
              <span>Per person</span>
              <span>${pricing.estimatedPricePerPerson.toFixed(2)}</span>
            </div>
            <div className="lif__pricing-row">
              <span>Subtotal ({fields.guestCount} guests)</span>
              <span>${pricing.estimatedSubtotal.toFixed(2)}</span>
            </div>
            <div className="lif__pricing-row">
              <span>Service charge (18%)</span>
              <span>${pricing.estimatedServiceCharge.toFixed(2)}</span>
            </div>
            <div className="lif__pricing-row">
              <span>Tax (5%)</span>
              <span>${pricing.estimatedTax.toFixed(2)}</span>
            </div>
            <div className="lif__pricing-row lif__pricing-row--total">
              <span>Estimated Total</span>
              <span>${pricing.estimatedTotal.toFixed(2)}</span>
            </div>
          </div>
          {deposit !== null && (
            <div className="lif__deposit">
              Deposit required: <strong>${deposit}</strong>
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <div className="lif__section">
        {submitError && (
          <div
            className="alert alert-danger py-2 px-3 mb-2"
            style={{ fontSize: "0.875rem" }}
          >
            {submitError}
          </div>
        )}
        <button
          type="button"
          className="btn btn-primary lif__submit-btn"
          onClick={onSubmit}
          disabled={!isComplete || isSubmitting}
        >
          {isSubmitting
            ? "Submitting…"
            : isComplete
            ? "Submit Inquiry"
            : `${REQUIRED.length - filledCount} required field${REQUIRED.length - filledCount === 1 ? "" : "s"} remaining`}
        </button>
        <button
          type="button"
          className="btn btn-link btn-sm text-muted lif__start-over"
          onClick={onStartOver}
        >
          Start over
        </button>
      </div>
    </div>
  );
};

export default LiveInquiryForm;
