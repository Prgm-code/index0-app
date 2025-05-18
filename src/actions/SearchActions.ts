"use server";
import { clerkClient } from "@clerk/nextjs/server";

import { auth } from "@clerk/nextjs/server";

const SEARCH_URL = process.env.SEARCH_URL || "";

export const searchFiles = async (query: string) => {
  const client = await clerkClient();
  const { sessionClaims } = await auth();
  const user = await client.users.getUser(sessionClaims?.sub as string);
  const folders = Array.isArray(user.privateMetadata.folder)
    ? [...user.privateMetadata.folder]
    : [];

  const rootFolder = `${sessionClaims?.sub}/`;

  folders.push(rootFolder);

  try {
    const response = await fetch(SEARCH_URL, {
      method: "POST" /*  */,
      body: JSON.stringify({ query, folders }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to search");
    }

    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error searching:", error);
    throw new Error("Failed to search");
  }
};
