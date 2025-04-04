import { NextResponse, NextRequest } from "next/server";
import * as plaid from "plaid";
import { getAccessToken, plaidClient } from "../lib/plaid-server";
import { DEV_USER_ID } from "@/lib/plaid";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Transaction = {
  name: string;
  description: string;
  amount: number; // 2 Decimal Places
  category: string;
};

type TransactionGroup = {
  name: string;
  description?: string;
  source: string | null;
  date: string;
  transactions: Transaction[];
};

export async function GET(req: NextRequest) {
  try {
    // Get the userId and categories from the request, e.g., from query parameters
    const userId = req.nextUrl.searchParams.get("userId") || DEV_USER_ID;
    const categories =
      req.nextUrl.searchParams.get("categories")?.split(",") || [];
    const tokenData = getAccessToken(userId);

    if (!tokenData) {
      return NextResponse.json({
        error: `Access token not found for user ${userId}`,
      });
    }

    let { accessToken: ACCESS_TOKEN } = tokenData;

    let cursor = null;
    // New transaction updates since "cursor"
    let added: plaid.Transaction[] = [];
    let modified: plaid.Transaction[] = [];
    // Removed transaction ids
    let removed: plaid.RemovedTransaction[] = [];
    let hasMore = true;
    // Iterate through each page of new transaction updates for item
    while (hasMore) {
      const request: plaid.TransactionsSyncRequest = {
        access_token: ACCESS_TOKEN,
      };
      const response = await plaidClient.transactionsSync(request);
      const data = response.data;

      // If no transactions are available yet, wait and poll the endpoint.
      // Normally, we would listen for a webhook, but the Quickstart doesn't
      // support webhooks. For a webhook example, see
      // https://github.com/plaid/tutorial-resources or
      // https://github.com/plaid/pattern
      cursor = data.next_cursor;
      if (cursor === "") {
        await sleep(2000);
        continue;
      }

      // Add this page of results
      added = added.concat(data.added);
      modified = modified.concat(data.modified);
      removed = removed.concat(data.removed);
      hasMore = data.has_more;
    }

    // Get a list of all the plaid transactions
    const plaidCategories = new Set(
      added.map((txn) => txn.personal_finance_category?.detailed ?? "other"),
    );
    const plaidTransactions = Array.from(plaidCategories);
    const beanCategories = categories;

    const categoryMapping: Record<string, string> = await fetch(
      `${req.nextUrl.origin}/api/llm-cat-conversion?source_categories=${plaidTransactions.join(
        ",",
      )}&destination_categories=${beanCategories.join(",")}`,
    ).then((res) => res.json());
    console.log("Category mapping:", categoryMapping);

    // Convert the Plaid transaction type to our internal format
    const processed_transactions: TransactionGroup[] = added.map(
      (txn: plaid.Transaction) => ({
        name: txn.name,
        description: txn.name ?? "",
        source: "plaid",
        date: txn.date,
        transactions: [
          {
            name: txn.name,
            description: txn.name,
            amount: txn.amount,
            category: txn.personal_finance_category?.detailed
              ? (categoryMapping[txn.personal_finance_category.detailed] ??
                "other")
              : "other",
          },
        ],
      }),
    );
    console.log("Processed transactions:", processed_transactions);
    return NextResponse.json(processed_transactions);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch transactions" });
  }
}
