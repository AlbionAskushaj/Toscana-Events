import type { EventInquiry } from "@shared/types";

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

const courseSummary = (courses: Array<{ courseType: string; itemIds: string[] }>) =>
  courses
    .map((course) => {
      const count = course.itemIds.length;
      return `${course.courseType}: ${count} item${count === 1 ? "" : "s"}`;
    })
    .join("<br />");

export const buildInquirySubmittedEmail = (params: {
  inquiry: EventInquiry;
  roomName?: string;
  templateName?: string;
  admin?: boolean;
}) => {
  const { inquiry, roomName, templateName, admin } = params;
  const depositInfo = (() => {
    const count = inquiry.guestCount || 0;
    if (count < 10) return null;
    if (count <= 15) {
      return {
        amount: 200,
        link: "https://buy.stripe.com/eVq9ASeGE7p18XV5N23oA01",
      };
    }
    if (count <= 30) {
      return {
        amount: 500,
        link: "https://buy.stripe.com/dRm6oGgOMaBd0rp6R63oA02",
      };
    }
    return {
      amount: 1000,
      link: "https://buy.stripe.com/6oU00idCA5gT0rpcbq3oA03",
    };
  })();
  const eventDate = inquiry.eventDate || "TBD";
  const eventTime = inquiry.eventTime || "TBD";
  const guestCount = inquiry.guestCount || 0;
  const menuSummary = courseSummary(inquiry.menuSelection.courses);
  const roomLabel = roomName || inquiry.roomLayoutId || "TBD";
  const styleLabel = templateName || "Custom";
  const reviewLink = "https://admin.toscanagrill.ca/inquiries";

  const subject = admin ? "New private dining inquiry submitted" : "We received your private dining inquiry";
  const html = `
  <div style="font-family: 'Cormorant Garamond', Georgia, serif; background:#0b0907; color:#ffffff; padding:32px;">
    <div style="max-width:640px; margin:0 auto; border:1px solid #2e231a; border-radius:16px; background:#14100c; padding:28px;">
      <div style="text-transform:uppercase; letter-spacing:0.28em; color:#d7b36a; font-size:12px;">Toscana Italian Grill</div>
      <h1 style="margin:12px 0 8px; font-family:'Cinzel', Georgia, serif; color:#f0d9a2; font-size:26px;">
        ${admin ? "New inquiry received" : "Your inquiry is in"}
      </h1>
      <p style="color:#e6d8c4; margin:0 0 20px;">
        ${admin ? `New inquiry from ${inquiry.contactName}.` : `Thanks, ${inquiry.contactName}. We’ll review your request and reach out soon.`}
      </p>
      <div style="border-top:1px solid #2e231a; padding-top:16px; margin-top:12px;">
        <div style="display:flex; flex-wrap:wrap; gap:16px;">
          <div style="flex:1 1 220px;">
            <div style="text-transform:uppercase; letter-spacing:0.2em; font-size:11px; color:#d7b36a;">Event</div>
            <div style="font-size:16px; margin-top:6px;">${eventDate} at ${eventTime}</div>
            <div style="color:#e6d8c4;">Guests: ${guestCount}</div>
            <div style="color:#e6d8c4;">Occasion: ${inquiry.occasionType || "TBD"}</div>
          </div>
          <div style="flex:1 1 220px;">
            <div style="text-transform:uppercase; letter-spacing:0.2em; font-size:11px; color:#d7b36a;">Room & Menu</div>
            <div style="font-size:16px; margin-top:6px;">Room: ${roomLabel}</div>
            <div style="color:#e6d8c4;">Menu style: ${styleLabel}</div>
          </div>
        </div>
      </div>
      <div style="border-top:1px solid #2e231a; padding-top:16px; margin-top:16px;">
        <div style="text-transform:uppercase; letter-spacing:0.2em; font-size:11px; color:#d7b36a;">Menu Selections</div>
        <div style="color:#e6d8c4; margin-top:8px; line-height:1.6;">${menuSummary || "Menu selections will be finalized with the team."}</div>
      </div>
      <div style="border-top:1px solid #2e231a; padding-top:16px; margin-top:16px;">
        <div style="text-transform:uppercase; letter-spacing:0.2em; font-size:11px; color:#d7b36a;">Estimate</div>
        <div style="color:#e6d8c4; margin-top:6px;">
          Per person: ${formatCurrency(inquiry.estimatedPricePerPerson)} · Total: ${formatCurrency(inquiry.estimatedTotal)}
        </div>
      </div>
      ${
        admin
          ? `<p style="color:#e6d8c4; margin-top:20px;">Review in the admin panel: <a href="${reviewLink}" style="color:#f0d9a2;">${reviewLink}</a></p>`
          : depositInfo
          ? `<p style="color:#e6d8c4; margin-top:20px;">A $${depositInfo.amount} deposit is required within 3 days to hold your booking. Pay here: <a href="${depositInfo.link}" style="color:#f0d9a2;">${depositInfo.link}</a></p>`
          : `<p style="color:#e6d8c4; margin-top:20px;">No deposit is required for events under 10 guests. We’ll confirm availability and next steps by email or phone.</p>`
      }
    </div>
  </div>
  `;

  const text = `${admin ? "New private dining inquiry submitted." : "Your inquiry is in."}\n\nEvent: ${eventDate} at ${eventTime}\nGuests: ${guestCount}\nOccasion: ${inquiry.occasionType || "TBD"}\nRoom: ${roomLabel}\nMenu style: ${styleLabel}\n\nMenu selections:\n${menuSummary || "Menu selections will be finalized with the team."}\n\nEstimate: Per person ${formatCurrency(
    inquiry.estimatedPricePerPerson
  )} · Total ${formatCurrency(inquiry.estimatedTotal)}${
    admin
      ? `\n\nReview: ${reviewLink}`
      : depositInfo
      ? `\n\nDeposit required: $${depositInfo.amount}. Pay here: ${depositInfo.link}`
      : "\n\nNo deposit is required for events under 10 guests. We’ll confirm availability and next steps by email or phone."
  }`;

  return { subject, html, text };
};

export const buildInquiryStatusEmail = (params: {
  inquiry: EventInquiry;
  status: "new" | "reviewing" | "approved" | "declined";
}) => {
  const { inquiry, status } = params;
  const depositInfo = (() => {
    const count = inquiry.guestCount || 0;
    if (count < 10) return null;
    if (count <= 15) {
      return {
        amount: 200,
        link: "https://buy.stripe.com/eVq9ASeGE7p18XV5N23oA01",
      };
    }
    if (count <= 30) {
      return {
        amount: 500,
        link: "https://buy.stripe.com/dRm6oGgOMaBd0rp6R63oA02",
      };
    }
    return {
      amount: 1000,
      link: "https://buy.stripe.com/6oU00idCA5gT0rpcbq3oA03",
    };
  })();

  const subjectMap: Record<string, string> = {
    new: "Your inquiry is received",
    reviewing: "Your inquiry is being reviewed",
    approved: "Your private dining request is confirmed",
    declined: "Update on your private dining request",
  };
  const messageMap: Record<string, string> = {
    new: "We’ve received your inquiry and will follow up shortly.",
    reviewing: "Our team is reviewing your request now. Please complete the deposit within 3 days to hold your booking.",
    approved: "Great news! Your private dining request is confirmed.",
    declined: "We’re sorry, but we can’t accommodate this request as submitted.",
  };

  const subject = subjectMap[status] || "Update on your inquiry";
  const depositLine =
    status === "reviewing"
      ? depositInfo
        ? `Deposit required: $${depositInfo.amount}. Pay here: ${depositInfo.link}`
        : "No deposit is required for events under 10 guests."
      : "";
  const html = `
  <div style="font-family: 'Cormorant Garamond', Georgia, serif; background:#0b0907; color:#ffffff; padding:32px;">
    <div style="max-width:640px; margin:0 auto; border:1px solid #2e231a; border-radius:16px; background:#14100c; padding:28px;">
      <div style="text-transform:uppercase; letter-spacing:0.28em; color:#d7b36a; font-size:12px;">Toscana Italian Grill</div>
      <h1 style="margin:12px 0 8px; font-family:'Cinzel', Georgia, serif; color:#f0d9a2; font-size:26px;">
        ${subject}
      </h1>
      <p style="color:#e6d8c4; margin:0 0 20px;">
        ${messageMap[status] || "We’ll be in touch shortly."}
      </p>
      ${status === "reviewing" ? `<p style="color:#e6d8c4; margin:0 0 20px;">${depositLine}</p>` : ""}
      <div style="border-top:1px solid #2e231a; padding-top:16px; margin-top:12px;">
        <div style="text-transform:uppercase; letter-spacing:0.2em; font-size:11px; color:#d7b36a;">Event</div>
        <div style="font-size:16px; margin-top:6px;">${inquiry.eventDate} at ${inquiry.eventTime}</div>
        <div style="color:#e6d8c4;">Guests: ${inquiry.guestCount}</div>
      </div>
    </div>
  </div>
  `;

  const text = `Toscana Italian Grill\n\n${subject}\n\n${messageMap[status] || "We’ll be in touch shortly."}${
    depositLine ? `\n${depositLine}` : ""
  }\nEvent: ${inquiry.eventDate} at ${inquiry.eventTime}\nGuests: ${inquiry.guestCount}`;

  return { subject, html, text };
};
