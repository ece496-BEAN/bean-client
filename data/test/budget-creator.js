categories = [
  {
    id: "fc0c7639-6e3b-43a8-b113-530391cee0f6",
    name: "entertainment",
    description: "",
    is_income_type: false,
    legacy: false,
  },
  {
    id: "f5bd6a5d-33bb-44e8-b63c-118991216efc",
    name: "food",
    description: "",
    is_income_type: false,
    legacy: false,
  },
  {
    id: "785f991e-4174-488a-a7ec-6fca7a8ad088",
    name: "housing",
    description: "",
    is_income_type: false,
    legacy: false,
  },
  {
    id: "c3a7625a-9169-4bf8-9c7f-4967dd284b4d",
    name: "initial value",
    description: "",
    is_income_type: true,
    legacy: false,
  },
  {
    id: "11febcba-1a64-4e2f-a5e8-8e01dad8a677",
    name: "other",
    description: "",
    is_income_type: false,
    legacy: false,
  },
  {
    id: "f20c2fc9-868f-452d-b903-f99d52bf50da",
    name: "restaurants",
    description: "",
    is_income_type: false,
    legacy: false,
  },
  {
    id: "76c66901-b548-413f-be00-90ea934af5b8",
    name: "salary",
    description: "",
    is_income_type: true,
    legacy: false,
  },
  {
    id: "f52b3ba5-2468-4700-8739-27e75a6bf1fb",
    name: "side hustle",
    description: "",
    is_income_type: true,
    legacy: false,
  },
  {
    id: "b2d40c66-5a4d-4117-9ab1-fbff2eb71191",
    name: "stock dividends",
    description: "",
    is_income_type: true,
    legacy: false,
  },
  {
    id: "2864e61d-fd17-4e2c-b965-4f10f7aabd13",
    name: "utilities",
    description: "",
    is_income_type: false,
    legacy: false,
  },
];

budgets = [
  {
    category: "housing",
    budget: -2000,
  },
  {
    category: "food",
    budget: -500,
  },
  {
    category: "restaurants",
    budget: -300,
  },
  {
    category: "utilities",
    budget: -200,
  },
  {
    category: "entertainment",
    budget: -200,
  },
  {
    category: "other",
    budget: -300,
  },
  {
    category: "salary",
    budget: 5000,
  },
  {
    category: "side hustle",
    budget: 1000,
  },
  {
    category: "stock dividends",
    budget: 400,
  },
];

function transformBudgets(categories, budgets) {
  const categoryMap = {};
  categories.forEach((category) => {
    categoryMap[category.name] = category.id;
  });

  const transformedBudgets = budgets
    .map((budgetItem) => {
      const category_uuid = categoryMap[budgetItem.category];
      if (category_uuid) {
        return {
          category_uuid: category_uuid,
          allocation: Math.abs(budgetItem.budget), // Use Math.abs to ensure positive allocation, or keep budgetItem.budget if you need the sign
        };
      } else {
        console.warn(
          `Category "${budgetItem.category}" not found in categories list.`,
        );
        return null; // Or handle missing categories as needed, e.g., throw an error, or return a default object
      }
    })
    .filter((item) => item !== null); // Remove null items if any category was not found

  return transformedBudgets;
}

const outputBudgets = transformBudgets(categories, budgets);
console.log(JSON.stringify(outputBudgets, null, 4));
