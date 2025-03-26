import SurveyPage from "@/components/survey-page";
import CategoryProvider from "@/contexts/CategoriesContext";

export default function Page() {
  return (
    <CategoryProvider>
      <SurveyPage />
    </CategoryProvider>
  );
}
