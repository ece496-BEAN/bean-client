import React from "react";
import { BudgetAndCategoryPage } from "@/components/BudgetManagement";
import BudgetOverview from "@/components/BudgetOverview";
import BudgetProvider from "@/contexts/BudgetContext";
import CategoryProvider from "@/contexts/CategoriesContext";
import CurrentBudgetProvider from "@/contexts/CurrentBudgetContext";

export default function SpecificBudgetPage() {
  return (
    <BudgetProvider>
      <CurrentBudgetProvider>
        <BudgetAndCategoryPage>
          <CategoryProvider>
            <BudgetOverview />
          </CategoryProvider>
        </BudgetAndCategoryPage>
      </CurrentBudgetProvider>
    </BudgetProvider>
  );
}
