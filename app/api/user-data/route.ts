import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "data/test/savings.json");
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
