import { NextResponse } from "next/server";
import { calculateSaju, SajuInputError } from "@/lib/saju/calculate";
import { parseSajuInput } from "@/lib/saju/validate";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const input = parseSajuInput(await req.json());
    return NextResponse.json(calculateSaju(input));
  } catch (err) {
    if (err instanceof SajuInputError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "사주 계산 중 오류가 발생했습니다." }, { status: 500 });
  }
}
