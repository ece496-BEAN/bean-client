import path from "path";
import fs from "fs";
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

const TOKEN_STORE_PATH = path.join(process.cwd(), "tokens.json");

interface TokenData {
  accessToken: string;
  itemId: string;
}

interface TokenStore {
  [userId: string]: TokenData;
}

const readTokenStore = (): TokenStore => {
  try {
    const data = fs.readFileSync(TOKEN_STORE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading token store:", error);
    return {};
  }
};

const writeTokenStore = (tokenStore: TokenStore) => {
  try {
    fs.writeFileSync(TOKEN_STORE_PATH, JSON.stringify(tokenStore, null, 2));
  } catch (error) {
    console.error("Error writing token store:", error);
  }
};

export const setAccessToken = (
  userId: string,
  accessToken: string,
  itemId: string,
) => {
  const tokenStore = readTokenStore();
  tokenStore[userId] = { accessToken, itemId };
  writeTokenStore(tokenStore);
  console.log("Updated token store:", tokenStore);
};

export const getAccessToken = (userId: string): TokenData | undefined => {
  const tokenStore = readTokenStore();
  console.log("Token store:", tokenStore);
  return tokenStore[userId];
};
