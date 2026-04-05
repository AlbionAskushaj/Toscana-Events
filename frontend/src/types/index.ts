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
  ChatMessage,
  ChatInquiryPayload,
} from "@shared/types";

export type {
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
  ChatMessage,
  ChatInquiryPayload,
};

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
