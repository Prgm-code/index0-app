"use server";

import { checkRole } from "./roles-actions";
import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

const INVITATION_URL = process.env.INVITATION_URL;

export async function setRole(formData: FormData) {
  const client = await clerkClient();

  console.log(formData);
  // Check that the user trying to set the role is an admin
  if (!checkRole("admin")) {
    return { message: "Not Authorized" };
  }

  try {
    const res = await client.users.updateUserMetadata(
      formData.get("id") as string,
      {
        publicMetadata: { role: formData.get("role") },
      }
    );
    revalidatePath("/admin/[userSession]/users");
    return { message: res.publicMetadata };
  } catch (err) {
    console.error(err);
    throw new Error("Error setting role");
  }
}

export async function removeRole(formData: FormData) {
  const client = await clerkClient();

  try {
    const res = await client.users.updateUserMetadata(
      formData.get("id") as string,
      {
        publicMetadata: { role: null },
      }
    );
    revalidatePath("/admin/[userSession]/users");
    return { message: res.publicMetadata };
  } catch (err) {
    return { message: err };
  }
}

export async function getUsers() {
  try {
    const client = await clerkClient();
    const users = (await client.users.getUserList()).data;
    return users;
  } catch (err) {
    return { message: err };
  }
}

export async function getUser(userId: string) {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return user;
  } catch (err) {
    return { message: err };
  }
}

export async function getUserMetadata(userId: string) {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return user.privateMetadata;
  } catch (err) {
    return { message: err };
  }
}

export async function inviteUser(
  email: string,
  metadata: CustomJwtSessionClaims["metadata"]
) {
  try {
    const client = await clerkClient();
    const invitation = await client.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: metadata,
      redirectUrl: INVITATION_URL,
    });
    console.log(invitation);
    if (invitation.status === "pending") {
      revalidatePath("/admin/[userSession]/users");
      return {
        message: "User invited successfully",
        id: invitation.id,
        email: invitation.emailAddress,
        createdAt: invitation.createdAt,
        status: 200,
        ok: true,
      };
    }
  } catch (err: unknown) {
    console.error("Error inviting user:", err);
    if (typeof err === "object" && err !== null) {
      const errorObj = err as {
        statusCode?: number;
        status?: number;
        errors?: { message: string }[];
      };
      // Se intenta obtener el status ya sea desde statusCode o status
      const status = errorObj.statusCode || errorObj.status;
      if (
        status === 400 &&
        errorObj.errors &&
        Array.isArray(errorObj.errors) &&
        errorObj.errors.length > 0 &&
        errorObj.errors[0].message
      ) {
        // Devuelve el mensaje específico del error de Clerk
        throw new Error(errorObj.errors[0].message);
      }
    }
    // Respuesta por defecto en caso de error inesperado
    throw new Error("Unexpected error occurred");
  }
}

export async function getInvitations() {
  try {
    const client = await clerkClient();
    const invitations = await client.invitations.getInvitationList();
    return invitations;
  } catch (err) {
    return { message: err };
  }
}

export async function deleteUser(formData: FormData) {
  try {
    const client = await clerkClient();
    await client.users.deleteUser(formData.get("id") as string);
    revalidatePath("/admin/[userSession]/users");
    return { message: "User deleted successfully" };
  } catch (err) {
    return { message: err };
  }
}

export async function revokeInvitation(formData: FormData) {
  const client = await clerkClient();
  const invitationId = formData.get("invitationId") as string;
  await client.invitations.revokeInvitation(invitationId);
  revalidatePath("/admin/[userSession]/users");
  return { message: "Invitation revoked successfully" };
}
