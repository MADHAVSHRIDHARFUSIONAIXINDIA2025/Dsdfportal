import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getS3Config() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const region = process.env.AWS_REGION || "us-east-1";
  const bucket = process.env.AWS_S3_BUCKET;

  if (!accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("AWS S3 credentials not configured. Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET");
  }

  return { accessKeyId, secretAccessKey, region, bucket };
}

function createS3Client() {
  const config = getS3Config();
  return new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
}

export function isS3Configured() {
  try {
    getS3Config();
    return true;
  } catch {
    return false;
  }
}

export async function uploadToS3(file: File, folder: string = "tickets") {
  const config = getS3Config();
  const client = createS3Client();

  // Generate unique filename
  const timestamp = Date.now();
  const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `${folder}/${timestamp}-${sanitized}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: buffer,
    ContentType: file.type,
    ContentLength: file.size,
  });

  await client.send(command);

  // Return public URL (adjust if your bucket is private)
  const url = `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
  return { url, key };
}

export async function deleteFromS3(key: string) {
  const config = getS3Config();
  const client = createS3Client();

  const command = new DeleteObjectCommand({
    Bucket: config.bucket,
    Key: key,
  });

  await client.send(command);
  return true;
}

export async function getPresignedDownloadUrl(key: string, expiresIn: number = 3600) {
  const config = getS3Config();
  const client = createS3Client();

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

export function extractS3KeyFromUrl(url: string): string | null {
  try {
    const match = url.match(/\.amazonaws\.com\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
