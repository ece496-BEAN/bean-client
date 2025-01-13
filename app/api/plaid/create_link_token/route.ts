// app/api/plaid/create_link_token/route.ts
import { DEV_USER_ID, plaidClient } from "@/lib/plaid";
import { CountryCode, LinkTokenCreateRequest, Products } from "plaid";
import { NextResponse, NextRequest } from "next/server";

export async function POST() {
  try {
    console.log("USING HARDCODED USER");
    const configs: LinkTokenCreateRequest = {
      user: {
        // This should correspond to a unique id for the current user.
        client_user_id: DEV_USER_ID,
      },
      client_name: "BEAN",
      // No required products; we need transactions, but some banks have it available
      // under investments.
      //   products: process.env.PLAID_PRODUCTS!.split(',') as any,
      required_if_supported_products: [
        Products.Transactions,
        Products.Investments,
      ],
      country_codes: [CountryCode.Ca],
      language: "en",
    };

    // TODO
    if (process.env.PLAID_REDIRECT_URI) {
      configs.redirect_uri = process.env.PLAID_REDIRECT_URI;
    }

    const createTokenResponse = await plaidClient.linkTokenCreate(configs);
    return NextResponse.json(createTokenResponse.data);
  } catch (error) {
    return NextResponse.json(error);
  }
}
