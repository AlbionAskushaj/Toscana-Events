import type { MenuItem, MenuSelectionCourse, MenuTemplate } from "../types";

export const fallbackMenuTemplates: MenuTemplate[] = [
  {
    _id: "toscana-3-course",
    name: "Toscana 3-course",
    description: "A balanced, crowd-friendly progression with choice in later courses.",
    sortOrder: 1,
    courses: [
      { name: "Course 1", suggestedItemNames: ["Bruschetta"] },
      { name: "Course 2 (Choice of)", suggestedItemNames: ["Spaghetti Pomodoro", "Chicken Parmigiana"] },
      { name: "Course 3 (Choice of)", suggestedItemNames: ["Cheesecake"] },
    ],
  },
  {
    _id: "toscana-5-course",
    name: "Toscana 5-course",
    description: "More variety and pacing for longer celebrations.",
    sortOrder: 2,
    courses: [
      { name: "Course 1", suggestedItemNames: ["Bruschetta"] },
      { name: "Course 2", suggestedItemNames: ["Arancini"] },
      { name: "Course 3", suggestedItemNames: ["Spaghetti Pomodoro"] },
      { name: "Course 4 (Choice of)", suggestedItemNames: ["Butternut Squash Ravioli", "Chicken Parmigiana"] },
      { name: "Course 5 (Choice of)", suggestedItemNames: ["Cheesecake"] },
    ],
  },
  {
    _id: "custom",
    name: "Custom",
    description: "Start from scratch and build your own course flow.",
    sortOrder: 3,
    courses: [{ name: "Course 1" }],
  },
];

const suggestionAliases: Record<string, string[]> = {
  "feta bruschetta": ["bruschetta"],
  "chicken parmigiano": ["chicken parmigiana"],
};

const normalizeName = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");

const findSuggestedItemId = (items: MenuItem[], name: string) => {
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

export const buildTemplateCourses = (template: MenuTemplate, items: MenuItem[]): MenuSelectionCourse[] => {
  const courses: MenuSelectionCourse[] = (template.courses || []).map((course) => ({
    courseType: course.name,
    itemIds: [],
  }));

  courses.forEach((course) => {
    const templateCourse = (template.courses || []).find((c) => c.name === course.courseType);
    const suggested = templateCourse?.suggestedItemNames || [];
    if (suggested.length === 0) return;
    const itemIds = suggested.map((name) => findSuggestedItemId(items, name)).filter(Boolean) as string[];
    course.itemIds = itemIds;
  });

  return courses;
};
