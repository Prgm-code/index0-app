import { ImageResponse } from "next/og";
import { join } from "path";
import { readFileSync } from "fs";

// Image metadata
export const alt = "Index0 - Document Management System";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation using the uploaded static image
export default async function Image({
  params,
}: {
  params: { locale: string };
}) {
  try {
    // Read the uploaded OG image from the public directory
    const imagePath = join(process.cwd(), "public", "og.png");
    const imageData = readFileSync(imagePath);
    const ogImageSrc = `data:image/png;base64,${imageData.toString("base64")}`;

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#360269", // Purple background matching the image
          }}
        >
          <img
            src={ogImageSrc}
            alt="Index0"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>
      ),
      {
        ...size,
      }
    );
  } catch (e) {
    console.error("Error generating OG image:", e);

    // Fallback to simple text if image can't be loaded
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: "#360269", // Purple background
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
          }}
        >
          Index0
        </div>
      ),
      {
        ...size,
      }
    );
  }
}
