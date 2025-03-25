import { NextRequest, NextResponse } from "next/server";
import {
  GenerationConfig,
  GoogleGenerativeAI,
  ResponseSchema,
  SchemaType,
} from "@google/generative-ai";

const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;
if (!apiKey) {
  throw new Error("GOOGLE_AI_STUDIO_KEY is not defined");
}
const genAI = new GoogleGenerativeAI(apiKey);

export async function GET(
  req: NextRequest,
): Promise<NextResponse<Record<string, string>>> {
  try {
    const sourceCategories =
      req.nextUrl.searchParams.get("source_categories")?.split(",") || [];
    const destinationCategories =
      req.nextUrl.searchParams.get("destination_categories")?.split(",") || [];

    if (!destinationCategories.includes("other")) {
      destinationCategories.push("other");
    }

    // Construct the system instruction with dynamic categories
    const systemInstruction = `
You are an expert in personal finance category mapping. Your task is to map categories from the "source categories" list to the "destination categories" list.

**Source Categories:**
${sourceCategories.map((cat) => `- ${cat}`).join("\n")}

**Destination Categories:**
${destinationCategories.map((cat) => `- ${cat}`).join("\n")}

**Instructions:**

1. **Map each source category to the most appropriate destination category.** Consider the meaning and typical transactions associated with each category.
2. **If a source category does not clearly fit into any of the provided destination categories, use "other" as the destination category.**  You are always allowed to use "other" as a destination, even if it's not explicitly listed in the destination categories.
3. **Prioritize semantic similarity.**  Map categories based on their underlying meaning, not just keyword matching.
4. **Output a JSON dictionary (object) where:**
    - The keys are the source categories (exactly as listed above).
    - The values are the corresponding destination categories (chosen from the destination categories list or "other").

**Example:**

Source Categories:
- Groceries
- Restaurants
- Bills & Utilities
- Shopping

Destination Categories:
- Food - Groceries
- Food - Eating Out
- Utilities
- Fun Money
- Uncategorized

Expected Output JSON (for the example above):
\`\`\`json
{
  "Groceries": "Food - Groceries",
  "Restaurants": "Food - Eating Out",
  "Bills & Utilities": "Utilities",
  "Shopping": "Fun Money"
}
\`\`\`

**Now, based on the Source and Destination Categories provided above, please generate the JSON output.**
`;

    // Create the model with dynamic system instruction
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      systemInstruction,
    });

    // Define the response schema with dynamic categories
    const responseSchema: ResponseSchema = {
      type: SchemaType.OBJECT, // Or just "object" if SchemaType is not needed and plain string is acceptable
      description:
        "Gemini-compatible schema for category mapping. Restricts keys to source categories and values to destination categories or 'other'.",
      properties: {} as Record<string, any>, // Initialize an empty 'properties' object
      required: sourceCategories, // Required keys are the source categories
    };

    // Dynamically add properties for each source category
    sourceCategories.forEach((sourceCategory) => {
      responseSchema.properties![sourceCategory] = {
        type: SchemaType.STRING, // Or just "string"
        description: `Mapping for source category '${sourceCategory}'. Must be one of the destination categories or 'other'.`,
        enum: [...destinationCategories, "other"], // Allowed destination categories + "other"
      };
    });

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
    });

    // Send the processing request
    const result = await chatSession.sendMessage(
      "Process the provided categories.",
    );

    // Parse the result
    const conversion: Record<string, string> = JSON.parse(
      result.response.text(),
    );
    console.log("Conversion result:", conversion);

    return NextResponse.json(conversion);
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
