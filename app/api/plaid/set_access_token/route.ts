import { DEV_USER_ID } from "@/lib/plaid";
import { NextResponse, NextRequest } from "next/server";
import { plaidClient, setAccessToken } from "../lib/plaid-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const public_token = body.public_token;
    const userId = body.userId || DEV_USER_ID; // Get userId from request body

    const tokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token: public_token,
    });

    const ACCESS_TOKEN = tokenResponse.data.access_token;
    const ITEM_ID = tokenResponse.data.item_id;

    // Store the access_token and item_id in memory
    setAccessToken(userId, ACCESS_TOKEN, ITEM_ID);
    console.log(`Access token set for user ${userId}`);

    return NextResponse.json({
      // the 'access_token' is a private token, DO NOT pass this token to the frontend in your production environment
      item_id: ITEM_ID,
      error: null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to exchange public token" });
  }
}
