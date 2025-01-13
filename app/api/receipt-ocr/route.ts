import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
// schema stuff based on the tutorial here: https://ai.google.dev/gemini-api/docs/structured-output?lang=web

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

    // descriptions are long here to tailor to LLM.
    const schema = {
      description: "This JSON schema contains transaction group data.",
      type: SchemaType.OBJECT,
      properties: {
        // TODO: add id field
        name: {
          type: SchemaType.STRING,
          description:
            "This is a name that describes the entire transaction group. \
                        It may be based off the items that were purchased and/or the store that was visited",
        },
        date: {
          type: SchemaType.STRING,
          //format: date, // TODO clarify format
          description:
            "This is the date on which this transaction group was made. \
                        The format must be: YYYY-MM-DD-HH-MM-SS. \
                        If the date is unknown, put '???'",
        },
        transactions: {
          type: SchemaType.ARRAY,
          items: {
            description:
              "Each item in this array represents one transaction and its associated data",
            type: SchemaType.OBJECT,
            properties: {
              name: {
                type: SchemaType.STRING,
                description:
                  "This is the name of item or service for which the transaction was made",
              },
              amount: {
                type: SchemaType.NUMBER,
                // BUG: sometimes if there are multiple of an item in the receipt it can do extra, erroneous multiplications on the value
                description:
                  "This is the price at which the transaction was made. This value must be in cents.",
              },
              category: {
                type: SchemaType.STRING,
                description:
                  "This is the category under which the transaction falls under. \
                              It is limited to the following values: \
                              'Groceries', \
                              'Rent', \
                              'Transportation', \
                              'Other' \
                              ",
              },
              description: {
                type: SchemaType.STRING,
                description:
                  "This is an optional description of the individual transaction item.",
              },
            },
            required: ["amount", "name", "category"],
          },
        },
      },
      required: ["name", "date"],
    };

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const imagePart = {
      inlineData: {
        data: inlineData,
        mimeType,
      },
    };

    // simple text extraction prompt
    // const prompt = "Print the text in this image, line by line.";

    // TODO: have logic that compares extracted prices to subtotal/total to determine if we read anything incorrectly, particularly in regards to multiple items being purchased
    // TODO: test what happens if there are duplicate entries in the receipt...
    const prompt =
      "This is a photo of a receipt. Extract its data into the provided JSON schema. Do not multiply any individual item prices to account for quantity of items purchased. If the receipt is illegible, return an empty JSON structure.";
    // google recommends placing image BEFORE prompt for better results https://ai.google.dev/gemini-api/docs/vision
    const result = await model.generateContent([imagePart, prompt]);

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
