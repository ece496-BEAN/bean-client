import React from "react";
import AllBudgetsContent from "@/components/AllBudgetsContent";
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
            <AllBudgetsContent />
          </CategoryProvider>
        </BudgetAndCategoryPage>
      </CurrentBudgetProvider>
    </BudgetProvider>
  );
}
