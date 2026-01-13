import React from "react";
import type { EventDetailsInput, MenuItem, MenuSelectionCourse, RoomLayout, PricingSummary } from "../types";

interface Props {
  eventDetails: EventDetailsInput;
  seatingConfig: { tablesFor2: number; tablesFor4: number; tablesFor6: number; longTables: number; selectedTableIds?: string[] };
  room: RoomLayout | undefined;
  courses: MenuSelectionCourse[];
  items: MenuItem[];
  pricing: PricingSummary;
  roomFlexibility: "flexible" | "specific";
  depositAmount: number | null;
  depositDeferred: boolean;
  onEditStep?: (step: number) => void;
}

const InquiryReview: React.FC<Props> = ({
  eventDetails,
  seatingConfig,
  room,
  courses,
  items,
  pricing,
  roomFlexibility,
  depositAmount,
  depositDeferred,
  onEditStep,
}) => {
  const findItemName = (id: string) => items.find((i) => i._id === id)?.name || id;
  const selectedCount = seatingConfig.selectedTableIds?.length || 0;

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="h5">Review Your Inquiry</h3>
        <div className="row g-3">
          <div className="col-12 col-lg-6">
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="h6 mb-0">Event Details</h4>
              {onEditStep && (
                <button className="btn btn-link btn-sm" type="button" onClick={() => onEditStep(0)}>
                  Edit
                </button>
              )}
            </div>
            <div className="text-muted small">{eventDetails.contactName}</div>
            <div className="text-muted small">{eventDetails.contactEmail}</div>
            <div className="text-muted small">{eventDetails.contactPhone}</div>
            <div className="mt-2">
              {eventDetails.eventDate} at {eventDetails.eventTime}
            </div>
            <div>Guests: {eventDetails.guestCount}</div>
            <div>Occasion: {eventDetails.occasionType}</div>
            {eventDetails.dietaryNotes && <div>Dietary: {eventDetails.dietaryNotes}</div>}
            {eventDetails.specialRequests && <div>Requests: {eventDetails.specialRequests}</div>}
          </div>
          <div className="col-12 col-lg-6">
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="h6 mb-0">Room & Seating</h4>
              {onEditStep && (
                <button className="btn btn-link btn-sm" type="button" onClick={() => onEditStep(7)}>
                  Edit
                </button>
              )}
            </div>
            <div>{room ? room.name : "Select a room"}</div>
            <div className="text-muted">{room?.description}</div>
            <div className="mt-2">
              {selectedCount > 0 ? `${selectedCount} tables selected` : "Seating will be tailored by the team."}
            </div>
            <div className="text-muted">
              {roomFlexibility === "flexible" ? "Flexible room preference." : "Specific room requested."}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="h6 mb-0">Deposit</h4>
            {onEditStep && (
              <button className="btn btn-link btn-sm" type="button" onClick={() => onEditStep(4)}>
                Edit
              </button>
            )}
          </div>
          <div className="text-muted">
            {depositDeferred
              ? "Decide later (no payment today)."
              : depositAmount
              ? `Placeholder deposit selected: $${depositAmount}.`
              : "No deposit selected."}
          </div>
        </div>

        <div className="mt-4">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="h6 mb-0">Menu Selection</h4>
            {onEditStep && (
              <button className="btn btn-link btn-sm" type="button" onClick={() => onEditStep(6)}>
                Edit
              </button>
            )}
          </div>
          {courses.map((course) => (
            <div key={course.courseType} className="mt-2">
              <strong>{course.courseType.toUpperCase()}</strong>
              <div className="text-muted">
                {course.itemIds.length} selection{course.itemIds.length === 1 ? "" : "s"}
              </div>
            </div>
          ))}
        </div>

        <div className="d-flex flex-wrap gap-3 mt-4">
          <div>
            <span className="text-muted">Per Person</span>
            <div className="fw-semibold">${pricing.estimatedPricePerPerson.toFixed(2)}</div>
          </div>
          <div>
            <span className="text-muted">Subtotal</span>
            <div className="fw-semibold">${pricing.estimatedSubtotal.toFixed(2)}</div>
          </div>
          {eventDetails.isBuyout ? (
            <div>
              <span className="text-muted">Buyout</span>
              <div className="fw-semibold">Includes food & drinks</div>
            </div>
          ) : null}
          <div>
            <span className="text-muted">Total</span>
            <div className="fw-semibold">${pricing.estimatedTotal.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InquiryReview;
