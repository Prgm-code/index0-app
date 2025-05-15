import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const filename = searchParams.get("filename")

  if (!filename) {
    return NextResponse.json({ error: "Filename is required" }, { status: 400 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 })
    }

    // Check file type - reject video and audio files
    if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
      return NextResponse.json({ error: "Video and audio files are not supported" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    // Here you would typically:
    // 1. Process the document with AI to extract content
    // 2. Store metadata in your database
    // 3. Return the processed information

    return NextResponse.json({
      url: blob.url,
      success: true,
      message: "File uploaded successfully",
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Error uploading file" }, { status: 500 })
  }
}
