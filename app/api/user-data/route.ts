import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getSession } from "@/auth";

export async function GET() {
  const session = await getSession();
  console.log("session email", session?.user?.email);
  const filePath = path.join(
    process.cwd(),
    "data/test/sample_transactions.json",
  );
  try {
    const data = await fs.promises.readFile(filePath, "utf8");
    const savingsData = JSON.parse(data);
    return NextResponse.json(savingsData);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read or parse data" },
      { status: 500 },
    );
  }
}
