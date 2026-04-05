import { Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";
import { env } from "../config/env";
import { EventInquiryRow, MenuItemRow, SeatingConfigRow } from "../types/tables";
import { sendEmail } from "../services/mailService";
import { buildInquiryStatusEmail, buildInquirySubmittedEmail } from "../services/emailTemplates";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;

const SERVICE_CHARGE_RATE = 0.18;
const TAX_RATE = 0.05;
const VALID_STATUSES = new Set(["new", "reviewing", "approved", "declined", "completed"]);

const toMenuItem = (row: MenuItemRow) => ({
  _id: row.id,
  categoryId: row.category_id,
  name: row.name,
  description: row.description,
  pricePerPerson: row.price_per_person,
  isVegetarian: row.is_vegetarian,
  isVegan: row.is_vegan,
  isGlutenFree: row.is_gluten_free,
  active: row.active,
});

const toInquiry = (row: EventInquiryRow) => ({
  _id: row.id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  status: row.status,
  isBuyout: row.is_buyout,
  buyoutAmount: row.buyout_amount,
  contactName: row.contact_name,
  contactEmail: row.contact_email,
  contactPhone: row.contact_phone,
  occasionType: row.occasion_type,
  eventDate: row.event_date,
  eventTime: row.event_time,
  guestCount: row.guest_count,
  roomLayoutId: row.room_layout_id ?? undefined,
  seatingConfig: row.seating_config && 'tables_for_2' in row.seating_config ? {
    tablesFor2: (row.seating_config as SeatingConfigRow).tables_for_2,
    tablesFor4: (row.seating_config as SeatingConfigRow).tables_for_4,
    tablesFor6: (row.seating_config as SeatingConfigRow).tables_for_6,
    longTables: (row.seating_config as SeatingConfigRow).long_tables,
    selectedTableIds: (row.seating_config as SeatingConfigRow).selected_table_ids,
    combinedGroups: (row.seating_config as SeatingConfigRow).combined_groups?.map((g) => ({
      label: g.label,
      tableIds: g.table_ids,
      seats: g.seats,
      areaId: g.area_id,
    })),
    tables: (row.seating_config as any).tables,
  } : undefined,
  menuSelection: {
    courses: (row.menu_selection?.courses || []).map((course) => ({
      courseType: course.course_type as any,
      itemIds: course.item_ids,
      shareCount: course.share_count,
    })),
  },
  dietaryNotes: row.dietary_notes,
  specialRequests: row.special_requests,
  estimatedPricePerPerson: row.estimated_price_per_person,
  estimatedSubtotal: row.estimated_subtotal,
  estimatedServiceCharge: row.estimated_service_charge,
  estimatedTax: row.estimated_tax,
  estimatedTotal: row.estimated_total,
});

function sumPrices(items: Array<{ pricePerPerson: number }>): number {
  return items.reduce((sum, item) => sum + item.pricePerPerson, 0);
}

async function calculatePricing(menuSelection: { courses: { itemIds: string[] }[] }, guestCount: number) {
  const itemIds = Array.from(new Set(menuSelection.courses.flatMap((course) => course.itemIds)));

  let items: MenuItemRow[] = [];

  if (itemIds.length > 0) {
    const { data, error } = await supabaseAdmin
      .from("menu_items")
      .select("*")
      .in("id", itemIds);

    if (error) {
      throw error;
    }

    items = data || [];
  }

  const mappedItems = items.map(toMenuItem);
  const itemMap = new Map(mappedItems.map((i) => [i._id, i]));

  const estimatedPricePerPerson = menuSelection.courses.reduce((sum, course) => {
    const courseItems = course.itemIds.map((id) => itemMap.get(id)).filter(Boolean) as Array<{ pricePerPerson: number }>;
    if (courseItems.length === 0) return sum;
    const avg = sumPrices(courseItems) / courseItems.length;
    return sum + avg;
  }, 0);

  const estimatedSubtotal = estimatedPricePerPerson * guestCount;
  const estimatedServiceCharge = estimatedSubtotal * SERVICE_CHARGE_RATE;
  const estimatedTax = (estimatedSubtotal + estimatedServiceCharge) * TAX_RATE;
  const estimatedTotal = estimatedSubtotal + estimatedServiceCharge + estimatedTax;

  return {
    estimatedPricePerPerson,
    estimatedSubtotal,
    estimatedServiceCharge,
    estimatedTax,
    estimatedTotal,
  };
}

export const createInquiry = async (req: Request, res: Response) => {
  const {
    isBuyout,
    buyoutAmount,
    contactName,
    contactEmail,
    contactPhone,
    occasionType,
    eventDate,
    eventTime,
    guestCount,
    roomLayoutId,
    seatingConfig,
    menuSelection,
    dietaryNotes,
    specialRequests,
  } = req.body;

  const missingFields: string[] = [];
  if (!contactName) missingFields.push("contactName");
  if (!contactEmail) missingFields.push("contactEmail");
  if (!contactPhone) missingFields.push("contactPhone");
  if (!occasionType) missingFields.push("occasionType");
  if (!eventDate) missingFields.push("eventDate");
  if (!eventTime) missingFields.push("eventTime");
  if (!guestCount) missingFields.push("guestCount");
  if (!menuSelection?.courses?.length) missingFields.push("menuSelection");

  if (missingFields.length > 0) {
    return res.status(400).json({ message: "Missing required fields", missingFields });
  }

  if (!EMAIL_RE.test(String(contactEmail))) {
    return res.status(400).json({ message: "Invalid email address" });
  }
  if (!PHONE_RE.test(String(contactPhone))) {
    return res.status(400).json({ message: "Invalid phone number" });
  }
  if (!Number.isInteger(Number(guestCount)) || Number(guestCount) < 1) {
    return res.status(400).json({ message: "Guest count must be a positive integer" });
  }

  if (buyoutAmount !== undefined && Number(buyoutAmount) < 0) {
    return res.status(400).json({ message: "Buyout amount must be 0 or greater" });
  }
  if (isBuyout && buyoutAmount !== undefined && Number(buyoutAmount) <= 0) {
    return res.status(400).json({ message: "Buyout amount must be greater than 0 for buyout events" });
  }

  if (roomLayoutId) {
    const { data: roomData, error: roomLookupError } = await supabaseAdmin
      .from("room_layouts")
      .select("capacity")
      .eq("id", roomLayoutId)
      .maybeSingle();
    if (roomLookupError) {
      return res.status(400).json({ message: "Invalid room selection" });
    }
    if (!roomData) {
      return res.status(400).json({ message: "Selected room does not exist" });
    }
    if (Number(guestCount) > roomData.capacity) {
      return res.status(400).json({ message: "Guest count exceeds the capacity of the selected room." });
    }
  }

  try {
    const pricing = await calculatePricing(menuSelection, guestCount);
    const finalPricing =
      isBuyout && buyoutAmount
        ? {
            estimatedPricePerPerson: guestCount ? buyoutAmount / guestCount : buyoutAmount,
            estimatedSubtotal: buyoutAmount,
            estimatedServiceCharge: 0,
            estimatedTax: 0,
            estimatedTotal: buyoutAmount,
          }
        : pricing;

    const { data, error } = await supabaseAdmin
      .from("event_inquiries")
      .insert({
        status: "new",
        is_buyout: !!isBuyout,
        buyout_amount: buyoutAmount || null,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        occasion_type: occasionType,
        event_date: eventDate,
        event_time: eventTime,
        guest_count: guestCount,
        room_layout_id: roomLayoutId || null,
        seating_config: {},
        menu_selection: {
          courses: menuSelection.courses.map((c: any) => ({
            course_type: c.courseType,
            item_ids: c.itemIds,
            share_count: c.shareCount,
          })),
        },
        dietary_notes: dietaryNotes,
        special_requests: specialRequests,
        estimated_price_per_person: finalPricing.estimatedPricePerPerson,
        estimated_subtotal: finalPricing.estimatedSubtotal,
        estimated_service_charge: finalPricing.estimatedServiceCharge,
        estimated_tax: finalPricing.estimatedTax,
        estimated_total: finalPricing.estimatedTotal,
      })
      .select()
      .single();

    if (error) throw error;

    const inquiry = toInquiry(data as EventInquiryRow);
    let roomName: string | undefined;
    try {
      if (inquiry.roomLayoutId) {
        const { data: roomData } = await supabaseAdmin
          .from("room_layouts")
          .select("name")
          .eq("id", inquiry.roomLayoutId)
          .maybeSingle();
        roomName = roomData?.name;
      }
    } catch (roomErr) {
      console.warn("[email] Failed to load room name", roomErr);
    }

    try {
      const guestEmail = buildInquirySubmittedEmail({
        inquiry,
        roomName,
      });
      await sendEmail({
        to: inquiry.contactEmail,
        subject: guestEmail.subject,
        html: guestEmail.html,
        text: guestEmail.text,
      });
    } catch (emailErr) {
      console.error("[email] Failed to send inquiry confirmation", emailErr);
    }

    if (env.adminNotificationEmail) {
      try {
        const adminEmail = buildInquirySubmittedEmail({
          inquiry,
          roomName,
          admin: true,
        });
        await sendEmail({
          to: env.adminNotificationEmail,
          subject: adminEmail.subject,
          html: adminEmail.html,
          text: adminEmail.text,
        });
      } catch (emailErr) {
        console.error("[email] Failed to send admin inquiry notification", emailErr);
      }
    }

    res.status(201).json(inquiry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create inquiry" });
  }
};

export const listInquiries = async (req: Request, res: Response) => {
  const page = Math.max(0, Number(req.query.page) || 0);
  const limit = 50;
  const from = page * limit;
  const to = from + limit - 1;

  try {
    const { data, error, count } = await supabaseAdmin
      .from("event_inquiries")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw error;
    res.json({ inquiries: (data || []).map(toInquiry), total: count ?? 0, page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load inquiries" });
  }
};

export const getInquiry = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("event_inquiries")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      throw error;
    }

    if (!data) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    res.json(toInquiry(data));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load inquiry" });
  }
};

export const updateInquiryStatus = async (req: Request, res: Response) => {
  const { status } = req.body;
  if (!VALID_STATUSES.has(String(status))) {
    return res.status(400).json({ message: "Invalid status value" });
  }
  try {
    const { data, error } = await supabaseAdmin
      .from("event_inquiries")
      .update({ status })
      .eq("id", req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ message: "Inquiry not found" });
      }
      throw error;
    }

    if (!data) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    const inquiry = toInquiry(data);
    try {
      const { subject, html, text } = buildInquiryStatusEmail({ inquiry, status });
      await sendEmail({
        to: inquiry.contactEmail,
        subject,
        html,
        text,
      });
    } catch (emailErr) {
      console.error("[email] Failed to send status email", emailErr);
    }

    res.json(inquiry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update inquiry status" });
  }
};
