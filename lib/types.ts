export type PartialByKeys<T extends object, K extends keyof T = keyof T> = Omit<
  T,
  K
> &
  Partial<Pick<T, K>>;

export type DefaultTransactionCategory =
  | "Food"
  | "Income"
  | "Utilities"
  | "Clothing"
  | "Transportation"
  | "Entertainment"
  | "Housing";

export type Transaction = {
  id: string; // UUID
  group_id: string; // UUID
  name: string;
  description: string;
  amount: number;
  date: string;
  category: Category;
};

export type Category = {
  id: string; // UUID
  name: DefaultTransactionCategory | string;
  description: string;
  legacy: boolean;
};

export type TransactionGroup = {
  id: string; // UUID
  name: string;
  description: string;
  source: string;
  date: string;
  transactions: Transaction[];
};

export type BudgetItem = {
  id: string; // UUID
  budget_id: string; // UUID
  allocation: number; // 2 decimal places
  category: Category;
};

export type Budget = {
  id: string; // UUID
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  items: BudgetItem[];
};

export type PaginatedServerResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: unknown[];
};
