import React from "react";
import { BudgetAndCategoryPage } from "@/components/BudgetManagement";
import CurrentBudgetContent from "@/components/CurrentBudgetContent";
import BudgetProvider from "@/contexts/BudgetContext";
import CategoryProvider from "@/contexts/CategoriesContext";
import CurrentBudgetProvider from "@/contexts/CurrentBudgetContext";

export default function Page() {
  return (
    <BudgetProvider>
      <CurrentBudgetProvider>
        <BudgetAndCategoryPage>
          <CategoryProvider>
            <CurrentBudgetContent />
          </CategoryProvider>
        </BudgetAndCategoryPage>
      </CurrentBudgetProvider>
    </BudgetProvider>
  );
}
