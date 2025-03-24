import { ExpenseChart } from "@/components/expense-chart";
import BudgetProvider from "@/contexts/BudgetContext";
import TransactionsProvider from "@/contexts/TransactionsContext";

export default function Page() {
  return (
    <TransactionsProvider>
      <BudgetProvider>
        <ExpenseChart />
      </BudgetProvider>
    </TransactionsProvider>
  );
}
