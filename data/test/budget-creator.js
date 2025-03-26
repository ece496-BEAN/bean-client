categories = [
  {
    id: "87e869be-00b7-461f-8d89-919bea431782",
    name: "entertainment",
    description: "Expenses related to leisure activities and fun.",
    is_income_type: false,
    legacy: false,
    color: "#e74297bf",
  },
  {
    id: "d691140c-3017-4c97-8420-0639a22d097f",
    name: "food",
    description: "Costs associated with groceries and dining out.",
    is_income_type: false,
    legacy: false,
    color: "#e74297bf",
  },
  {
    id: "88653d28-b367-4586-9a1d-3b598834605a",
    name: "housing",
    description: "Expenses related to rent, mortgage, and home maintenance.",
    is_income_type: false,
    legacy: false,
    color: "#e74297bf",
  },
  {
    id: "1586d99c-a61a-435f-bc63-b2412716a155",
    name: "initial value",
    description: "The starting amount or initial capital.",
    is_income_type: true,
    legacy: false,
    color: "#e74297bf",
  },
  {
    id: "391eb415-3f9c-481f-8605-10cd2446601a",
    name: "other",
    description: "Miscellaneous expenses that don't fit into other categories.",
    is_income_type: false,
    legacy: false,
    color: "#e74297bf",
  },
  {
    id: "7d15d569-0f00-4576-9014-a391ed6998aa",
    name: "restaurants",
    description: "Spending on meals at various dining establishments.",
    is_income_type: false,
    legacy: false,
    color: "#e74297bf",
  },
  {
    id: "250762b2-e355-495f-97ae-8fef52580649",
    name: "salary",
    description: "Regular income received from employment.",
    is_income_type: true,
    legacy: false,
    color: "#e74297bf",
  },
  {
    id: "83f77f9d-77b4-4806-b5cb-0c0e6e86f329",
    name: "side hustle",
    description: "Additional income earned outside of primary employment.",
    is_income_type: true,
    legacy: false,
    color: "#e74297bf",
  },
  {
    id: "03d231da-99d9-4634-a123-f9568e3e2b7b",
    name: "stock dividends",
    description: "Income received from investments in stocks.",
    is_income_type: true,
    legacy: false,
    color: "#e74297bf",
  },
  {
    id: "ca641b5b-049f-4542-9582-9fa307474db0",
    name: "utilities",
    description:
      "Costs for essential services like electricity, water, and gas.",
    is_income_type: false,
    legacy: false,
    color: "#e74297bf",
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
