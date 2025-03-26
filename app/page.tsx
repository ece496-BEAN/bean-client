import { MainPage } from "@/components/home-page";
import BudgetProvider from "@/contexts/BudgetContext";
import CategoryProvider from "@/contexts/CategoriesContext";
import CurrentBudgetProvider from "@/contexts/CurrentBudgetContext";
import TransactionProvider from "@/contexts/TransactionsContext";

export default function Page() {
  return (
    <TransactionProvider>
      <CategoryProvider>
        <BudgetProvider>
          <CurrentBudgetProvider>
            <MainPage />
          </CurrentBudgetProvider>
        </BudgetProvider>
      </CategoryProvider>
    </TransactionProvider>
  );
}
