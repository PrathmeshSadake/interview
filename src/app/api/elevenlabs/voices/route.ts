import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Get API key from environment variable
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      );
    }

    // Call ElevenLabs API to get voices
    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: `ElevenLabs API error: ${JSON.stringify(errorData)}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Format the response to only include id and name
    const voices = data.voices.map((voice: any) => ({
      id: voice.voice_id,
      name: voice.name,
    }));

    return NextResponse.json({ voices });
  } catch (error) {
    console.error("Error fetching ElevenLabs voices:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
