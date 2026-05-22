import { NextResponse } from "next/server";
import { recommendByAI } from "../../../lib/aiDepartmentRecommend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "title is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "content is required and must be a non-empty string." },
        { status: 400 }
      );
    }

    // Call the AI recommendation logic (which includes the fallback)
    const recommendations = await recommendByAI(title, content);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Error in recommend API route:", error);
    return NextResponse.json(
      { error: "An internal server error occurred while processing the request." },
      { status: 500 }
    );
  }
}
