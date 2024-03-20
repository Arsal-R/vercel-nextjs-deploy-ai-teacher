import { NextResponse } from "next/server";

const OPENAI_API_KEY = process.env["OPENAI_API_KEY"];

// This function handles POST requests to the /api/speechToText route
export async function POST(request) {
  try {
    // Parse the request body
    const formData = await request.formData();
    formData.append("model", "whisper-1");

    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        method: "POST",
        body: formData,
      }
    );
    const result = await response.json();

    return NextResponse.json({ text: result.text });
  } catch (error) {
    return NextResponse.json({ error: error });
  }
}
