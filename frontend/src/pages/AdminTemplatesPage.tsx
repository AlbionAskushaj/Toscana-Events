import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  adminCreateMenuTemplate,
  adminDeleteMenuTemplate,
  adminUpdateMenuTemplate,
  getMenuCategories,
  getMenuItems,
  getMenuTemplates,
} from "../api";
import { fallbackMenuTemplates } from "../components/menuTemplates";
import type { MenuCategory, MenuItem, MenuTemplate } from "../types";

type CourseDraft = {
  name: string;
  selectedItemNames: string[];
  selectionMode?: "fixed" | "choice" | "share";
  maxChoices?: number;
  shareCount?: number;
  defaultCategoryNames?: string[];
};

type TemplateDraft = {
  id?: string;
  name: string;
  description: string;
  sortOrder: number;
  courses: CourseDraft[];
};

const emptyTemplate = (): TemplateDraft => ({
  name: "",
  description: "",
  sortOrder: 0,
  courses: [{ name: "Course 1", selectedItemNames: [], selectionMode: "choice", maxChoices: 1, defaultCategoryNames: [] }],
});

const toDraft = (template: MenuTemplate): TemplateDraft => ({
  id: template._id,
  name: template.name,
  description: template.description,
  sortOrder: template.sortOrder,
  courses: (template.courses || []).map((course) => ({
    name: course.name,
    selectedItemNames: course.suggestedItemNames || [],
    selectionMode: course.selectionMode,
    maxChoices: course.maxChoices,
    shareCount: course.shareCount,
    defaultCategoryNames: course.defaultCategoryNames || [],
  })),
});

const toPayload = (draft: TemplateDraft) => ({
  name: draft.name,
  description: draft.description,
  sortOrder: draft.sortOrder,
  courses: draft.courses
    .map((course) => ({
      name: course.name.trim(),
      suggestedItemNames: course.selectedItemNames.length > 0 ? course.selectedItemNames : undefined,
      selectionMode: course.selectionMode,
      maxChoices: course.selectionMode === "choice" ? course.maxChoices : undefined,
      shareCount: course.selectionMode === "share" ? course.shareCount : undefined,
      defaultCategoryNames: course.defaultCategoryNames?.length ? course.defaultCategoryNames : undefined,
    }))
    .filter((course) => course.name),
});

const AdminTemplatesPage = () => {
  const [templates, setTemplates] = useState<MenuTemplate[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [drafts, setDrafts] = useState<Record<string, TemplateDraft>>({});
  const [newDraft, setNewDraft] = useState<TemplateDraft>(emptyTemplate());
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const [openTemplates, setOpenTemplates] = useState<Set<string>>(new Set());

  const formatPrice = (value: number | null | undefined) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "TBD";
    return `$${value.toFixed(2)}`;
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [templateData, categoryData, itemData] = await Promise.all([
        getMenuTemplates(),
        getMenuCategories(),
        getMenuItems(),
      ]);
      setTemplates(templateData || []);
      setCategories(categoryData || []);
      setItems(itemData || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const next: Record<string, TemplateDraft> = {};
    templates.forEach((template) => {
      next[template._id] = toDraft(template);
    });
    setDrafts(next);
    setOpenTemplates(new Set(templates.length > 0 ? [templates[0]._id] : []));
  }, [templates]);

  useEffect(() => {
    if (categories.length === 0) return;
    setOpenCategories((prev) => {
      if (prev.size > 0) return prev;
      return new Set([categories[0]._id]);
    });
  }, [categories]);

  const updateCourse = (templateId: string | "new", index: number, updates: Partial<CourseDraft>) => {
    if (templateId === "new") {
      setNewDraft((prev) => ({
        ...prev,
        courses: prev.courses.map((course, idx) => (idx === index ? { ...course, ...updates } : course)),
      }));
      return;
    }
    setDrafts((prev) => ({
      ...prev,
      [templateId]: {
        ...prev[templateId],
        courses: prev[templateId].courses.map((course, idx) => (idx === index ? { ...course, ...updates } : course)),
      },
    }));
  };

  const addCourse = (templateId: string | "new") => {
    if (templateId === "new") {
      setNewDraft((prev) => ({
        ...prev,
        courses: [
          ...prev.courses,
          { name: "Course", selectedItemNames: [], selectionMode: "choice", maxChoices: 1, defaultCategoryNames: [] },
        ],
      }));
      return;
    }
    setDrafts((prev) => ({
      ...prev,
      [templateId]: {
        ...prev[templateId],
        courses: [
          ...prev[templateId].courses,
          { name: "Course", selectedItemNames: [], selectionMode: "choice", maxChoices: 1, defaultCategoryNames: [] },
        ],
      },
    }));
  };

  const removeCourse = (templateId: string | "new", index: number) => {
    if (templateId === "new") {
      setNewDraft((prev) => ({ ...prev, courses: prev.courses.filter((_, idx) => idx !== index) }));
      return;
    }
    setDrafts((prev) => ({
      ...prev,
      [templateId]: {
        ...prev[templateId],
        courses: prev[templateId].courses.filter((_, idx) => idx !== index),
      },
    }));
  };

  const normalizeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");

  const toggleCourseItem = (templateId: string | "new", index: number, itemName: string) => {
    const normalized = normalizeName(itemName);
    const update = (courses: CourseDraft[]) =>
      courses.map((course, idx) => {
        if (idx !== index) return course;
        const exists = course.selectedItemNames.some((name) => normalizeName(name) === normalized);
        const nextNames = exists
          ? course.selectedItemNames.filter((name) => normalizeName(name) !== normalized)
          : [...course.selectedItemNames, itemName];
        return { ...course, selectedItemNames: nextNames };
      });

    if (templateId === "new") {
      setNewDraft((prev) => ({ ...prev, courses: update(prev.courses) }));
      return;
    }
    setDrafts((prev) => ({ ...prev, [templateId]: { ...prev[templateId], courses: update(prev[templateId].courses) } }));
  };

  const toggleDefaultCategory = (templateId: string | "new", index: number, categoryName: string) => {
    const update = (courses: CourseDraft[]) =>
      courses.map((course, idx) => {
        if (idx !== index) return course;
        const nextNames = course.defaultCategoryNames || [];
        const exists = nextNames.includes(categoryName);
        const updated = exists ? nextNames.filter((name) => name !== categoryName) : [...nextNames, categoryName];
        return { ...course, defaultCategoryNames: updated };
      });

    if (templateId === "new") {
      setNewDraft((prev) => ({ ...prev, courses: update(prev.courses) }));
      return;
    }
    setDrafts((prev) => ({ ...prev, [templateId]: { ...prev[templateId], courses: update(prev[templateId].courses) } }));
  };

  const toggleTemplate = (id: string) => {
    setOpenTemplates((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCategory = (id: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveTemplate = async (templateId: string) => {
    const draft = drafts[templateId];
    if (!draft?.name) {
      setError("Template name is required");
      return;
    }
    try {
      await adminUpdateMenuTemplate(templateId, toPayload(draft));
      await load();
      setNotice("Template updated");
    } catch (err) {
      console.error(err);
      setError("Failed to update template");
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm("Delete this template?")) return;
    try {
      await adminDeleteMenuTemplate(templateId);
      await load();
      setNotice("Template deleted");
    } catch (err) {
      console.error(err);
      setError("Failed to delete template");
    }
  };

  const createTemplate = async () => {
    if (!newDraft.name) {
      setError("Template name is required");
      return;
    }
    try {
      await adminCreateMenuTemplate(toPayload(newDraft));
      setNewDraft(emptyTemplate());
      await load();
      setNotice("Template added");
    } catch (err) {
      console.error(err);
      setError("Failed to create template");
    }
  };

  const seedTemplates = async () => {
    const existing = new Set(templates.map((template) => template.name));
    const seeds = fallbackMenuTemplates.filter((template) => !existing.has(template.name));
    if (seeds.length === 0) {
      setNotice("Toscana templates already seeded");
      return;
    }
    try {
      for (const template of seeds) {
        await adminCreateMenuTemplate({
          name: template.name,
          description: template.description,
          sortOrder: template.sortOrder,
          courses: template.courses,
        });
      }
      await load();
      setNotice("Toscana templates seeded");
    } catch (err) {
      console.error(err);
      setError("Failed to seed templates");
    }
  };

  const categoriesWithItems = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        items: items.filter((item) => item.categoryId === category._id),
      })),
    [categories, items]
  );

  const hasTemplates = useMemo(() => templates.length > 0, [templates.length]);

  return (
    <div className="page page-admin-templates">
      <div className="container py-4 admin-templates">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3 page-header">
          <div>
            <p className="eyebrow mb-1">Admin</p>
            <h2 className="mb-0">Menu Templates</h2>
            <p className="text-muted mb-0">Design the course flow guests see on the menu step.</p>
          </div>
          <div className="d-flex gap-2 flex-wrap page-header-actions">
            <button className="btn btn-outline-primary" type="button" onClick={seedTemplates}>
              Seed Toscana Templates
            </button>
            <Link className="btn btn-outline-secondary" to="/admin/inquiries">
              Inquiries
            </Link>
            <Link className="btn btn-outline-secondary" to="/admin/menu">
              Menu
            </Link>
            <Link className="btn btn-primary" to="/admin/templates">
              Templates
            </Link>
            <Link className="btn btn-outline-secondary" to="/admin/rooms">
              Rooms
            </Link>
          </div>
        </div>

        {error && <div className="alert alert-warning">{error}</div>}
        {notice && <div className="alert alert-success">{notice}</div>}
        {loading && <div className="text-muted">Loading templates...</div>}

        <div className="template-grid">
          <div className="template-card new">
            <div className="template-card-header">
              <h3 className="h5 mb-1">New Template</h3>
              <p className="text-muted mb-0">Create a fresh course flow.</p>
            </div>
            <div className="template-card-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">Template name</label>
                  <input
                    className="form-control"
                    value={newDraft.name}
                    onChange={(e) => setNewDraft((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <input
                    className="form-control"
                    value={newDraft.description}
                    onChange={(e) => setNewDraft((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Sort order</label>
                  <input
                    className="form-control"
                    type="number"
                    value={newDraft.sortOrder}
                    onChange={(e) => setNewDraft((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="course-list">
                <div className="text-uppercase text-muted small mb-2">Courses</div>
                {newDraft.courses.map((course, index) => (
                  <div key={`${course.name}-${index}`} className="course-card">
                    <div className="course-row">
                      <input
                        className="form-control"
                        value={course.name}
                        onChange={(e) => updateCourse("new", index, { name: e.target.value })}
                        placeholder="Course name"
                      />
                      <div className="course-meta text-muted small">
                        {course.selectedItemNames.length} items selected
                      </div>
                      <button className="btn btn-outline-danger btn-sm" type="button" onClick={() => removeCourse("new", index)}>
                        Remove
                      </button>
                    </div>
                    <div className="course-settings">
                      <div className="row g-2">
                        <div className="col-12 col-md-4">
                          <label className="form-label small">Selection mode</label>
                          <select
                            className="form-select form-select-sm"
                            value={course.selectionMode || "choice"}
                            onChange={(e) => {
                              const nextMode = e.target.value as CourseDraft["selectionMode"];
                              const updates: Partial<CourseDraft> = { selectionMode: nextMode };
                              if (nextMode === "choice" && !course.maxChoices) updates.maxChoices = 1;
                              if (nextMode === "share" && !course.shareCount) updates.shareCount = 2;
                              updateCourse("new", index, updates);
                            }}
                          >
                            <option value="fixed">Fixed</option>
                            <option value="choice">Choice</option>
                            <option value="share">To Share</option>
                          </select>
                        </div>
                        {course.selectionMode === "choice" && (
                          <div className="col-12 col-md-4">
                            <label className="form-label small">Max choices</label>
                            <input
                              className="form-control form-control-sm"
                              type="number"
                              min={1}
                              value={course.maxChoices ?? 1}
                              onChange={(e) =>
                                updateCourse("new", index, { maxChoices: Math.max(1, Number(e.target.value) || 1) })
                              }
                            />
                          </div>
                        )}
                        {course.selectionMode === "share" && (
                          <div className="col-12 col-md-4">
                            <label className="form-label small">Share count</label>
                            <input
                              className="form-control form-control-sm"
                              type="number"
                              min={2}
                              value={course.shareCount ?? 2}
                              onChange={(e) =>
                                updateCourse("new", index, { shareCount: Math.max(2, Number(e.target.value) || 2) })
                              }
                            />
                          </div>
                        )}
                      </div>
                      <div className="mt-3">
                        <div className="text-uppercase text-muted small mb-2">Default categories</div>
                        <div className="course-category-chips">
                          {categories.map((category) => {
                            const selected = course.defaultCategoryNames?.includes(category.name);
                            return (
                              <button
                                key={category._id}
                                type="button"
                                className={`category-chip ${selected ? "active" : ""}`}
                                onClick={() => toggleDefaultCategory("new", index, category.name)}
                              >
                                {category.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="course-picker">
                      {categoriesWithItems.map((category) => {
                        const isOpen = openCategories.has(category._id);
                        return (
                          <div key={category._id} className="mb-3">
                            <button
                              className="menu-category-toggle"
                              type="button"
                              onClick={() => toggleCategory(category._id)}
                              aria-expanded={isOpen}
                            >
                              <span className="text-uppercase">{category.name}</span>
                              <span className="menu-category-icon">{isOpen ? "−" : "+"}</span>
                            </button>
                            {isOpen && (
                              <div className="menu-category-panel">
                                <div className="row g-2">
                                  {category.items.map((item) => {
                                    const selected = course.selectedItemNames.some(
                                      (name) => normalizeName(name) === normalizeName(item.name)
                                    );
                                    return (
                                      <div key={item._id} className="col-12 col-md-6">
                                        <button
                                          className={`menu-item-card ${selected ? "selected" : ""}`}
                                          type="button"
                                          onClick={() => toggleCourseItem("new", index, item.name)}
                                        >
                                          <div className="d-flex justify-content-between align-items-start gap-2">
                                            <div>
                                              <h4 className="h6 mb-1">{item.name}</h4>
                                              <p className="text-muted mb-2">{item.description}</p>
                                            </div>
                                            <span className="fw-semibold">{formatPrice(item.pricePerPerson)}</span>
                                          </div>
                                          <div className="d-flex gap-2 flex-wrap">
                                            {item.isVegetarian && <span className="badge text-bg-light">Veg</span>}
                                            {item.isVegan && <span className="badge text-bg-light">Vegan</span>}
                                            {item.isGlutenFree && <span className="badge text-bg-light">GF</span>}
                                          </div>
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => addCourse("new")}>
                  Add Course
                </button>
              </div>
            </div>
            <div className="template-card-footer">
              <button className="btn btn-primary" onClick={createTemplate}>
                Save Template
              </button>
            </div>
          </div>

          {hasTemplates &&
            templates.map((template) => {
              const draft = drafts[template._id];
              if (!draft) return null;
              const isOpen = openTemplates.has(template._id);
              return (
                <div key={template._id} className="template-card">
                  <button className="template-toggle" type="button" onClick={() => toggleTemplate(template._id)}>
                    <div>
                      <h3 className="h5 mb-1">{draft.name || "Template"}</h3>
                      <p className="text-muted mb-0">
                        {draft.courses.length} courses · {draft.courses.reduce((sum, course) => sum + course.selectedItemNames.length, 0)} items
                      </p>
                    </div>
                    <span className="menu-category-icon">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <>
                      <div className="template-card-body">
                        <div className="row g-3">
                          <div className="col-12">
                            <label className="form-label">Template name</label>
                            <input
                              className="form-control"
                              value={draft.name}
                              onChange={(e) =>
                                setDrafts((prev) => ({ ...prev, [template._id]: { ...draft, name: e.target.value } }))
                              }
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label">Description</label>
                            <input
                              className="form-control"
                              value={draft.description}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [template._id]: { ...draft, description: e.target.value },
                                }))
                              }
                            />
                          </div>
                          <div className="col-12">
                            <label className="form-label">Sort order</label>
                            <input
                              className="form-control"
                              type="number"
                              value={draft.sortOrder}
                              onChange={(e) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [template._id]: { ...draft, sortOrder: Number(e.target.value) },
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="course-list">
                          <div className="text-uppercase text-muted small mb-2">Courses</div>
                          {draft.courses.map((course, index) => (
                            <div key={`${course.name}-${index}`} className="course-card">
                              <div className="course-row">
                                <input
                                  className="form-control"
                                  value={course.name}
                                  onChange={(e) => updateCourse(template._id, index, { name: e.target.value })}
                                  placeholder="Course name"
                                />
                                <div className="course-meta text-muted small">
                                  {course.selectedItemNames.length} items selected
                                </div>
                                <button
                                  className="btn btn-outline-danger btn-sm"
                                  type="button"
                                  onClick={() => removeCourse(template._id, index)}
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="course-settings">
                                <div className="row g-2">
                                  <div className="col-12 col-md-4">
                                    <label className="form-label small">Selection mode</label>
                                    <select
                                      className="form-select form-select-sm"
                                      value={course.selectionMode || "choice"}
                                      onChange={(e) => {
                                        const nextMode = e.target.value as CourseDraft["selectionMode"];
                                        const updates: Partial<CourseDraft> = { selectionMode: nextMode };
                                        if (nextMode === "choice" && !course.maxChoices) updates.maxChoices = 1;
                                        if (nextMode === "share" && !course.shareCount) updates.shareCount = 2;
                                        updateCourse(template._id, index, updates);
                                      }}
                                    >
                                      <option value="fixed">Fixed</option>
                                      <option value="choice">Choice</option>
                                      <option value="share">To Share</option>
                                    </select>
                                  </div>
                                  {course.selectionMode === "choice" && (
                                    <div className="col-12 col-md-4">
                                      <label className="form-label small">Max choices</label>
                                      <input
                                        className="form-control form-control-sm"
                                        type="number"
                                        min={1}
                                        value={course.maxChoices ?? 1}
                                        onChange={(e) =>
                                          updateCourse(template._id, index, {
                                            maxChoices: Math.max(1, Number(e.target.value) || 1),
                                          })
                                        }
                                      />
                                    </div>
                                  )}
                                  {course.selectionMode === "share" && (
                                    <div className="col-12 col-md-4">
                                      <label className="form-label small">Share count</label>
                                      <input
                                        className="form-control form-control-sm"
                                        type="number"
                                        min={2}
                                        value={course.shareCount ?? 2}
                                        onChange={(e) =>
                                          updateCourse(template._id, index, {
                                            shareCount: Math.max(2, Number(e.target.value) || 2),
                                          })
                                        }
                                      />
                                    </div>
                                  )}
                                </div>
                                <div className="mt-3">
                                  <div className="text-uppercase text-muted small mb-2">Default categories</div>
                                  <div className="course-category-chips">
                                    {categories.map((category) => {
                                      const selected = course.defaultCategoryNames?.includes(category.name);
                                      return (
                                        <button
                                          key={category._id}
                                          type="button"
                                          className={`category-chip ${selected ? "active" : ""}`}
                                          onClick={() => toggleDefaultCategory(template._id, index, category.name)}
                                        >
                                          {category.name}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                              <div className="course-picker">
                                {categoriesWithItems.map((category) => {
                                  const isOpen = openCategories.has(category._id);
                                  return (
                                    <div key={category._id} className="mb-3">
                                      <button
                                        className="menu-category-toggle"
                                        type="button"
                                        onClick={() => toggleCategory(category._id)}
                                        aria-expanded={isOpen}
                                      >
                                        <span className="text-uppercase">{category.name}</span>
                                        <span className="menu-category-icon">{isOpen ? "−" : "+"}</span>
                                      </button>
                                      {isOpen && (
                                        <div className="menu-category-panel">
                                          <div className="row g-2">
                                            {category.items.map((item) => {
                                              const selected = course.selectedItemNames.some(
                                                (name) => normalizeName(name) === normalizeName(item.name)
                                              );
                                              return (
                                                <div key={item._id} className="col-12 col-md-6">
                                                  <button
                                                    className={`menu-item-card ${selected ? "selected" : ""}`}
                                                    type="button"
                                                    onClick={() => toggleCourseItem(template._id, index, item.name)}
                                                  >
                                                    <div className="d-flex justify-content-between align-items-start gap-2">
                                                      <div>
                                                        <h4 className="h6 mb-1">{item.name}</h4>
                                                        <p className="text-muted mb-2">{item.description}</p>
                                                      </div>
                                                      <span className="fw-semibold">{formatPrice(item.pricePerPerson)}</span>
                                                    </div>
                                                    <div className="d-flex gap-2 flex-wrap">
                                                      {item.isVegetarian && <span className="badge text-bg-light">Veg</span>}
                                                      {item.isVegan && <span className="badge text-bg-light">Vegan</span>}
                                                      {item.isGlutenFree && <span className="badge text-bg-light">GF</span>}
                                                    </div>
                                                  </button>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                          <button className="btn btn-outline-secondary btn-sm" type="button" onClick={() => addCourse(template._id)}>
                            Add Course
                          </button>
                        </div>
                      </div>
                      <div className="template-card-footer">
                        <button className="btn btn-outline-secondary" onClick={() => saveTemplate(template._id)}>
                          Save Changes
                        </button>
                        <button className="btn btn-outline-danger" onClick={() => deleteTemplate(template._id)}>
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default AdminTemplatesPage;
