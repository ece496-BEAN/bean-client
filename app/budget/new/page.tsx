import React from "react";
import { AddBudgetPage } from "@/components/AddBudgetPage";
import { BudgetAndCategoryPage } from "@/components/BudgetManagement";
import BudgetProvider from "@/contexts/BudgetContext";
import CategoryProvider from "@/contexts/CategoriesContext";
import CurrentBudgetProvider from "@/contexts/CurrentBudgetContext";

export default function Page() {
  return (
    <BudgetProvider>
      <CurrentBudgetProvider>
        <BudgetAndCategoryPage>
          <CategoryProvider>
            <AddBudgetPage />
          </CategoryProvider>
        </BudgetAndCategoryPage>
      </CurrentBudgetProvider>
    </BudgetProvider>
  );
}
