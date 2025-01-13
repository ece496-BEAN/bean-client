// lib/plaid.ts
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const configuration = new Configuration({
  basePath:
    PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
      "Plaid-Version": "2020-09-14",
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

export const DEV_USER_ID = "defaultUserId";

interface TokenStore {
  [userId: string]: {
    accessToken: string;
    itemId: string;
  };
}

const tokenStore: TokenStore = {};

export const setAccessToken = (
  userId: string,
  accessToken: string,
  itemId: string,
) => {
  tokenStore[userId] = { accessToken, itemId };
};

export const getAccessToken = (
  userId: string,
): { accessToken: string; itemId: string } | undefined => {
  return tokenStore[userId];
};
