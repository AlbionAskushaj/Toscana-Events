import { useEffect, useMemo, useRef, useState } from "react";
import Stepper from "../components/Stepper";
import EventDetailsForm from "../components/EventDetailsForm";
import MenuBuilder from "../components/MenuBuilder";
import SeatingConfigurator from "../components/SeatingConfigurator";
import PricingSummary from "../components/PricingSummary";
import InquiryReview from "../components/InquiryReview";
import {
  getMenuCategories,
  getMenuItems,
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
  RoomLayout,
  InquiryFormState,
  PricingSummary as Pricing,
  CreateInquiryPayload,
} from "../types";

const steps = ["Event Details", "Menu", "Seating", "Review & Submit"];
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
  const [form, setForm] = useState<InquiryFormState>({
    eventDetails: initialEventDetails,
    menuSelection: { courses: [{ courseType: "Course 1", itemIds: [] }] },
    seatingConfig: { tablesFor2: 0, tablesFor4: 0, tablesFor6: 0, longTables: 0, selectedTableIds: [], combinedGroups: [] },
    roomLayoutId: "",
  });
  const [pricing, setPricing] = useState<Pricing>(initialPricing);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [localDraft, setLocalDraft] = useState<LocalDraft | null>(null);
  const [localDraftAvailable, setLocalDraftAvailable] = useState(false);
  const [draftEmail, setDraftEmail] = useState("");
  const [lookupEmail, setLookupEmail] = useState("");
  const [serverDrafts, setServerDrafts] = useState<Array<{ id: string; email: string; data: any; createdAt: string; updatedAt: string }>>([]);
  const [serverDraftId, setServerDraftId] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState("");
  const saveTimerRef = useRef<number | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!form.eventDetails.isBuyout && form.seatingConfig.tables) {
      setForm((prev) => ({ ...prev, seatingConfig: { ...prev.seatingConfig, tables: undefined } }));
    }
  }, [form.eventDetails.isBuyout]);

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
    if (!initializedRef.current) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      const payload: LocalDraft = {
        form,
        currentStep,
        updatedAt: new Date().toISOString(),
        serverDraftId: serverDraftId || undefined,
        email: draftEmail || undefined,
      };
      try {
        localStorage.setItem(LOCAL_DRAFT_KEY, JSON.stringify(payload));
        setLocalDraft(payload);
      } catch (err) {
        console.error(err);
      }
    }, 500);
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [form, currentStep, serverDraftId, draftEmail]);

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, menuItems, roomLayouts] = await Promise.all([
          getMenuCategories(),
          getMenuItems({ active: true }),
          getRooms(),
        ]);
        const uniqueItems = Array.from(new Map(menuItems.map((i) => [i._id, i])).values());
        setCategories(cats);
        setItems(uniqueItems);
        setRooms(roomLayouts);
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

  const applyDraft = (draft: LocalDraft) => {
    setForm(draft.form);
    setCurrentStep(draft.currentStep || 0);
    setLocalDraftAvailable(false);
    setDraftNotice("Draft restored.");
  };

  const clearLocalDraft = () => {
    localStorage.removeItem(LOCAL_DRAFT_KEY);
    setLocalDraftAvailable(false);
    setLocalDraft(null);
    setServerDraftId(null);
    setDraftEmail("");
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
      currentStep: draft.data.currentStep || 0,
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
          form.eventDetails.contactPhone &&
          form.eventDetails.eventDate &&
          form.eventDetails.eventTime &&
          form.eventDetails.guestCount
      );
    }
    if (currentStep === 1) {
      return form.menuSelection.courses.some((course) => course.itemIds.length > 0);
    }
    if (currentStep === 2) {
      return Boolean(form.roomLayoutId);
    }
    return true;
  }, [currentStep, form]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
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
      specialRequests: form.eventDetails.specialRequests,
    };

    try {
      await createInquiry(payload);
      setSuccessMessage("Thank you, your private dining inquiry has been submitted. We will contact you shortly.");
      clearLocalDraft();
      setForm({
        eventDetails: initialEventDetails,
        menuSelection: { courses: [{ courseType: "Course 1", itemIds: [] }] },
        seatingConfig: { tablesFor2: 0, tablesFor4: 0, tablesFor6: 0, longTables: 0, selectedTableIds: [], combinedGroups: [] },
        roomLayoutId: rooms[0]?._id || "",
      });
      setCurrentStep(0);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to submit inquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedRoom = rooms.find((r) => r._id === form.roomLayoutId);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
        <div>
          <p className="eyebrow mb-1">Private Dining Builder</p>
          <h2 className="mb-0">Build your event</h2>
        </div>
        <div className="flex-grow-1">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>
      </div>

      {draftNotice && <div className="alert alert-info">{draftNotice}</div>}
      {localDraftAvailable && localDraft && (
        <div className="alert alert-light border d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            Resume your last draft from{" "}
            <strong>{new Date(localDraft.updatedAt).toLocaleString()}</strong>.
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => applyDraft(localDraft)}>
              Resume
            </button>
            <button className="btn btn-outline-danger btn-sm" onClick={clearLocalDraft}>
              Discard
            </button>
          </div>
        </div>
      )}
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-lg-6">
              <h3 className="h6">Save to Email</h3>
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
              <h3 className="h6">Resume from Email</h3>
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
                <div className="table-responsive mt-2">
                  <table className="table table-sm align-middle">
                    <thead>
                      <tr>
                        <th>Last Updated</th>
                        <th>Details</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {serverDrafts.map((draft) => {
                        const details = draft.data?.form?.eventDetails;
                        return (
                          <tr key={draft.id}>
                            <td>{new Date(draft.updatedAt).toLocaleString()}</td>
                            <td>
                              {details?.contactName || "Draft"}{" "}
                              {details?.eventDate ? `· ${details.eventDate}` : ""}
                            </td>
                            <td>
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => handleLoadServerDraft(draft)}
                              >
                                Load
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {errorMessage && <div className="alert alert-warning">{errorMessage}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {currentStep === 0 && (
        <EventDetailsForm
          value={form.eventDetails}
          onChange={(value) => setForm((prev) => ({ ...prev, eventDetails: value }))}
        />
      )}

      {currentStep === 1 && (
        <>
        <div className="alert alert-light border">
          <strong>Per-person estimate:</strong> ${pricing.estimatedPricePerPerson.toFixed(2)} based on current selections.
        </div>
          <MenuBuilder
            categories={categories}
            items={items}
            selection={form.menuSelection}
            onChange={(selection) => setForm((prev) => ({ ...prev, menuSelection: selection }))}
          />
        </>
      )}

      {currentStep === 2 && (
        <SeatingConfigurator
          rooms={rooms}
          roomLayoutId={form.roomLayoutId}
          seatingConfig={form.seatingConfig}
          isBuyout={form.eventDetails.isBuyout}
          guestCount={form.eventDetails.guestCount}
          onChange={(roomLayoutId, seatingConfig) => setForm((prev) => ({ ...prev, roomLayoutId, seatingConfig }))}
        />
      )}

      {currentStep === 3 && (
        <InquiryReview
          eventDetails={form.eventDetails}
          seatingConfig={form.seatingConfig}
          room={selectedRoom}
          courses={form.menuSelection.courses}
          items={items}
          pricing={pricing}
          onEditStep={(step) => setCurrentStep(step)}
        />
      )}

      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <button className="btn btn-outline-secondary" disabled={currentStep === 0} onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}>
          Back
        </button>
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
  );
};

export default EventBuilderPage;
