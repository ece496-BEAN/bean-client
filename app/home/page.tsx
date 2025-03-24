// import { LoginPage } from "@/components/login-page"

// export default function Page() {
//   return <LoginPage />
// }

import { MainPage } from "@/components/home-page";
import CategoryProvider from "@/contexts/CategoriesContext";
import TransactionProvider from "@/contexts/TransactionsContext";

export default function Page() {
  return (
    <TransactionProvider>
      <CategoryProvider>
        <MainPage />
      </CategoryProvider>
    </TransactionProvider>
  );
}
