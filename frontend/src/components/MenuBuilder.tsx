import React, { useEffect, useMemo, useState } from "react";
import { MenuCategory, MenuItem, MenuSelectionCourse } from "../types";

interface Props {
  categories: MenuCategory[];
  items: MenuItem[];
  selection: { courses: MenuSelectionCourse[] };
  onChange: (selection: { courses: MenuSelectionCourse[] }) => void;
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

const normalizeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");

const templates = [
  {
    id: "custom",
    label: "Custom (blank)",
    courses: ["Course 1"],
    suggestions: {},
  },
  {
    id: "toscana-5-course",
    label: "Toscana 5-course menu",
    courses: ["Course 1", "Course 2", "Course 3", "Course 4 (Choice of)", "Course 5 (Choice of)"],
    suggestions: {
      "Course 1": ["Feta Bruschetta"],
      "Course 2": ["Roasted Tomato Basil Soup"],
      "Course 3": ["Arancini"],
      "Course 4 (Choice of)": ["Butternut Squash Ravioli", "Chicken Parmigiano", "AAA Tender Medallions", "Gamberetti Rosso"],
      "Course 5 (Choice of)": ["Chocolate-cake", "Cheesecake"],
    },
  },
];

const suggestionAliases: Record<string, string[]> = {
  "feta bruschetta": ["bruschetta"],
  "chicken parmigiano": ["chicken parmigiana"],
};

const MenuBuilder: React.FC<Props> = ({
  categories,
  items,
  selection,
  onChange,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [templateId, setTemplateId] = useState(templates[0].id);

  const categoriesWithItems = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        items: items.filter((item) => item.categoryId === category._id),
      })),
    [categories, items]
  );

  const updateCourses = (courses: MenuSelectionCourse[]) => {
    onChange({ courses });
  };

  const addCourse = () => {
    const baseName = `Course ${selection.courses.length + 1}`;
    const courseType = ensureUniqueCourseName(baseName, selection.courses);
    const next = [...selection.courses, { courseType, itemIds: [] }];
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

  const findSuggestedItemId = (name: string) => {
    const normalized = normalizeName(name);
    const aliases = suggestionAliases[normalized] || [];
    const candidates = [normalized, ...aliases.map(normalizeName)];

    const exact = items.find((item) => candidates.includes(normalizeName(item.name)));
    if (exact) return exact._id;

    const contains = items.find((item) => {
      const itemName = normalizeName(item.name);
      return candidates.some((candidate) => itemName.includes(candidate) || candidate.includes(itemName));
    });
    return contains?._id;
  };

  const applyTemplate = (id: string) => {
    const template = templates.find((t) => t.id === id) || templates[0];
    const courses = template.courses.map((name) => ({
      courseType: ensureUniqueCourseName(name, []),
      itemIds: [],
    }));

    if (template.suggestions && Object.keys(template.suggestions).length > 0) {
      courses.forEach((course) => {
        const suggested = (template.suggestions as Record<string, string[]>)[course.courseType] || [];
        const itemIds = suggested.map(findSuggestedItemId).filter(Boolean) as string[];
        course.itemIds = itemIds;
      });
    }

    updateCourses(courses);
    setActiveIndex(0);
  };

  useEffect(() => {
    if (selection.courses.length === 0) {
      updateCourses([{ courseType: "Course 1", itemIds: [] }]);
    }
  }, [selection.courses.length]);

  useEffect(() => {
    if (activeIndex >= selection.courses.length) {
      setActiveIndex(Math.max(0, selection.courses.length - 1));
    }
  }, [activeIndex, selection.courses.length]);

  const toggleItem = (courseType: string, itemId: string) => {
    const courses = [...selection.courses];
    const existing = courses.find((c) => c.courseType === courseType);
    if (existing) {
      const alreadySelected = existing.itemIds.includes(itemId);
      existing.itemIds = alreadySelected
        ? existing.itemIds.filter((id) => id !== itemId)
        : [...existing.itemIds, itemId];
    } else {
      courses.push({ courseType, itemIds: [itemId] });
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
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h3 className="h5 mb-1">Courses</h3>
            <p className="text-muted mb-0">Work on one course at a time, then save and move on.</p>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <select
              className="form-select"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label}
                </option>
              ))}
            </select>
            <button className="btn btn-outline-primary" onClick={() => applyTemplate(templateId)}>
              Apply Template
            </button>
          </div>
        </div>
      </div>

      <div className="card-body border-top">
        <div className="row g-4">
          <div className="col-12 col-lg-4">
            <div className="list-group">
              {selection.courses.map((course, index) => (
                <button
                  key={`${course.courseType}-${index}`}
                  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                    index === activeIndex ? "active" : ""
                  }`}
                  onClick={() => setActiveIndex(index)}
                >
                  <span>{course.courseType}</span>
                  <span className={`badge ${index === activeIndex ? "text-bg-light" : "text-bg-secondary"}`}>
                    {course.itemIds.length}
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
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-outline-secondary"
                      disabled={activeIndex === 0}
                      onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                    >
                      Back
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        setActiveIndex((prev) =>
                          Math.min(selection.courses.length - 1, prev + 1)
                        )
                      }
                    >
                      Save & Next
                    </button>
                  </div>
                </div>

                {categoriesWithItems.map((category) => (
                  <div key={category._id} className="mb-3">
                    <div className="text-uppercase text-muted small mb-2">{category.name}</div>
                    <div className="row g-2">
                      {category.items.length === 0 && (
                        <div className="col-12 text-muted">No items in this category.</div>
                      )}
                      {category.items.map((item) => {
                        const selected = isSelected(selection.courses[activeIndex].courseType, item._id);
                        return (
                          <div key={item._id} className="col-12 col-md-6">
                            <button
                              className={`btn w-100 text-start h-100 ${
                                selected ? "btn-outline-primary border-2" : "btn-outline-secondary"
                              }`}
                              onClick={() => toggleItem(selection.courses[activeIndex].courseType, item._id)}
                              type="button"
                            >
                              <div className="d-flex justify-content-between align-items-start gap-2">
                                <div>
                                  <h4 className="h6 mb-1">{item.name}</h4>
                                  <p className="text-muted mb-2">{item.description}</p>
                                </div>
                                <span className="fw-semibold">${item.pricePerPerson.toFixed(2)}</span>
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
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuBuilder;
