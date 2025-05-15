import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

interface UploadedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

export class StorageService {
  private client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || "";
    this.client = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
      },
      forcePathStyle: true,
    });
  }

  async uploadFile({
    file,
    isPublic = true,
  }: {
    file: UploadedFile;
    isPublic?: boolean;
  }) {
    try {
      const key = `${uuidv4()}`;
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: isPublic ? "public-read" : "private",
        Metadata: {
          originalName: file.originalname,
        },
      });

      await this.client.send(command);

      return {
        url: isPublic
          ? (await this.getFileUrl(key)).url
          : (await this.getPresignedUrl(key)).url,
        key,
        isPublic,
      };
    } catch (error) {
      throw new Error(`Error uploading file: ${error}`);
    }
  }

  async getFileUrl(key: string) {
    return { url: `https://${this.bucketName}.s3.amazonaws.com/${key}` };
  }

  async getPresignedUrl(key: string) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, {
        expiresIn: 600, // 10 minutes
      });

      return { url };
    } catch (error) {
      throw new Error(`Error getting presigned URL: ${error}`);
    }
  }

  async deleteFile(key: string) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);

      return { message: "File deleted successfully" };
    } catch (error) {
      throw new Error(`Error deleting file: ${error}`);
    }
  }

  async getFileList() {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
    });
    try {
      const result = await this.client.send(command);
      return result.Contents;
    } catch (error) {
      throw new Error(`Error getting file list: ${error}`);
    }
  }
}

// Create a singleton instance
export const storageService = new StorageService();
