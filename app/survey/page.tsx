import SurveyPage from "@/components/survey-page";
import BudgetProvider from "@/contexts/BudgetContext";
import CategoryProvider from "@/contexts/CategoriesContext";

export default function Page() {
  return (
    <BudgetProvider>
      <CategoryProvider>
        <SurveyPage />
      </CategoryProvider>
    </BudgetProvider>
  );
}
