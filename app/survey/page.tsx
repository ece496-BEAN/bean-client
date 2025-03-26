import SurveyPage from "@/components/survey-page";
import CategoryProvider from "@/contexts/CategoriesContext";
import JwtProvider from "@/app/lib/jwt-provider";
import BudgetProvider from "@/contexts/BudgetContext";

export default function Page() {
  return (
    <JwtProvider>
      <BudgetProvider>
        <CategoryProvider>
          <SurveyPage />
        </CategoryProvider>
      </BudgetProvider>
    </JwtProvider>
  );
}
