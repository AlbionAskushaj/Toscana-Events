import {
  MenuCategory,
  MenuItem,
  RoomLayout,
  EventInquiry,
  InquiryStatus,
  PricingSummary,
  SeatingConfig,
  MenuSelectionCourse,
  CourseType,
  CreateInquiryPayload,
} from "@shared/types";

export type { MenuCategory, MenuItem, RoomLayout, EventInquiry, InquiryStatus, PricingSummary, SeatingConfig, MenuSelectionCourse, CourseType, CreateInquiryPayload };

export interface EventDetailsInput {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  occasionType: string;
  eventDate: string;
  eventTime: string;
  guestCount: number;
  dietaryNotes: string;
  specialRequests: string;
  isBuyout?: boolean;
  buyoutAmount?: number;
}

export interface InquiryFormState {
  eventDetails: EventDetailsInput;
  menuSelection: {
    courses: MenuSelectionCourse[];
  };
  seatingConfig: SeatingConfig;
  roomLayoutId: string;
}
