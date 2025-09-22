import { NextResponse } from "next/server";
import { isValidUrl, processUrl } from "@/utils/url-processor";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;

    // Input validation
    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Process the URL (fetch and clean content)
    const result = await processUrl(url);

    if (!result.isSuccess) {
      return NextResponse.json(
        { error: result.error || "Failed to process URL" },
        { status: 400 }
      );
    }

    // Return the processed content and capture date
    return NextResponse.json({
      content: result.content,
      captureDate: result.captureDate,
      url: url
    });
  } catch (error) {
    console.error("Error processing URL:", error);
    return NextResponse.json(
      { error: "Failed to process URL" },
      { status: 500 }
    );
  }
}
