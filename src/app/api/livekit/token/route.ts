import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userName } = body;

    if (!userName) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Get API key and secret from environment variables
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: "LiveKit API credentials not configured" },
        { status: 500 }
      );
    }

    // Create a room name for the interview session
    const roomName = `interview-${Date.now()}`;

    // Create a token with the user's identity
    const at = new AccessToken(apiKey, apiSecret, {
      identity: userName,
    });

    // Grant permissions to the room
    at.addGrant({ roomJoin: true, room: roomName });

    // Generate the token
    const token = at.toJwt();

    return NextResponse.json({ token, roomName });
  } catch (error) {
    console.error("Error generating LiveKit token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
