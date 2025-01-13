import { plaidClient, getAccessToken, DEV_USER_ID } from "@/lib/plaid";
import { NextResponse, NextRequest } from "next/server";
import {
  RemovedTransaction,
  Transaction,
  TransactionsSyncRequest,
} from "plaid";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(req: NextRequest) {
  try {
    // Get the userId from the request, e.g., from query parameters
    const userId = req.nextUrl.searchParams.get("userId") || DEV_USER_ID;
    const tokenData = getAccessToken(userId);

    if (!tokenData) {
      return NextResponse.json({ error: "Access token not found for user" });
    }

    let { accessToken: ACCESS_TOKEN } = tokenData;

    let cursor = null;
    // New transaction updates since "cursor"
    let added: Transaction[] = [];
    let modified: Transaction[] = [];
    // Removed transaction ids
    let removed: RemovedTransaction[] = [];
    let hasMore = true;
    // Iterate through each page of new transaction updates for item
    while (hasMore) {
      const request: TransactionsSyncRequest = {
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

    const compareTxnsByDateAscending = (a: Transaction, b: Transaction) =>
      new Date(a.date).getTime() - new Date(b.date).getTime();
    // Return the 8 most recent transactions
    const recently_added = [...added]
      .sort(compareTxnsByDateAscending)
      .slice(-8);
    return NextResponse.json({ latest_transactions: recently_added });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch transactions" });
  }
}
