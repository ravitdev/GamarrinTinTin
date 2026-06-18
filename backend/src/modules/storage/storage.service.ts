import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../../config/aws-s3.config';

export type UploadedFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size?: number;
};

export class StorageService {
  private static getBucket(): string {
    const bucket = process.env.AWS_S3_BUCKET;

    if (!bucket) {
      throw new Error('AWS_S3_BUCKET no está configurado.');
    }

    return bucket;
  }

  private static getRegion(): string {
    const region = process.env.AWS_REGION;

    if (!region) {
      throw new Error('AWS_REGION no está configurado.');
    }

    return region;
  }

  static async uploadFile(file: UploadedFile, key: string): Promise<string> {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: this.getBucket(),
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return key;
  }

  static getPublicUrl(key: string): string {
    if (!key) {
      return '';
    }

    if (key.startsWith('http://') || key.startsWith('https://')) {
      return key;
    }

    const bucket = this.getBucket();
    const region = this.getRegion();

    return `https://${bucket}.s3.${region}.amazonaws.com/${encodeURI(key)}`;
  }

  static async getSignedUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.getBucket(),
      Key: key,
    });

    return getS3SignedUrl(s3Client, command, { expiresIn: 60 * 10 });
  }

  static async deleteFile(key: string): Promise<void> {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.getBucket(),
        Key: key,
      }),
    );
  }
}