import React from "react";
import type { EventDetailsInput, MenuItem, MenuSelectionCourse, RoomLayout, PricingSummary } from "../types";

interface Props {
  eventDetails: EventDetailsInput;
  room: RoomLayout | undefined;
  courses: MenuSelectionCourse[];
  items: MenuItem[];
  pricing: PricingSummary;
  onEditStep?: (step: number) => void;
}

const InquiryReview: React.FC<Props> = ({
  eventDetails,
  room,
  courses,
  items,
  pricing,
  onEditStep,
}) => {
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
              <h4 className="h6 mb-0">Room</h4>
            </div>
            {room ? (
              <>
                <div>{room.name}</div>
                <div className="text-muted">{room.description}</div>
              </>
            ) : (
              <div className="text-muted">To be assigned by our team</div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="h6 mb-0">Menu Selection</h4>
            {onEditStep && (
              <button className="btn btn-link btn-sm" type="button" onClick={() => onEditStep(5)}>
                Edit
              </button>
            )}
          </div>
          {courses.map((course) => (
            <div key={course.courseType} className="mt-2">
              <strong>{course.courseType.toUpperCase()}</strong>
              <div className="text-muted">
                {course.itemIds.length} selection{course.itemIds.length === 1 ? "" : "s"}
                {course.selectionMode === "share" && course.shareCount ? ` · shared for ${course.shareCount}` : ""}
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
