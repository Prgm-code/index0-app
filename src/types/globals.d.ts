export {};

// Create a type for the roles
export type Roles = "admin" | "moderator" | "client" | "user";

// Extendemos la interfaz global
declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      role?: Roles;
      companies?: string[];
    };
  }
}
