import { UUID } from "crypto";

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
export type DocumentScansImage = {
  id: UUID; // UUID
  image: string; // URL
  source: UUID; // UUID of the corresponding DocumentScans
};

export type DocumentScans = {
  id: UUID; // UUID
  ocr_result: string;
  images: DocumentScansImage[];
};

export type WriteOnlyTransaction = {
  uuid?: UUID; // UUID not needed when creating a new transaction
  name: string;
  description?: string;
  amount: number; // 2 Decimal Places
  category_uuid: UUID; // UUID
};

export type ReadOnlyTransaction = {
  id: UUID; // UUID
  group_id: UUID; // UUID
  name: string;
  description?: string;
  amount: number; // 2 Decimal Places
  category: Category;
};

export type Transaction = WriteOnlyTransaction | ReadOnlyTransaction;

export type Category = {
  id: UUID; // UUID
  name: DefaultTransactionCategory | string;
  description?: string;
  legacy: boolean;
  is_income_type: boolean;
  color: string; // #RRGGBB or #RRGGBBAA format
};

export type TransactionGroup<T extends Transaction> = {
  id: UUID; // UUID
  name: string;
  description?: string;
  source: UUID | null;
  date: string;
  transactions: T[];
};

export type WriteOnlyBudgetItem = {
  uuid?: UUID; // UUID
  allocation: number; // Up to 2 decimal places
  category_uuid: UUID; // UUID
};

export type ReadOnlyBudgetItem = {
  id: UUID; // UUID
  budget_id: UUID; // UUID
  allocation: number; // Up to 2 decimal places
  category: Category;
  allocation_used: number; // Up to 2 decimal places
};

export type BudgetItem = WriteOnlyBudgetItem | ReadOnlyBudgetItem;

export type ReadOnlyBudget = {
  id: UUID; // UUID
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  budget_items: ReadOnlyBudgetItem[];
  total_allocation: number; // Up to 2 decimal places
  total_used: number; // Up to 2 decimal places
};
export type WriteOnlyBudget = {
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  budget_items: WriteOnlyBudgetItem[];
};
export type Budget = WriteOnlyBudget | ReadOnlyBudget;

export type ServerResponse<T> =
  | PaginatedServerResponse<T>
  | NonPaginatedServerResponse<T>;

export type NonPaginatedServerResponse<T> =
  T extends TransactionGroup<Transaction>
    ? { results: T[]; totals: { income: number; expense: number } } // Special case for TransactionGroup
    : T[];

export type PaginatedServerResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
} & (T extends TransactionGroup<Transaction>
  ? { totals: { income: number; expense: number } }
  : { totals?: undefined });

export function isArrayType<T>(value: T | T[]): value is T[] {
  return Array.isArray(value);
}
