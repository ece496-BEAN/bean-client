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
  model: "gemini-2.0-flash",
  systemInstruction: `
        You are an assistant budget creator.
        You will receive a category as input.
        Your task is to generate a JSON array of objects, where each object represents a subcategory within the provided category.
        Each object should have two properties: "subcategory" (a string representing the name of the subcategory) and "examples" (a string providing examples of expenses within that subcategory).
        Do NOT generate more than 5 subcategories.
    `,
});

const generationConfig: GenerationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
  responseSchema: {
    type: SchemaType.ARRAY,
    description: "An array of entertainment subcategory objects.",
    items: {
      type: SchemaType.OBJECT,
      properties: {
        subcategory: {
          type: SchemaType.STRING,
          description:
            "The name of the entertainment subcategory (e.g., Streaming Services, Going Out).",
        },
        examples: {
          type: SchemaType.STRING,
          description:
            "Examples of expenses that fall under this subcategory (e.g., Netflix, movies, concerts).",
        },
      },
      required: ["subcategory", "examples"],
    },
  },
};

export type GeneratedSubcategory = {
  subcategory: string;
  examples: string;
};

export type GeneratedSubcategories = GeneratedSubcategory[];

export async function POST(request: Request) {
  try {
    const body: { category: string } = await request.json();
    console.log("Received data:", body);

    const prompt = `Generate subcategories for the following category: ${body.category}`;

    const chatSession = model.startChat({
      generationConfig,
    });

    const result = await chatSession.sendMessage(prompt);
    if (
      !result.response.candidates ||
      result.response.candidates.length === 0
    ) {
      return NextResponse.json(
        { error: "Failed to generate subcategories" },
        { status: 500 },
      );
    }
    const subcategoriesText =
      result.response.candidates[0].content.parts[0].text ?? "";
    const subcategories: GeneratedSubcategories = JSON.parse(subcategoriesText);
    console.log("Generated subcategories:", subcategories);

    return NextResponse.json(subcategories, { status: 200 });
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
