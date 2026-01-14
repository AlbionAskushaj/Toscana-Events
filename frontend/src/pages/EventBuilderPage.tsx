import { useEffect, useMemo, useRef, useState } from "react";
import Stepper from "../components/Stepper";
import EventDetailsForm from "../components/EventDetailsForm";
import MenuBuilder from "../components/MenuBuilder";
import SeatingConfigurator from "../components/SeatingConfigurator";
import PricingSummary from "../components/PricingSummary";
import InquiryReview from "../components/InquiryReview";
import { buildTemplateCourses, fallbackMenuTemplates } from "../components/menuTemplates";
import {
  getMenuCategories,
  getMenuItems,
  getMenuTemplates,
  getRooms,
  createInquiry,
  createDraft,
  listDraftsByEmail,
  updateDraft,
} from "../api";
import type {
  EventDetailsInput,
  MenuCategory,
  MenuItem,
  MenuTemplate,
  RoomLayout,
  InquiryFormState,
  PricingSummary as Pricing,
  CreateInquiryPayload,
} from "../types";

const steps = [
  "Contact",
  "Event Basics",
  "Buyout",
  "Room Preference",
  "Menu Style",
  "Menu Courses",
  "Seating",
  "Review & Submit",
];
const LOCAL_DRAFT_KEY = "toscana:draft:v1";

type LocalDraft = {
  form: InquiryFormState;
  currentStep: number;
  updatedAt: string;
  serverDraftId?: string;
  email?: string;
};

const initialEventDetails: EventDetailsInput = {
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  occasionType: "",
  eventDate: "",
  eventTime: "",
  guestCount: 0,
  dietaryNotes: "",
  specialRequests: "",
  isBuyout: false,
  buyoutAmount: undefined,
  buyoutDetails: "",
};

const initialPricing: Pricing = {
  estimatedPricePerPerson: 0,
  estimatedSubtotal: 0,
  estimatedServiceCharge: 0,
  estimatedTax: 0,
  estimatedTotal: 0,
};

function computePricing(selection: { courses: { itemIds: string[] }[] }, items: MenuItem[], guestCount: number, isBuyout?: boolean, buyoutAmount?: number): Pricing {
  if (isBuyout && buyoutAmount) {
    const perPerson = guestCount ? buyoutAmount / guestCount : buyoutAmount;
    return {
      estimatedPricePerPerson: perPerson,
      estimatedSubtotal: buyoutAmount,
      estimatedServiceCharge: 0,
      estimatedTax: 0,
      estimatedTotal: buyoutAmount,
    };
  }
  const itemMap = new Map(items.map((i) => [i._id, i]));
  const estimatedPricePerPerson = selection.courses.reduce((sum, course) => {
    const courseItems = course.itemIds.map((id) => itemMap.get(id)).filter(Boolean) as MenuItem[];
    if (courseItems.length === 0) return sum;
    const avg = courseItems.reduce((s, i) => s + i.pricePerPerson, 0) / courseItems.length;
    return sum + avg;
  }, 0);
  const estimatedSubtotal = estimatedPricePerPerson * (guestCount || 0);
  const estimatedServiceCharge = estimatedSubtotal * 0.18;
  const estimatedTax = (estimatedSubtotal + estimatedServiceCharge) * 0.05;
  const estimatedTotal = estimatedSubtotal + estimatedServiceCharge + estimatedTax;
  return {
    estimatedPricePerPerson,
    estimatedSubtotal,
    estimatedServiceCharge,
    estimatedTax,
    estimatedTotal,
  };
}

const EventBuilderPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [rooms, setRooms] = useState<RoomLayout[]>([]);
  const [templates, setTemplates] = useState<MenuTemplate[]>([]);
  const [form, setForm] = useState<InquiryFormState>({
    eventDetails: initialEventDetails,
    menuSelection: { courses: [{ courseType: "Course 1", itemIds: [] }] },
    seatingConfig: { tablesFor2: 0, tablesFor4: 0, tablesFor6: 0, longTables: 0, selectedTableIds: [], combinedGroups: [] },
    roomLayoutId: "",
    roomFlexibility: "flexible",
    menuStyleId: fallbackMenuTemplates[0]._id,
  });
  const [pricing, setPricing] = useState<Pricing>(initialPricing);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [successDeposit, setSuccessDeposit] = useState<{ amount: number; link: string } | null>(null);
  const [successNoDeposit, setSuccessNoDeposit] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [localDraft, setLocalDraft] = useState<LocalDraft | null>(null);
  const [localDraftAvailable, setLocalDraftAvailable] = useState(false);
  const [draftEmail, setDraftEmail] = useState("");
  const [lookupEmail, setLookupEmail] = useState("");
  const [serverDrafts, setServerDrafts] = useState<Array<{ id: string; email: string; data: any; createdAt: string; updatedAt: string }>>([]);
  const [serverDraftId, setServerDraftId] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState("");
  const [isDraftOpen, setIsDraftOpen] = useState(false);
  const saveTimerRef = useRef<number | null>(null);
  const initializedRef = useRef(false);
  const stepRef = useRef(0);

  useEffect(() => {
    if (!form.eventDetails.isBuyout && form.seatingConfig.tables) {
      setForm((prev) => ({ ...prev, seatingConfig: { ...prev.seatingConfig, tables: undefined } }));
    }
  }, [form.eventDetails.isBuyout]);

  const normalizeStep = (value: unknown) => {
    const step = Number(value);
    if (!Number.isFinite(step)) return 0;
    return Math.max(0, Math.min(steps.length - 1, step));
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    try {
      const stored = localStorage.getItem(LOCAL_DRAFT_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as LocalDraft;
      if (parsed?.form) {
        setLocalDraft(parsed);
        setLocalDraftAvailable(true);
        setServerDraftId(parsed.serverDraftId || null);
        setDraftEmail(parsed.email || "");
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (localDraft) return;
    const cookie = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("toscana_step="));
    if (!cookie) return;
    const raw = decodeURIComponent(cookie.split("=")[1] || "");
    const step = Number(raw);
    if (Number.isFinite(step)) {
      setCurrentStep(normalizeStep(step));
    }
  }, [localDraft]);

  useEffect(() => {
    if (!initializedRef.current) return;
    const nextStep = normalizeStep(currentStep);

    const persistDraft = () => {
      const payload: LocalDraft = {
        form,
        currentStep: nextStep,
        updatedAt: new Date().toISOString(),
        serverDraftId: serverDraftId || undefined,
        email: draftEmail || undefined,
      };
      try {
        localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(payload));
        setLocalDraft(payload);
        document.cookie = `toscana_step=${encodeURIComponent(String(nextStep))}; Max-Age=1209600; Path=/; SameSite=Lax`;
      } catch (err) {
        console.error(err);
      }
    };

    if (stepRef.current !== nextStep) {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      stepRef.current = nextStep;
      persistDraft();
      return;
    }

    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(persistDraft, 500);
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [form, currentStep, serverDraftId, draftEmail]);

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, menuItems, roomLayouts, templateData] = await Promise.all([
          getMenuCategories(),
          getMenuItems({ active: true }),
          getRooms(),
          getMenuTemplates(),
        ]);
        const uniqueItems = Array.from(new Map(menuItems.map((i) => [i._id, i])).values());
        setCategories(cats);
        setItems(uniqueItems);
        setRooms(roomLayouts);
        setTemplates(templateData || []);
        if (!form.roomLayoutId && roomLayouts[0]) {
          setForm((prev) => ({ ...prev, roomLayoutId: roomLayouts[0]._id, seatingConfig: roomLayouts[0].defaultTableConfig }));
        }
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to load menu or rooms.");
    }
  }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPricing(computePricing(form.menuSelection, items, form.eventDetails.guestCount, form.eventDetails.isBuyout, form.eventDetails.buyoutAmount));
  }, [form.menuSelection, form.eventDetails.guestCount, form.eventDetails.isBuyout, form.eventDetails.buyoutAmount, items]);

  useEffect(() => {
    if (templates.length === 0) return;
    const matches = templates.some((template) => template._id === form.menuStyleId);
    if (!matches) {
      const nextTemplate = templates[0];
      const courses = buildTemplateCourses(nextTemplate, items);
      setForm((prev) => ({
        ...prev,
        menuStyleId: nextTemplate._id,
        menuSelection: courses.length > 0 ? { courses } : prev.menuSelection,
      }));
    }
  }, [templates, form.menuStyleId, items]);

  useEffect(() => {
    const isBlank =
      form.menuSelection.courses.length === 1 &&
      form.menuSelection.courses[0].courseType === "Course 1" &&
      form.menuSelection.courses[0].itemIds.length === 0;
    if (items.length > 0 && isBlank) {
      const list = templates.length > 0 ? templates : fallbackMenuTemplates;
      const template = list.find((t) => t._id === form.menuStyleId) || list[0];
      const courses = buildTemplateCourses(template, items);
      setForm((prev) => ({ ...prev, menuSelection: { courses } }));
    }
  }, [items, form.menuSelection, form.menuStyleId, templates]);

  const applyDraft = (draft: LocalDraft) => {
    setForm((prev) => ({
      ...prev,
      ...draft.form,
      roomFlexibility: draft.form.roomFlexibility || "flexible",
      menuStyleId: draft.form.menuStyleId || fallbackMenuTemplates[0]._id,
    }));
    setCurrentStep(normalizeStep(draft.currentStep));
    setLocalDraftAvailable(false);
    setDraftNotice("Draft restored.");
  };

  const clearLocalDraft = () => {
    localStorage.removeItem(LOCAL_DRAFT_KEY);
    setLocalDraftAvailable(false);
    setLocalDraft(null);
    setServerDraftId(null);
    setDraftEmail("");
    document.cookie = "toscana_step=; Max-Age=0; Path=/; SameSite=Lax";
  };

  const handleSaveToEmail = async () => {
    if (!draftEmail) {
      setDraftNotice("Enter an email to save this draft.");
      return;
    }
    try {
      const payload = { form, currentStep };
      const saved = serverDraftId
        ? await updateDraft(serverDraftId, draftEmail, payload)
        : await createDraft(draftEmail, payload);
      setServerDraftId(saved.id);
      setDraftNotice("Draft saved to email.");
    } catch (err) {
      console.error(err);
      setDraftNotice("Failed to save draft to email.");
    }
  };

  const handleLookupDrafts = async () => {
    if (!lookupEmail) {
      setDraftNotice("Enter an email to find drafts.");
      return;
    }
    try {
      const drafts = await listDraftsByEmail(lookupEmail);
      setServerDrafts(drafts);
      if (drafts.length === 0) {
        setDraftNotice("No drafts found for that email.");
      } else {
        setDraftNotice("");
      }
    } catch (err) {
      console.error(err);
      setDraftNotice("Failed to load drafts.");
    }
  };

  const handleLoadServerDraft = (draft: { id: string; data: any; email: string }) => {
    if (!draft?.data?.form) {
      setDraftNotice("Draft data is invalid.");
      return;
    }
    const local: LocalDraft = {
      form: draft.data.form,
      currentStep: normalizeStep(draft.data.currentStep),
      updatedAt: new Date().toISOString(),
      serverDraftId: draft.id,
      email: draft.email,
    };
    applyDraft(local);
    setDraftEmail(draft.email);
    setServerDraftId(draft.id);
  };

  const canGoNext = useMemo(() => {
    if (currentStep === 0) {
      return Boolean(
        form.eventDetails.contactName &&
          form.eventDetails.contactEmail &&
          form.eventDetails.contactPhone
      );
    }
    if (currentStep === 1) {
      return Boolean(
        form.eventDetails.occasionType &&
          form.eventDetails.eventDate &&
          form.eventDetails.eventTime &&
          form.eventDetails.guestCount
      );
    }
    if (currentStep === 2) {
      return true;
    }
    if (currentStep === 3) {
      return Boolean(form.roomLayoutId);
    }
    if (currentStep === 4) {
      return form.menuSelection.courses.length > 0;
    }
    if (currentStep === 5) {
      return form.menuSelection.courses.some((course) => course.itemIds.length > 0);
    }
    return true;
  }, [currentStep, form]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMessage("");
    setMissingFields([]);
    setSuccessMessage("");
    if (
      !form.eventDetails.contactName ||
      !form.eventDetails.contactEmail ||
      !form.eventDetails.contactPhone ||
      !form.eventDetails.occasionType ||
      !form.eventDetails.eventDate ||
      !form.eventDetails.eventTime ||
      !form.eventDetails.guestCount ||
      !form.roomLayoutId ||
      form.menuSelection.courses.length === 0
    ) {
      const missing: string[] = [];
      if (!form.eventDetails.contactName) missing.push("contactName");
      if (!form.eventDetails.contactEmail) missing.push("contactEmail");
      if (!form.eventDetails.contactPhone) missing.push("contactPhone");
      if (!form.eventDetails.occasionType) missing.push("occasionType");
      if (!form.eventDetails.eventDate) missing.push("eventDate");
      if (!form.eventDetails.eventTime) missing.push("eventTime");
      if (!form.eventDetails.guestCount) missing.push("guestCount");
      if (!form.roomLayoutId) missing.push("roomLayoutId");
      if (form.menuSelection.courses.length === 0) missing.push("menuSelection");
      setMissingFields(missing);
      setErrorMessage("Please complete the required fields before submitting.");
      setSubmitting(false);
      return;
    }
    const buyoutDetails = form.eventDetails.buyoutDetails?.trim();
    const specialRequests = [
      form.eventDetails.specialRequests?.trim(),
      buyoutDetails ? `Buyout details: ${buyoutDetails}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const payload: CreateInquiryPayload = {
      isBuyout: form.eventDetails.isBuyout,
      buyoutAmount: form.eventDetails.buyoutAmount,
      contactName: form.eventDetails.contactName,
      contactEmail: form.eventDetails.contactEmail,
      contactPhone: form.eventDetails.contactPhone,
      occasionType: form.eventDetails.occasionType,
      eventDate: form.eventDetails.eventDate,
      eventTime: form.eventDetails.eventTime,
      guestCount: form.eventDetails.guestCount,
      seatingConfig: form.seatingConfig,
      roomLayoutId: form.roomLayoutId,
      menuSelection: form.menuSelection,
      dietaryNotes: form.eventDetails.dietaryNotes,
      specialRequests,
    };

    const depositInfo = (() => {
      const count = form.eventDetails.guestCount;
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

    try {
      await createInquiry(payload);
      if (depositInfo) {
        setSuccessMessage(
          `Success! Your enquiry is in. A $${depositInfo.amount} deposit is required within 3 days to hold your booking.`
        );
        setSuccessDeposit(depositInfo);
        setSuccessNoDeposit(false);
      } else {
        setSuccessMessage("Success! Your enquiry is in.");
        setSuccessDeposit(null);
        setSuccessNoDeposit(true);
      }
      clearLocalDraft();
      setForm({
        eventDetails: initialEventDetails,
        menuSelection: { courses: [{ courseType: "Course 1", itemIds: [] }] },
        seatingConfig: { tablesFor2: 0, tablesFor4: 0, tablesFor6: 0, longTables: 0, selectedTableIds: [], combinedGroups: [] },
        roomLayoutId: rooms[0]?._id || "",
        roomFlexibility: "flexible",
        menuStyleId: fallbackMenuTemplates[0]._id,
      });
      setCurrentStep(0);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Failed to submit inquiry.";
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRoom = rooms.find((r) => r._id === form.roomLayoutId);

  return (
    <div className="page page-builder">
      <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
        <div>
          <p className="eyebrow mb-1">Private Dining Builder</p>
          <h2 className="mb-0">Build your event</h2>
          <p className="text-muted mb-0">One small step at a time. You can pause and come back.</p>
        </div>
        <div className="flex-grow-1">
          <Stepper
            steps={steps}
            currentStep={currentStep}
            onStepClick={(step) => setCurrentStep(step)}
          />
        </div>
        <div className="draft-toggle-wrap">
          <button
            className="btn btn-outline-secondary draft-toggle"
            type="button"
            onClick={() => setIsDraftOpen((open) => !open)}
          >
            Save / Resume
          </button>
          {!isDraftOpen && (
            <div className="draft-hint">
              <span className="draft-arrow">➜</span>
              Hey, save your progress here so you don’t have to start from scratch.
            </div>
          )}
        </div>
      </div>

      {draftNotice && <div className="alert alert-info">{draftNotice}</div>}
      <div className={`draft-drawer ${isDraftOpen ? "open" : ""}`}>
        <div className="card mb-3">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
              <div>
                <h3 className="h5 mb-1">Save or resume later (optional)</h3>
                <p className="text-muted mb-0">Use your email to store progress. We won’t send anything.</p>
              </div>
              <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => setIsDraftOpen(false)}>
                Close
              </button>
            </div>
            <div className="row g-3">
              <div className="col-12 col-lg-6">
                <h3 className="h6">Save my progress</h3>
                <p className="text-muted small mb-2">Type your email, then press save.</p>
                <div className="input-group">
                  <input
                    className="form-control"
                    type="email"
                    placeholder="you@email.com"
                    value={draftEmail}
                    onChange={(e) => setDraftEmail(e.target.value)}
                  />
                  <button className="btn btn-outline-primary" onClick={handleSaveToEmail}>
                    {serverDraftId ? "Update Draft" : "Save Draft"}
                  </button>
                </div>
                <div className="form-text">Saves your current progress for 30 days.</div>
              </div>
              <div className="col-12 col-lg-6">
                <h3 className="h6">Continue where I left off</h3>
                <p className="text-muted small mb-2">Enter the same email you saved with.</p>
                <div className="input-group">
                  <input
                    className="form-control"
                    type="email"
                    placeholder="you@email.com"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                  />
                  <button className="btn btn-outline-secondary" onClick={handleLookupDrafts}>
                    Find Drafts
                  </button>
                </div>
                {serverDrafts.length > 0 && (
                  <div className="draft-list mt-3">
                    {serverDrafts.map((draft) => {
                      const details = draft.data?.form?.eventDetails;
                      return (
                        <div key={draft.id} className="draft-card">
                          <div>
                            <div className="draft-title">
                              {details?.contactName || "Saved draft"}
                            </div>
                            <div className="text-muted small">
                              Last updated {new Date(draft.updatedAt).toLocaleString()}
                            </div>
                            {details?.eventDate && (
                              <div className="text-muted small">
                                Event date: {details.eventDate}
                              </div>
                            )}
                          </div>
                          <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => handleLoadServerDraft(draft)}
                          >
                            Resume
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-warning">
          <div>{errorMessage}</div>
          {missingFields.length > 0 && (
            <div className="mt-2">
              Missing:
              <div className="d-flex flex-wrap gap-2 mt-2">
                {missingFields.includes("contactName") ||
                missingFields.includes("contactEmail") ||
                missingFields.includes("contactPhone") ? (
                  <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => setCurrentStep(0)}>
                    Contact
                  </button>
                ) : null}
                {missingFields.includes("occasionType") ||
                missingFields.includes("eventDate") ||
                missingFields.includes("eventTime") ||
                missingFields.includes("guestCount") ? (
                  <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => setCurrentStep(1)}>
                    Event Basics
                  </button>
                ) : null}
                {missingFields.includes("roomLayoutId") ? (
                  <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => setCurrentStep(3)}>
                    Room Preference
                  </button>
                ) : null}
                {missingFields.includes("menuSelection") ? (
                  <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => setCurrentStep(5)}>
                    Menu Courses
                  </button>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success">
          <div>{successMessage}</div>
          {successDeposit && (
            <div className="mt-2">
              Please pay your deposit here:{" "}
              <a href={successDeposit.link} target="_blank" rel="noreferrer">
                ${successDeposit.amount} deposit link
              </a>
            </div>
          )}
          {successNoDeposit && (
            <div className="mt-2">No deposit is required for events under 10 guests.</div>
          )}
        </div>
      )}

      <div className="step-panel" key={currentStep}>
        {currentStep === 0 && (
          <EventDetailsForm
            value={form.eventDetails}
            onChange={(value) => setForm((prev) => ({ ...prev, eventDetails: value }))}
            mode="contact"
          />
        )}

        {currentStep === 1 && (
          <EventDetailsForm
            value={form.eventDetails}
            onChange={(value) => setForm((prev) => ({ ...prev, eventDetails: value }))}
            mode="basics"
          />
        )}

        {currentStep === 2 && (
          <EventDetailsForm
            value={form.eventDetails}
            onChange={(value) => setForm((prev) => ({ ...prev, eventDetails: value }))}
            mode="buyout"
          />
        )}

        {currentStep === 3 && (
          <div className="card">
            <div className="card-body">
              <p className="text-muted">Choose your preferred room. We can adjust after review.</p>
              <div className="row g-3">
                <div className="col-12 col-lg-6">
                  <label className="form-label">Preferred Room</label>
                  <select
                    className="form-select"
                    value={form.roomLayoutId}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, roomLayoutId: e.target.value }))
                    }
                  >
                    {rooms.map((room) => (
                      <option key={room._id} value={room._id}>
                        {room.name} (Capacity {room.capacity})
                      </option>
                    ))}
                  </select>
                  <div className="form-text">Pick what looks closest to your event.</div>
                </div>
                <div className="col-12 col-lg-6 d-flex align-items-end">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={form.roomFlexibility === "flexible"}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          roomFlexibility: e.target.checked ? "flexible" : "specific",
                        }))
                      }
                      id="room-flex"
                    />
                    <label className="form-check-label" htmlFor="room-flex">
                      I am flexible if this room is unavailable
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="card">
            <div className="card-body">
              <h3 className="h5 mb-1">Choose a Menu Style</h3>
              <p className="text-muted">Pick a starting point. You can customize courses next.</p>
              <div className="menu-style-grid">
                {(templates.length > 0 ? templates : fallbackMenuTemplates).map((template) => (
                  <button
                    key={template._id}
                    className={`menu-style-card ${form.menuStyleId === template._id ? "active" : ""}`}
                    type="button"
                    onClick={() => {
                      const courses = buildTemplateCourses(template, items);
                      setForm((prev) => ({
                        ...prev,
                        menuStyleId: template._id,
                        menuSelection: { courses },
                      }));
                    }}
                  >
                    <div className="menu-style-title">{template.name}</div>
                    <div className="menu-style-desc">{template.description}</div>
                    <div className="menu-style-courses">
                      {(template.courses || []).map((course) => (
                        <span key={course.name} className="menu-style-chip">
                          {course.name}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <>
            <div className="alert alert-light border">
              <strong>Per-person estimate:</strong> ${pricing.estimatedPricePerPerson.toFixed(2)} based on current selections.
            </div>
            <MenuBuilder
              categories={categories}
              items={items}
              selection={form.menuSelection}
              onChange={(selection) => setForm((prev) => ({ ...prev, menuSelection: selection }))}
              showTemplateControls={false}
            />
          </>
        )}

        {currentStep === 6 && (
          <>
            <div className="alert alert-light border">
              <strong>Room:</strong> {selectedRoom?.name || "Select a room"} ·{" "}
              {form.roomFlexibility === "flexible" ? "Flexible if needed" : "Specific room required"}
            </div>
            <SeatingConfigurator
              rooms={rooms}
              roomLayoutId={form.roomLayoutId}
              seatingConfig={form.seatingConfig}
              isBuyout={form.eventDetails.isBuyout}
              guestCount={form.eventDetails.guestCount}
              onChange={(roomLayoutId, seatingConfig) => setForm((prev) => ({ ...prev, roomLayoutId, seatingConfig }))}
              showRoomSelect={false}
            />
          </>
        )}

        {currentStep === 7 && (
          <InquiryReview
            eventDetails={form.eventDetails}
            seatingConfig={form.seatingConfig}
            room={selectedRoom}
            courses={form.menuSelection.courses}
            items={items}
            pricing={pricing}
            roomFlexibility={form.roomFlexibility}
            onEditStep={(step) => setCurrentStep(step)}
          />
        )}
      </div>

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        {currentStep > 0 ? (
          <button className="btn btn-link text-muted" onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}>
            Back
          </button>
        ) : (
          <span />
        )}
        {currentStep < steps.length - 1 && (
          <button className="btn btn-primary" disabled={!canGoNext} onClick={() => setCurrentStep((s) => s + 1)}>
            Next
          </button>
        )}
        {currentStep === steps.length - 1 && (
          <button className="btn btn-primary" disabled={submitting} onClick={handleSubmit}>
            {submitting ? "Submitting..." : "Submit Inquiry"}
          </button>
        )}
      </div>

      <PricingSummary pricing={pricing} guestCount={form.eventDetails.guestCount} />
      </div>
    </div>
  );
};

export default EventBuilderPage;
