import { ExpenseChart } from "@/components/expense-chart";
import TransactionsProvider from "@/contexts/TransactionsContext";

export default function Page() {
  return (
    <TransactionsProvider>
      <ExpenseChart />
    </TransactionsProvider>
  );
}
