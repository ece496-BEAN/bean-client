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

export type WriteOnlyTransaction = {
  uuid?: string; // UUID not needed when creating a new transaction
  name: string;
  description?: string;
  amount: number; // 2 Decimal Places
  category_uuid: string; // UUID
};

export type ReadOnlyTransaction = {
  id: string; // UUID
  group_id: string; // UUID
  name: string;
  description?: string;
  amount: number; // 2 Decimal Places
  category: Category;
};

export type Transaction = WriteOnlyTransaction | ReadOnlyTransaction;

export type Category = {
  id: string; // UUID
  name: DefaultTransactionCategory | string;
  description?: string;
  legacy: boolean;
};

export type TransactionGroup = {
  id?: string; // UUID
  name: string;
  description?: string;
  source: string | null;
  date: string;
  transactions: Transaction[];
};

export type WriteOnlyBudgetItem = {
  uuid: string; // UUID
  allocation: number; // 2 decimal places
  category_uuid: string; // UUID
};

export type ReadOnlyBudgetItem = {
  id: string; // UUID
  budget_id: string; // UUID
  allocation: number; // 2 decimal places
  category: Category;
};

export type BudgetItem = WriteOnlyBudgetItem | ReadOnlyBudgetItem;

export type Budget = {
  id: string; // UUID
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  items: BudgetItem[];
};

export type PaginatedServerResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};
