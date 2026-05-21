export interface MenuCategory {
  _id: string;
  name: string;
  sortOrder: number;
}

export interface MenuItem {
  _id: string;
  categoryId: string;
  name: string;
  description: string;
  pricePerPerson: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  active: boolean;
  category?: MenuCategory;
}

export interface MenuTemplateCourse {
  name: string;
  suggestedItemNames?: string[];
  selectionMode?: "fixed" | "choice" | "share";
  maxChoices?: number;
  shareCount?: number;
  defaultCategoryNames?: string[];
}

export interface MenuTemplate {
  _id: string;
  name: string;
  description: string;
  sortOrder: number;
  courses: MenuTemplateCourse[];
}

export interface RoomLayout {
  _id: string;
  name: string;
  capacity: number;
  description: string;
  defaultTableConfig: SeatingConfig;
  tables?: TableMeta[];
  areas?: TableArea[];
  gridSize?: number;
}

export type InquiryStatus = "new" | "reviewing" | "approved" | "declined" | "completed";

export interface SeatingConfig {
  tablesFor2: number;
  tablesFor4: number;
  tablesFor6: number;
  longTables: number;
  selectedTableIds?: string[];
  combinedGroups?: CombinedGroup[];
  tables?: TableMeta[]; // custom layout when buyout is enabled
}

export type CourseType = string;

export interface MenuSelectionCourse {
  courseType: CourseType;
  itemIds: string[];
  selectionMode?: "fixed" | "choice" | "share";
  maxChoices?: number;
  shareCount?: number;
  defaultCategoryNames?: string[];
}

export interface PricingSummary {
  estimatedPricePerPerson: number;
  estimatedSubtotal: number;
  estimatedServiceCharge: number;
  estimatedTax: number;
  estimatedTotal: number;
}

export interface EventInquiry extends PricingSummary {
  _id: string;
  createdAt: string;
  updatedAt: string;
  status: InquiryStatus;
  isBuyout?: boolean;
  buyoutAmount?: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  occasionType: string;
  eventDate: string;
  eventTime: string;
  guestCount: number;
  roomLayoutId?: string;
  seatingConfig?: SeatingConfig;
  menuSelection: {
    courses: MenuSelectionCourse[];
  };
  dietaryNotes: string;
  specialRequests: string;
}

export interface CreateInquiryPayload {
  isBuyout?: boolean;
  buyoutAmount?: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  occasionType: string;
  eventDate: string;
  eventTime: string;
  guestCount: number;
  roomLayoutId?: string;
  menuSelection: {
    courses: MenuSelectionCourse[];
  };
  dietaryNotes: string;
  specialRequests: string;
  chatSessionId?: string;
}

export interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

export interface ChatInquiryPayload {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  occasionType: string;
  eventDate: string;
  eventTime: string;
  guestCount: number;
  roomLayoutId?: string;
  isBuyout?: boolean;
  buyoutAmount?: number;
  menuSelection: { courses: MenuSelectionCourse[] };
  dietaryNotes: string;
  specialRequests: string;
}

export interface InquiryListItem extends EventInquiry {}

export interface TableArea {
  id: string;
  name: string;
  lines?: AreaLine[];
}

export interface AreaLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export type TableShape = "rect" | "round" | "diamond";

export interface TableMeta {
  id: string;
  label: string;
  seats: number;
  shape: TableShape;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  areaId?: string;
}

export interface CombinedGroup {
  label: string;
  tableIds: string[];
  seats: number;
  areaId?: string;
}
