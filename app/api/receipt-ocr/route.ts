import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob;
    const mimeType = formData.get("mimeType") as string;
    const displayName = formData.get("displayName") as string;

    console.log(`Received file: ${displayName} (${mimeType})`);
    const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_AI_STUDIO_KEY is not defined");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const inlineData = buffer.toString("base64");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imagePart = {
      inlineData: {
        data: inlineData,
        mimeType,
      },
    };

    const prompt = "Tell me about this image.";
    const result = await model.generateContentStream([prompt, imagePart]);

    let data = "";
    for await (const chunk of result.stream) {
      data += chunk.text();
    }

    return NextResponse.json({ text: data });
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
