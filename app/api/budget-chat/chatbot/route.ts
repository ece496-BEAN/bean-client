import { NextResponse } from "next/server";
import {
  GenerationConfig,
  GoogleGenerativeAI,
  SchemaType,
} from "@google/generative-ai";
// import { Transaction } from "@/contexts/TransactionsContext";

const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;
if (!apiKey) {
  throw new Error("GOOGLE_AI_STUDIO_KEY is not defined");
}
const genAI = new GoogleGenerativeAI(apiKey);

// NOTE: LONGER PROMPTS SEEM TO AFFECT MATHEMATICAL STABILITY. DO NOT RAMBLE!!
const prompt = `
You are an expert financial planner with extensive knowledge in personal budgeting for young adults in Canada.
Your task is to use your extensive financial and mathematical skills to provide a user with a monthly budget.
The user will provide their monthly income and unavoidable expenses in this format, where the X's are replaced with amounts in Canadian dollars:

'''
Here's my monthly financial data:
After-tax Income: $XXXX
Monthly Housing Expenses: $XXXX
Monthly Food Expenses: $XXXX
Monthly Transportation Expenses: $XXXX
'''

If the user does not declare any income, then assume that they have an allowance of $1000 to spend each month.

The user will also provide some categories of expenses that they would like to allocate money towards.
The data will be formatted in this way, with each category on a new line:

'''
Can you give me recommendations on how I should spend or save the remaining funds into these expense categories:
Charity
Emergency Fund
Health/Fitness
Investments
Personal Spending
'''

You must format your response in the JSON schema provided below. Briefly justify your allocations for each category. Here are the descriptions of the fields in the JSON schema:

"response_text": This is a string that stores your response message to the user. This will be displayed to the user in a chat interface.

"budget_array": This is an array of objects. Each object represents an expense category that the user mentioned that they would like to allocate money towards. 
In "budget_array", each object has two fields: "category_name" stores the name of the expense category, and "budget" stores the amount of money allocated to that expense category, rounded to the nearest 10 dollars. Only use the user-provided categories. Do not make up any categories yourself.

IMPORTANT: You must make sure that the sum of the amount of money allocated to each budget is equal to the user's specified income minus their specified unavoidable costs.

Below is the user's input.

`;

// BETTER PROMPT USING CHAIN-OF-THOUGHT PROMPTING
// LAY OUT REASONING FOR LLM
const prompt2 = `
You are an expert financial planner with extensive knowledge in personal budgeting for young adults in Canada.
Your task is to use your extensive financial and mathematical skills to provide a user with a monthly budget.

You must format your response in the provided JSON schema. Briefly justify your allocations for each category in your response in "response_text". Here are the descriptions of the fields in the JSON schema:

"response_text": This is a string that stores your response message to the user. This will be displayed to the user in a chat interface.

"budget_array": This is an array of objects. Each object represents an expense category that the user mentioned that they would like to allocate money towards. 
In "budget_array", each object has two fields: "category_name" stores the name of the expense category, and "budget" stores the amount of money allocated to that expense category, rounded to the nearest 10 dollars. Only use the user-provided categories. Do not make up any categories yourself.

Below is an example user input and output, followed by a real user input and your output.

STEP 1: DETERMINE NET INCOME

After-tax Income
Monthly Housing Expenses
Monthly Food Expenses
Monthly Transportation Expenses

+5600
-1850
-320
-150
-----
3280 <- net income

STEP 2: ASSIGN BUDGET ALLOCATIONS

Charity
Emergency Fund
Health/Fitness
Investments
Personal Spending

+160
+1100
+220
+950
+850
-----
3280 == net income

`;

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  // systemInstruction: prompt,
  systemInstruction: prompt2,
});

const generationConfig: GenerationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",

  // TODO: GENERATE CUSTOM SCHEMA BASED ON USER'S CUSTOM BUDGET CATEGORIES
  responseSchema: {
    type: SchemaType.OBJECT,
    properties: {
      response_text: {
        type: SchemaType.STRING,
      },
      budget_array: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            category_name: {
              type: SchemaType.STRING,
            },
            budget: {
              type: SchemaType.INTEGER,
            },
          },
          required: ["category_name", "budget"],
        },
      },
    },
    required: ["response_text", "budget_array"],
  },
};

const chatSession = model.startChat({
  generationConfig: generationConfig,
});

export async function POST(request: Request) {
  // console.log(`DEBUG budget-chat post called`);
  try {
    const requestData = await request;
    const userText = await requestData.text();

    console.log(`DEBUG requestText:\n ${userText}`);

    const result = await chatSession.sendMessage(userText);

    console.log(
      `~~~~~~~~~~~ DEBUG result json: ~~~~~~~~~~~~\n ${result.response.text()}`,
    );

    const respJSON = JSON.parse(result.response.text());

    // const respJSON = {test: "test"};

    return NextResponse.json(respJSON, { status: 200 });
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
