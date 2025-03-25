import SurveyPage from "@/components/survey-page";
import CategoryProvider from "@/contexts/CategoriesContext";
import JwtProvider from "@/app/lib/jwt-provider";

export default function Page() {
  return (
    <JwtProvider>
      <CategoryProvider>
        <SurveyPage />
      </CategoryProvider>
    </JwtProvider>
  );
}
