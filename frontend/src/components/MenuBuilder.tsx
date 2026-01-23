import React, { useEffect, useMemo, useState } from "react";
import { MenuCategory, MenuItem, MenuSelectionCourse } from "../types";
import { buildTemplateCourses, fallbackMenuTemplates } from "./menuTemplates";

interface Props {
  categories: MenuCategory[];
  items: MenuItem[];
  selection: { courses: MenuSelectionCourse[] };
  onChange: (selection: { courses: MenuSelectionCourse[] }) => void;
  showTemplateControls?: boolean;
}

const ensureUniqueCourseName = (name: string, courses: MenuSelectionCourse[], ignoreIndex?: number) => {
  const base = name.trim() || "Course";
  let candidate = base;
  let counter = 2;
  const isTaken = (value: string) =>
    courses.some((course, idx) => idx !== ignoreIndex && course.courseType.trim().toLowerCase() === value.toLowerCase());
  while (isTaken(candidate)) {
    candidate = `${base} ${counter}`;
    counter += 1;
  }
  return candidate;
};

const normalizeCategoryName = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "");

const fallbackCategoryHints = (courseType: string) => {
  const normalized = courseType.toLowerCase();
  if (normalized.includes("course 1") || normalized.includes("starter") || normalized.includes("appetizer")) {
    return ["Appetizers", "Salads", "Soups"];
  }
  if (normalized.includes("dessert")) return ["Desserts"];
  return [];
};

const MenuBuilder: React.FC<Props> = ({
  categories,
  items,
  selection,
  onChange,
  showTemplateControls = true,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [templateId, setTemplateId] = useState(fallbackMenuTemplates[0]._id);
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  const categoriesWithItems = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        items: items.filter((item) => item.categoryId === category._id),
      })),
    [categories, items]
  );

  const orderedCategories = useMemo(() => {
    const activeCourse = selection.courses[activeIndex];
    const preferredNames =
      activeCourse?.defaultCategoryNames?.length
        ? activeCourse.defaultCategoryNames
        : activeCourse
        ? fallbackCategoryHints(activeCourse.courseType)
        : [];
    if (preferredNames.length === 0) return categoriesWithItems;
    const preferred = new Set(preferredNames.map(normalizeCategoryName));
    const preferredList = categoriesWithItems.filter((category) =>
      preferred.has(normalizeCategoryName(category.name))
    );
    const rest = categoriesWithItems.filter(
      (category) => !preferred.has(normalizeCategoryName(category.name))
    );
    return [...preferredList, ...rest];
  }, [categoriesWithItems, selection.courses, activeIndex]);

  const updateCourses = (courses: MenuSelectionCourse[]) => {
    onChange({ courses });
  };

  const addCourse = () => {
    const baseName = `Course ${selection.courses.length + 1}`;
    const courseType = ensureUniqueCourseName(baseName, selection.courses);
    const next = [
      ...selection.courses,
      { courseType, itemIds: [], selectionMode: "choice", maxChoices: 1 },
    ];
    updateCourses(next);
    setActiveIndex(next.length - 1);
  };

  const removeCourse = (index: number) => {
    const next = selection.courses.filter((_, idx) => idx !== index);
    updateCourses(next);
    setActiveIndex(Math.max(0, Math.min(activeIndex, next.length - 1)));
  };

  const renameCourse = (index: number, name: string) => {
    const next = [...selection.courses];
    next[index] = { ...next[index], courseType: name };
    updateCourses(next);
  };

  const commitCourseName = (index: number) => {
    const next = [...selection.courses];
    const nextName = ensureUniqueCourseName(next[index]?.courseType || `Course ${index + 1}`, selection.courses, index);
    next[index] = { ...next[index], courseType: nextName };
    updateCourses(next);
  };

  const applyTemplate = (id: string) => {
    const template = fallbackMenuTemplates.find((t) => t._id === id) || fallbackMenuTemplates[0];
    const courses = buildTemplateCourses(template, items).map((course) => ({
      ...course,
      courseType: ensureUniqueCourseName(course.courseType, []),
    }));
    updateCourses(courses);
    setActiveIndex(0);
  };

  useEffect(() => {
    if (selection.courses.length === 0) {
      updateCourses([{ courseType: "Course 1", itemIds: [] }]);
    }
  }, [selection.courses.length]);

  useEffect(() => {
    const isBlank =
      selection.courses.length === 1 &&
      selection.courses[0].courseType === "Course 1" &&
      selection.courses[0].itemIds.length === 0;
    if (isBlank) {
      applyTemplate(fallbackMenuTemplates[0]._id);
    }
  }, []);

  useEffect(() => {
    if (activeIndex >= selection.courses.length) {
      setActiveIndex(Math.max(0, selection.courses.length - 1));
    }
  }, [activeIndex, selection.courses.length]);

  useEffect(() => {
    if (categories.length === 0) return;
    const activeCourse = selection.courses[activeIndex];
    const preferredNames =
      activeCourse?.defaultCategoryNames?.length
        ? activeCourse.defaultCategoryNames
        : activeCourse
        ? fallbackCategoryHints(activeCourse.courseType)
        : [];
    if (preferredNames.length === 0) {
      setOpenCategories((prev) => (prev.size > 0 ? prev : new Set([categories[0]._id])));
      return;
    }
    const preferred = new Set(preferredNames.map(normalizeCategoryName));
    const nextOpen = categories
      .filter((category) => preferred.has(normalizeCategoryName(category.name)))
      .map((category) => category._id);
    if (nextOpen.length > 0) {
      setOpenCategories(new Set(nextOpen));
    }
  }, [categories, activeIndex, selection.courses]);

  const toggleCategory = (id: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleItem = (courseType: string, itemId: string) => {
    const courses = [...selection.courses];
    const existing = courses.find((c) => c.courseType === courseType);
    if (existing) {
      const alreadySelected = existing.itemIds.includes(itemId);
      if (alreadySelected) {
        existing.itemIds = existing.itemIds.filter((id) => id !== itemId);
      } else if (existing.selectionMode === "choice" && (existing.maxChoices || 1) === 1) {
        existing.itemIds = [itemId];
      } else {
        const next = [...existing.itemIds, itemId];
        const maxChoices = existing.maxChoices || (existing.selectionMode === "choice" ? 1 : undefined);
        existing.itemIds = maxChoices ? next.slice(0, maxChoices) : next;
      }
    } else {
      courses.push({ courseType, itemIds: [itemId], selectionMode: "choice", maxChoices: 1 });
    }
    onChange({ courses });
  };

  const isSelected = (courseType: string, itemId: string) => {
    return selection.courses.some(
      (c) => c.courseType === courseType && c.itemIds.includes(itemId)
    );
  };

  return (
    <div className="card">
      <div className="card-body">
        {showTemplateControls && (
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h3 className="h5 mb-1">Choose a Menu Style</h3>
              <p className="text-muted mb-0">Start with a template, then tap any course to refine.</p>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <select
                className="form-select"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                {fallbackMenuTemplates.map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <button className="btn btn-outline-primary" onClick={() => applyTemplate(templateId)}>
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={`card-body ${showTemplateControls ? "border-top" : ""}`}>
        <div className="row g-4">
          <div className="col-12 col-lg-4">
            <div className="list-group menu-course-list">
              {selection.courses.map((course, index) => (
                <button
                  key={`${course.courseType}-${index}`}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center menu-course-item ${
                    index === activeIndex ? "active" : ""
                  }`}
                  onClick={() => setActiveIndex(index)}
                >
                  <span>{course.courseType}</span>
                  <span className={`badge ${index === activeIndex ? "text-bg-light" : "text-bg-secondary"}`}>
                    {course.itemIds.length}
                    {course.selectionMode === "share" && course.shareCount ? ` • ${course.shareCount}` : ""}
                  </span>
                </button>
              ))}
            </div>
            <div className="d-flex gap-2 mt-3">
              <button className="btn btn-outline-primary btn-sm" onClick={addCourse}>
                Add Course
              </button>
              <button
                className="btn btn-outline-danger btn-sm"
                disabled={selection.courses.length === 1}
                onClick={() => removeCourse(activeIndex)}
              >
                Remove
              </button>
            </div>
          </div>
          <div className="col-12 col-lg-8">
            {selection.courses[activeIndex] && (
              <>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <input
                      className="form-control"
                      style={{ minWidth: 240 }}
                      value={selection.courses[activeIndex].courseType}
                      onChange={(e) => renameCourse(activeIndex, e.target.value)}
                      onBlur={() => commitCourseName(activeIndex)}
                    />
                    <span className="badge text-bg-light">
                      {selection.courses[activeIndex].itemIds.length} selected
                    </span>
                    {selection.courses[activeIndex].selectionMode === "share" && (
                      <label className="d-flex align-items-center gap-2 small text-muted">
                        Share for
                        <input
                          className="form-control form-control-sm"
                          type="number"
                          min={2}
                          max={50}
                          value={selection.courses[activeIndex].shareCount ?? 2}
                          onChange={(e) => {
                            const next = [...selection.courses];
                            const nextCount = Math.max(2, Number(e.target.value) || 2);
                            next[activeIndex] = { ...next[activeIndex], shareCount: nextCount };
                            updateCourses(next);
                          }}
                          style={{ width: 72 }}
                        />
                      </label>
                    )}
                  </div>
                  <div className="text-muted small">Tip: click a course to edit items.</div>
                </div>

                {orderedCategories.map((category) => {
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
                            {category.items.length === 0 && (
                              <div className="col-12 text-muted">No items in this category.</div>
                            )}
                            {category.items.map((item) => {
                              const selected = isSelected(selection.courses[activeIndex].courseType, item._id);
                              return (
                                <div key={item._id} className="col-12 col-md-6">
                                  <button
                                    className={`menu-item-card ${selected ? "selected" : ""}`}
                                    onClick={() => toggleItem(selection.courses[activeIndex].courseType, item._id)}
                                    type="button"
                                  >
                                    <div className="d-flex justify-content-between align-items-start gap-2">
                                      <div>
                                        <h4 className="h6 mb-1">{item.name}</h4>
                                        <p className="text-muted mb-2">{item.description}</p>
                                      </div>
                                      <span className="fw-semibold">
                                        {typeof item.pricePerPerson === "number"
                                          ? `$${item.pricePerPerson.toFixed(2)}`
                                          : "TBD"}
                                      </span>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuBuilder;
