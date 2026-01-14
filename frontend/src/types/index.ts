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
  MenuTemplate,
  MenuTemplateCourse,
  TableArea,
  TableMeta,
  AreaLine,
} from "@shared/types";

export type { MenuCategory, MenuItem, RoomLayout, EventInquiry, InquiryStatus, PricingSummary, SeatingConfig, MenuSelectionCourse, CourseType, CreateInquiryPayload, MenuTemplate, MenuTemplateCourse, TableArea, TableMeta, AreaLine };

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
  buyoutDetails?: string;
}

export interface InquiryFormState {
  eventDetails: EventDetailsInput;
  menuSelection: {
    courses: MenuSelectionCourse[];
  };
  seatingConfig: SeatingConfig;
  roomLayoutId: string;
  roomFlexibility: "flexible" | "specific";
  menuStyleId: string;
}
