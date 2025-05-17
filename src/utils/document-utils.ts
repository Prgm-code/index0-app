/**
 * Utilidades para manejar rutas y referencias a documentos de manera segura
 */

/**
 * Limpia una ruta o referencia a documento eliminando información sensible
 */
export const cleanDocumentReference = (
  text: string,
  userId: string
): string => {
  if (!text || !userId) return text;

  // Escapar caracteres especiales en el userId
  const escapedUserId = userId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Reemplazar referencias a documentos que incluyen el ID del usuario
  return (
    text
      // Limpiar URLs de documentos
      .replace(
        new RegExp(`\\[Ver documento\\]\\(${escapedUserId}[^)]*\\)`, "g"),
        "[Ver documento](documents/...)"
      )
      // Limpiar rutas de archivos
      .replace(new RegExp(`${escapedUserId}/[^\\s"'\\])}]*`, "g"), "documents/")
      // Limpiar referencias directas al ID del usuario
      .replace(new RegExp(escapedUserId, "g"), "documents")
  );
};

/**
 * Obtiene el nombre del archivo o carpeta de una ruta completa
 */
export const getDisplayName = (path: string): string => {
  if (!path) return "";
  return path.split("/").filter(Boolean).pop() || "";
};

/**
 * Limpia una ruta para mostrarla en la interfaz
 */
export const getDisplayPath = (path: string, userId: string): string => {
  if (!path) return "";

  // Primero limpiamos la ruta de información sensible
  const cleanPath = cleanDocumentReference(path, userId);

  // Luego obtenemos las partes de la ruta sin elementos vacíos
  const parts = cleanPath.split("/").filter(Boolean);

  // Si no hay partes, retornamos vacío
  if (parts.length === 0) return "";

  // Si solo hay una parte, la retornamos
  if (parts.length === 1) return parts[0];

  // Si hay más partes, retornamos la ruta limpia
  return parts.join("/");
};

/**
 * Limpia una URL de documento para mostrarla
 */
export const cleanDocumentUrl = (url: string, userId: string): string => {
  if (!url || !userId) return url;

  // Escapar caracteres especiales en el userId
  const escapedUserId = userId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Reemplazar el ID del usuario en la URL
  return url.replace(new RegExp(escapedUserId, "g"), "documents");
};
