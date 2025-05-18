// utils/roles.ts
"use server";

import { Roles } from "@/types/globals";
import { auth } from "@clerk/nextjs/server";

// Verifica si el usuario tiene un rol específico
export const checkRole = async (role: Roles) => {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.role === role;
};

// Verifica si el usuario pertenece a una empresa en particular
export const checkCompany = async (companyId: string) => {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.companies?.includes(companyId);
};

// Verifica si el usuario es un "client" y además pertenece a la empresa dada
export const checkClientCompany = async (companyId: string) => {
  const { sessionClaims } = await auth();
  return (
    sessionClaims?.metadata?.role === "client" &&
    sessionClaims?.metadata?.companies?.includes(companyId)
  );
};
