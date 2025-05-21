// Interfaces
export interface VectorSearchResponse {
  object: string;
  search_query: string;
  response: string;
  data: Array<{
    file_id: string;
    filename: string;
    score: number;
    content: Array<{
      id: string;
      type: string;
      text: string;
    }>;
    attributes: {
      timestamp: number;
      folder: string;
    };
  }>;
  has_more: boolean;
  next_page: string | null;
}

export interface FileItem {
  key: string;
  size: number;
  lastModified: string;
  type: "file";
  url?: string;
  vectorMetadata?: {
    score?: number;
    content?: Array<{
      id: string;
      type: string;
      text: string;
    }>;
    attributes?: {
      timestamp?: number;
      folder?: string;
    };
  };
}

export interface FolderItem {
  key: string;
  type: "folder";
  vectorMetadata?: {
    score?: number;
    content?: Array<{
      id: string;
      type: string;
      text: string;
    }>;
    attributes?: {
      timestamp?: number;
      folder?: string;
    };
  };
}
