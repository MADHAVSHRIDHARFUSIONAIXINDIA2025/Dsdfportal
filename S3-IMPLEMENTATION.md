# S3 File Attachments - Implementation Complete

## What was implemented

✅ **AWS S3 Integration** for ticket file attachments
- Installed `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`
- Created S3 utility functions in `src/lib/s3.ts`
- Upload, delete, and presigned URL generation support

✅ **Upload API** 
- New route: `/api/upload` 
- Validates file types (images, PDFs, docs) and size (10MB max)
- Returns attachment metadata for storage

✅ **Database**
- Updated Ticket model with `attachments` array
- Stores name, URL, size, uploadedBy, uploadedAt

✅ **UI Components**
- New `FileUpload` component with drag-and-drop
- Shows file previews with name, size, uploader
- Remove attachment button
- Progress indication during upload

✅ **Admin & Engineer Forms**
- Added file upload to admin ticket creation/edit
- Added file upload to engineer ticket updates
- Both can view existing attachments

✅ **Documentation**
- Updated `.env.example` with AWS S3 variables
- Added S3 setup instructions to README
- Included graceful degradation when S3 not configured

## Environment Variables Required

Add these to Vercel (and local `.env.local`) to enable file uploads:

```bash
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

## How to Set Up

### 1. Create S3 Bucket
```bash
# In AWS Console or CLI:
aws s3 mb s3://dsdf-fiber-attachments
```

### 2. Create IAM User with S3 Permissions
Attach this policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::dsdf-fiber-attachments/*"
    }
  ]
}
```

### 3. Add Variables to Vercel
```bash
cd web
npx vercel env add AWS_ACCESS_KEY_ID production,preview,development --sensitive
# Paste your key when prompted

npx vercel env add AWS_SECRET_ACCESS_KEY production,preview,development --sensitive
# Paste your secret when prompted

npx vercel env add AWS_REGION production,preview,development
# us-east-1 (or your region)

npx vercel env add AWS_S3_BUCKET production,preview,development
# dsdf-fiber-attachments
```

### 4. Redeploy
The code is committed locally. Push to GitHub to trigger auto-deployment:
```bash
git push origin main
```

Or deploy directly:
```bash
npx vercel --prod
```

## Files Changed

- `package.json` - Added AWS SDK dependencies
- `src/models/Ticket.ts` - Added attachments array
- `src/lib/s3.ts` - S3 utilities (NEW)
- `src/app/api/upload/route.ts` - Upload endpoint (NEW)
- `src/components/ui/FileUpload.tsx` - File upload UI (NEW)
- `src/app/admin/tickets/page.tsx` - Added file upload to form
- `src/app/ext/(app)/tickets/page.tsx` - Added file upload to form
- `src/lib/services/mappers.ts` - Include attachments in ticket mapper
- `.env.example` - Added AWS S3 variables
- `README.md` - Added S3 setup instructions

## Next Steps

1. **Push to GitHub** - Changes are committed, push will trigger Vercel deployment
2. **Add AWS credentials to Vercel** - Use commands above or Vercel dashboard
3. **Test file upload** - Create/edit a ticket and attach files
4. **Set up WhatsApp** - Add `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` for assignment notifications

## Status

- ✅ S3 implementation complete
- ✅ Build successful
- ✅ TypeScript clean
- ✅ Code committed locally
- ⏳ Awaiting push to GitHub
- ⏳ Awaiting AWS credentials in Vercel
