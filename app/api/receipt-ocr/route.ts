import { NextResponse } from "next/server";
import {
  GenerationConfig,
  GoogleGenerativeAI,
  SchemaType,
} from "@google/generative-ai";

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

const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;
if (!apiKey) {
  throw new Error("GOOGLE_AI_STUDIO_KEY is not defined");
}
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: Request) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as Blob;
    const mimeType = formData.get("mimeType") as string;
    const displayName = formData.get("displayName") as string;
    const categories: string[] = JSON.parse(
      formData.get("categories") as string,
    );
    console.log(categories);

    console.log(`Received file: ${displayName} (${mimeType})`);

    // Convert file to base64 for inline data
    const buffer = Buffer.from(await file.arrayBuffer());
    const inlineData = buffer.toString("base64");

    const imagePart = {
      inlineData: {
        data: inlineData,
        mimeType,
      },
    };

    // Construct the system instruction with dynamic categories
    const systemInstruction = `
      You are an expert at extracting information from purchase receipts and structuring it as a JSON object for financial tracking.

      **Input:** An image or OCR'd text of a purchase receipt.

      **Output:** A JSON object containing the following fields extracted from the receipt:

      * **store_name:** (string) The name of the store.
      * **address:** (string, optional) The store's address.
      * **date_time:** (string) The date and time of the transaction in ISO 8601 format (YYYY-MM-DDTHH:MM:SS).
      * **payment_type:** (string, optional) The method of payment used (e.g., "DEBIT", "CREDIT", "CASH").
      * **items:** (array of objects) An array where each object represents a purchased item.
        * **name:** (string) The item description as it appears on the receipt.
        * **description:** (string) Your best guess at the items's *full* name.
        * **price:** (number) The final price of the item.
        * **category:** (string) The broad category of the item. Choose from one of the following: [${categories.join(", ")}, Unknown]. If you cannot confidently determine the category, set this field to "Unknown". Do not invent categories.
      * **tax:** (number) The total tax amount. If there is no tax, set to 0.

      **Instructions:**

      1. Carefully read and understand the entire receipt content.
      2. Extract the information for each field as accurately as possible.
      3. For the \`category\`, strictly adhere to the provided list of [${categories.join(", ")}, Unknown]. If an item doesn't clearly fit into one of these, mark it as "Unknown".
      4. Ensure the output is a valid JSON object.
    `;

    // Create the model with dynamic system instruction
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction,
    });

    // Define the response schema with dynamic categories
    const responseSchema = {
      type: SchemaType.OBJECT,
      properties: {
        store_name: {
          type: SchemaType.STRING,
        },
        address: {
          type: SchemaType.STRING,
          nullable: true,
        },
        date_time: {
          type: SchemaType.STRING,
        },
        payment_type: {
          type: SchemaType.STRING,
          nullable: true,
        },
        items: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: {
                type: SchemaType.STRING,
              },
              description: {
                type: SchemaType.STRING,
              },
              price: {
                type: SchemaType.NUMBER,
              },
              category: {
                type: SchemaType.STRING,
                enum: [...categories, "Unknown"],
              },
            },
            required: ["name", "price", "category", "description"],
          },
        },
        tax: {
          type: SchemaType.NUMBER,
        },
      },
      required: ["store_name", "date_time", "items", "tax"],
    };

    const generationConfig: GenerationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      responseSchema,
    };

    // Start chat session with the image
    const chatSession = model.startChat({
      generationConfig,
      history: [
        {
          role: "user",
          parts: [imagePart],
        },
      ],
    });

    // Send the processing request
    const result = await chatSession.sendMessage("Process this receipt");

    console.log(
      `~~~~~~~~~~~ DEBUG results for file ${displayName} ~~~~~~~~~~~~\n ${result.response.text()}`,
    );

    // Parse the result
    const receiptData = JSON.parse(result.response.text());

    // Convert to TransactionGroup
    const transactions: Transaction[] = receiptData.items.map((item: any) => ({
      name: item.name,
      amount: -item.price, // Convert to negative for expenses
      category: item.category,
      description: item.description,
    }));

    if (receiptData.tax !== 0) {
      transactions.push({
        name: "Sales Tax",
        amount: -receiptData.tax,
        category: "Tax",
        description: "Sales Tax",
      });
    }

    const transactionGroup: TransactionGroup = {
      name: receiptData.store_name,
      description: receiptData.address || undefined,
      source: receiptData.payment_type || null,
      date: receiptData.date_time,
      transactions,
    };

    return NextResponse.json(transactionGroup);
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
