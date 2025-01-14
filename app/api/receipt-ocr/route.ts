import { NextResponse } from "next/server";
import {
  GenerationConfig,
  GoogleGenerativeAI,
  SchemaType,
} from "@google/generative-ai";
// schema stuff based on the tutorial here: https://ai.google.dev/gemini-api/docs/structured-output?lang=web

const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;
if (!apiKey) {
  throw new Error("GOOGLE_AI_STUDIO_KEY is not defined");
}
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  systemInstruction:
    'You are an expert at extracting information from purchase receipts and structuring it as a JSON object.\n\n**Input:** An image or OCR\'d text of a purchase receipt.\n\n**Output:** A JSON object containing the following fields extracted from the receipt:\n\n*   **raw:** (string) The raw OCR output of the receipt.\n*   **store_info:** (object)\n    *   **store_name:** (string) The name of the store.\n    *   **address:** (string) A combination of the store\'s address, city, state, and zip code as found on the receipt. Exact formatting is not critical, prioritize capturing all the information.\n*   **transaction_info:** (object)\n    *   **date_time:** (string) The date and time of the transaction in ISO 8601 format (YYYY-MM-DDTHH:MM:SS).\n*   **items:** (array of objects)  An array where each object represents a purchased item.\n    *   **name:** (string) The item description as it appears on the receipt.\n    *   **user_friendly_name:** (string) Your best guess at the full, common name of the item.\n    *   **item_code:** (string) The item code or SKU, if present on the receipt.\n    *   **price:** (number) The final price of the item.\n    *   **category:** (string) The broad category of the item. Choose from one of the following: ["groceries", "household", "electronics", "entertainment"]. If you cannot confidently determine the category, set this field to "unknown". Do not invent categories.\n*   **totals:** (object)\n    *   **subtotal:** (number) The subtotal amount of the purchase.\n    *   **tax:** (number) The total tax amount.\n    *   **total:** (number) The final total amount of the purchase.\n*   **payment_info:** (object)\n    *   **payment_type:** (string) The method of payment used (e.g., "DEBIT", "CREDIT", "CASH").\n    *   **amount_tendered:** (number) The amount the customer paid.\n    *   **change_due:** (number) The amount of change given back to the customer.\n    *   **card_type:** (string, optional) The type of card used (e.g., "VISA", "MASTERCARD"). Only include if present.\n    *   **card_number_suffix:** (string, optional) The last four digits of the card number. Only include if present.\n\n**Instructions:**\n\n1. Carefully read and understand the entire receipt content.\n2. Extract the information for each field as accurately as possible.\n3. If a piece of information is not present on the receipt, do not include the corresponding field in the JSON output (unless it\'s explicitly marked as required).\n4. For the `user_friendly_name`, use your knowledge base to provide a more descriptive name if the `name` on the receipt is abbreviated or unclear. If you are unsure, use the `name` from the receipt.\n5. For the `category`, strictly adhere to the provided list of ["groceries", "household", "electronics", "entertainment"]. If an item doesn\'t clearly fit into one of these, mark it as "unknown".\n6. Ensure the output is a valid JSON object.',
});

const generationConfig: GenerationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
  responseSchema: {
    type: SchemaType.OBJECT,
    properties: {
      raw: {
        type: SchemaType.STRING,
      },
      store_info: {
        type: SchemaType.OBJECT,
        properties: {
          store_name: {
            type: SchemaType.STRING,
          },
          address: {
            type: SchemaType.STRING,
          },
        },
        required: ["store_name", "address"],
      },
      transaction_info: {
        type: SchemaType.OBJECT,
        properties: {
          date_time: {
            type: SchemaType.STRING,
          },
        },
        required: ["date_time"],
      },
      items: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            name: {
              type: SchemaType.STRING,
            },
            user_friendly_name: {
              type: SchemaType.STRING,
            },
            item_code: {
              type: SchemaType.STRING,
            },
            price: {
              type: SchemaType.NUMBER,
            },
            category: {
              type: SchemaType.STRING,
              enum: [
                "groceries",
                "household",
                "electronics",
                "entertainment",
                "unknown",
              ],
            },
          },
          required: [
            "name",
            "user_friendly_name",
            "item_code",
            "price",
            "category",
          ],
        },
      },
      totals: {
        type: SchemaType.OBJECT,
        properties: {
          subtotal: {
            type: SchemaType.NUMBER,
          },
          tax: {
            type: SchemaType.NUMBER,
          },
          total: {
            type: SchemaType.NUMBER,
          },
        },
        required: ["subtotal", "tax", "total"],
      },
      payment_info: {
        type: SchemaType.OBJECT,
        properties: {
          payment_type: {
            type: SchemaType.STRING,
          },
          amount_tendered: {
            type: SchemaType.NUMBER,
          },
          change_due: {
            type: SchemaType.NUMBER,
          },
          card_type: {
            type: SchemaType.STRING,
          },
          card_number_suffix: {
            type: SchemaType.STRING,
          },
        },
        required: ["payment_type", "amount_tendered", "change_due"],
      },
    },
    required: [
      "raw",
      "store_info",
      "transaction_info",
      "items",
      "totals",
      "payment_info",
    ],
  },
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;
    const mimeType = formData.get("mimeType") as string;
    const displayName = formData.get("displayName") as string;

    console.log(`Received file: ${displayName} (${mimeType})`);

    // Using inline data instead of file upload
    // https://ai.google.dev/gemini-api/docs/vision?lang=node#base64-encoded
    const buffer = Buffer.from(await file.arrayBuffer());
    const inlineData = buffer.toString("base64");

    const imagePart = {
      inlineData: {
        data: inlineData,
        mimeType,
      },
    };

    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [imagePart],
        },
      ],
    });

    // TODO: have logic that compares extracted prices to subtotal/total to determine if we read anything incorrectly, particularly in regards to multiple items being purchased
    // TODO: test what happens if there are duplicate entries in the receipt...
    // google recommends placing image BEFORE prompt for better results https://ai.google.dev/gemini-api/docs/vision
    const result = await chatSession.sendMessage("Process this receipt");

    console.log(
      `~~~~~~~~~~~ DEBUG results for file ${displayName} ~~~~~~~~~~~~\n ${result.response.text()}`,
    );

    return NextResponse.json(result.response.text());
    // components/recent-transactions match this format. array of objects
  } catch (error) {
    console.error("Error processing request:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to process request", details: errorMessage },
      { status: 500 },
    );
  }
}
