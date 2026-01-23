import type { MenuItem, MenuSelectionCourse, MenuTemplate } from "../types";

export const fallbackMenuTemplates: MenuTemplate[] = [
  {
    _id: "set-menu-49",
    name: "Set Menu - $49/person",
    description: "A streamlined three-course set with classic Toscana favorites.",
    sortOrder: 1,
    courses: [
      {
        name: "Course 1 (Choice of)",
        suggestedItemNames: ["Mista Salad", "Soup of the Day"],
        selectionMode: "choice",
        maxChoices: 1,
        defaultCategoryNames: ["Salads", "Soups", "Appetizers"],
      },
      {
        name: "Course 2 (Choice of)",
        suggestedItemNames: [
          "Butternut Squash Ravioli",
          "Chicken Parmigiana",
          "AAA Tender Medallions",
          "Gamberetti Rossi",
        ],
        selectionMode: "choice",
        maxChoices: 1,
        defaultCategoryNames: ["Pasta", "Secondi", "Mains", "Entrees"],
      },
      {
        name: "Course 3 (Choice of)",
        suggestedItemNames: ["Chocolate Cake", "Cheesecake"],
        selectionMode: "choice",
        maxChoices: 1,
        defaultCategoryNames: ["Desserts"],
      },
    ],
  },
  {
    _id: "set-menu-59",
    name: "Set Menu - $59/person",
    description: "Four courses with a refined appetizer start and classic mains.",
    sortOrder: 2,
    courses: [
      {
        name: "Course 1",
        suggestedItemNames: ["Bruschetta"],
        selectionMode: "fixed",
        defaultCategoryNames: ["Appetizers", "Antipasti"],
      },
      {
        name: "Course 2 (Choice of)",
        suggestedItemNames: ["Mista Salad", "Soup of the Day"],
        selectionMode: "choice",
        maxChoices: 1,
        defaultCategoryNames: ["Salads", "Soups"],
      },
      {
        name: "Course 3 (Choice of)",
        suggestedItemNames: [
          "Butternut Squash Ravioli",
          "Chicken Parmigiana",
          "AAA Tender Medallions",
          "Gamberetti Rossi",
        ],
        selectionMode: "choice",
        maxChoices: 1,
        defaultCategoryNames: ["Pasta", "Secondi", "Mains", "Entrees"],
      },
      {
        name: "Course 4 (Choice of)",
        suggestedItemNames: ["Chocolate Cake", "Cheesecake"],
        selectionMode: "choice",
        maxChoices: 1,
        defaultCategoryNames: ["Desserts"],
      },
    ],
  },
  {
    _id: "set-menu-69",
    name: "Set Menu - $69/person",
    description: "Five courses including a shareable platter and premium mains.",
    sortOrder: 3,
    courses: [
      {
        name: "Course 1",
        suggestedItemNames: ["Bruschetta"],
        selectionMode: "fixed",
        defaultCategoryNames: ["Appetizers", "Antipasti"],
      },
      {
        name: "Course 2 (Choice of)",
        suggestedItemNames: ["Mista Salad", "Tomato Basil Soup"],
        selectionMode: "choice",
        maxChoices: 1,
        defaultCategoryNames: ["Salads", "Soups"],
      },
      {
        name: "Course 3 (To Share)",
        suggestedItemNames: ["Italian Platter"],
        selectionMode: "share",
        shareCount: 2,
        defaultCategoryNames: ["Antipasti", "Appetizers", "Shareables"],
      },
      {
        name: "Course 4 (Choice of)",
        suggestedItemNames: [
          "Butternut Squash Ravioli",
          "Chicken Parmigiana",
          "AAA Tender Medallions",
          "Atlantic Salmon",
        ],
        selectionMode: "choice",
        maxChoices: 1,
        defaultCategoryNames: ["Pasta", "Secondi", "Mains", "Entrees"],
      },
      {
        name: "Course 5 (Choice of)",
        suggestedItemNames: ["Chocolate Cake", "Cheesecake"],
        selectionMode: "choice",
        maxChoices: 1,
        defaultCategoryNames: ["Desserts"],
      },
    ],
  },
];

const suggestionAliases: Record<string, string[]> = {
  "feta bruschetta": ["bruschetta"],
  "chicken parmigiano": ["chicken parmigiana"],
  "aaa tender medallions": ["tender medallions", "tenderloin medallions"],
  "gamberetti rossi": ["gamberetti", "prawns"],
  "tomato basil soup": ["basil soup", "tomato soup"],
  "mista salad": ["mixed salad"],
  "soup of the day": ["soup"],
  "chocolate cake": ["chocolate torte"],
  "italian platter": ["antipasti platter", "italian antipasto"],
  "atlantic salmon": ["salmon"],
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
    selectionMode: course.selectionMode,
    maxChoices: course.maxChoices,
    shareCount: course.shareCount,
    defaultCategoryNames: course.defaultCategoryNames,
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
