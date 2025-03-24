import { NextResponse, NextRequest } from "next/server";
import * as plaid from "plaid";
import { getAccessToken, plaidClient } from "../lib/plaid-server";
import { DEV_USER_ID } from "@/lib/plaid";
import {
  ReadOnlyTransaction,
  Transaction,
  TransactionGroup,
  WriteOnlyTransaction,
} from "@/lib/types";
import {
  mapPlaidToBeanTransactionCategory,
  PlaidPrimaryTransactionCategory,
} from "@/lib/data-mapping";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(req: NextRequest) {
  try {
    // Get the userId and categories from the request, e.g., from query parameters
    const userId = req.nextUrl.searchParams.get("userId") || DEV_USER_ID;
    const categories =
      req.nextUrl.searchParams.get("categories")?.split(",") || [];
    console.log(
      `Fetching transactions for user ${userId} with categories ${categories}`,
    );
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

    console.log(added);

    // Convert the Plaid transaction type to our internal format
    const processed_transactions: Omit<TransactionGroup<Transaction>, "id">[] =
      added.map((txn: plaid.Transaction) => ({
        name: txn.name,
        description: txn.name ?? "",
        source: null,
        date: txn.date,
        transactions: [
          {
            name: txn.name,
            description: txn.name,
            amount: txn.amount,
            // TODO(Fred): Map the Plaid category to our internal category
            id: "", // Placeholder value (doesn't need to be set as it's ignored during POST)
            group_id: "", // Placeholder value (doesn't need to be set as it's ignored during POST)
            category: {
              id: "", // Placeholder value (will be replaced during category mapping)
              name: txn.personal_finance_category?.primary ?? "OTHER",
              description: "",
              is_income_type: false,
              legacy: false,
            },
          },
        ],
      }));
    return NextResponse.json({ transactions: processed_transactions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch transactions" });
  }
}
