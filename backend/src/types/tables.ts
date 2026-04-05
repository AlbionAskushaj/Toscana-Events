export interface MenuCategoryRow {
  id: string;
  name: string;
  sort_order: number;
}

export interface MenuItemRow {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price_per_person: number;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  active: boolean;
}

export interface MenuTemplateCourseRow {
  name: string;
  suggested_item_names?: string[];
  selection_mode?: "fixed" | "choice" | "share";
  max_choices?: number;
  share_count?: number;
  default_category_names?: string[];
}

export interface MenuTemplateRow {
  id: string;
  name: string;
  description: string;
  sort_order: number;
  courses: MenuTemplateCourseRow[];
}

export interface SeatingConfigRow {
  tables_for_2: number;
  tables_for_4: number;
  tables_for_6: number;
  long_tables: number;
  selected_table_ids?: string[];
  combined_groups?: CombinedGroupRow[];
}

export type TableShapeRow = "rect" | "round" | "diamond";

export interface TableMetaRow {
  id: string;
  label: string;
  seats: number;
  shape: TableShapeRow;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  area_id?: string;
}

export interface AreaLineRow {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface TableAreaRow {
  id: string;
  name: string;
  lines?: AreaLineRow[];
}

export interface CombinedGroupRow {
  label: string;
  table_ids: string[];
  seats: number;
  area_id?: string;
}

export interface RoomLayoutRow {
  id: string;
  name: string;
  capacity: number;
  description: string;
  default_table_config: SeatingConfigRow;
  tables?: TableMetaRow[];
  areas?: TableAreaRow[];
}

export interface MenuSelectionCourseRow {
  course_type: string;
  item_ids: string[];
  share_count?: number;
}

export interface MenuSelectionRow {
  courses: MenuSelectionCourseRow[];
}

export interface EventInquiryRow {
  id: string;
  created_at: string;
  updated_at: string;
  status: "new" | "reviewing" | "approved" | "declined" | "completed";
  is_buyout?: boolean;
  buyout_amount?: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  occasion_type: string;
  event_date: string;
  event_time: string;
  guest_count: number;
  room_layout_id?: string | null;
  seating_config?: SeatingConfigRow | Record<string, never>;
  menu_selection: MenuSelectionRow;
  dietary_notes: string;
  special_requests: string;
  estimated_price_per_person: number;
  estimated_subtotal: number;
  estimated_service_charge: number;
  estimated_tax: number;
  estimated_total: number;
}

export interface DraftRow {
  id: string;
  email: string;
  data: any;
  created_at: string;
  updated_at: string;
}
