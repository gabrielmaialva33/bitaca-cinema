"""
Cloudflare R2 Storage Integration
S3-compatible storage for video uploads
"""

import os
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

# R2 Configuration
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "abitaca")
R2_PUBLIC_URL = os.getenv("R2_PUBLIC_URL", "https://pub-6a1b49bce72a49679c5c9c8faee0a519.r2.dev")

# Check if R2 is configured
R2_AVAILABLE = all([R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY])

# Global R2 client
_r2_client = None


def get_r2_client():
    """Get or create R2 S3 client"""
    global _r2_client

    if not R2_AVAILABLE:
        raise ValueError("R2 credentials not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY")

    if _r2_client is None:
        endpoint_url = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

        _r2_client = boto3.client(
            's3',
            endpoint_url=endpoint_url,
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            config=Config(signature_version='s3v4'),
            region_name='auto'  # R2 uses 'auto' region
        )

        print(f"✅ R2 client initialized for account {R2_ACCOUNT_ID}")

    return _r2_client


def generate_presigned_upload_url(
    file_extension: str = "webm",
    content_type: str = "video/webm",
    expires_in: int = 3600,
    metadata: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Generate a presigned URL for direct browser upload to R2

    Args:
        file_extension: File extension (default: webm)
        content_type: MIME type (default: video/webm)
        expires_in: URL expiration in seconds (default: 1 hour)
        metadata: Optional metadata to attach to the file

    Returns:
        Dict with upload_url, file_key, and public_url
    """
    try:
        client = get_r2_client()

        # Generate unique filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        file_key = f"depoimentos/{timestamp}_{unique_id}.{file_extension}"

        # Prepare upload parameters
        fields = {
            "Content-Type": content_type,
        }

        # Add custom metadata
        if metadata:
            for key, value in metadata.items():
                fields[f"x-amz-meta-{key}"] = value

        # Generate presigned POST URL
        presigned_post = client.generate_presigned_post(
            Bucket=R2_BUCKET_NAME,
            Key=file_key,
            Fields=fields,
            Conditions=[
                {"Content-Type": content_type},
                ["content-length-range", 1, 10 * 1024 * 1024]  # Max 10MB (free tier friendly)
            ],
            ExpiresIn=expires_in
        )

        # Public URL for accessing the file after upload
        public_url = f"{R2_PUBLIC_URL}/{file_key}"

        print(f"✅ Generated presigned URL for: {file_key}")

        return {
            "upload_url": presigned_post["url"],
            "fields": presigned_post["fields"],
            "file_key": file_key,
            "public_url": public_url,
            "expires_at": (datetime.utcnow() + timedelta(seconds=expires_in)).isoformat()
        }

    except ClientError as e:
        print(f"❌ R2 presigned URL error: {e}")
        raise
    except Exception as e:
        print(f"❌ Unexpected error generating presigned URL: {e}")
        raise


def list_videos(prefix: str = "depoimentos/", max_keys: int = 100) -> list:
    """
    List videos in R2 bucket

    Args:
        prefix: Folder prefix (default: depoimentos/)
        max_keys: Maximum number of results

    Returns:
        List of video objects with metadata
    """
    try:
        client = get_r2_client()

        response = client.list_objects_v2(
            Bucket=R2_BUCKET_NAME,
            Prefix=prefix,
            MaxKeys=max_keys
        )

        if 'Contents' not in response:
            return []

        videos = []
        for obj in response['Contents']:
            videos.append({
                "key": obj['Key'],
                "size": obj['Size'],
                "last_modified": obj['LastModified'].isoformat(),
                "public_url": f"{R2_PUBLIC_URL}/{obj['Key']}"
            })

        print(f"✅ Found {len(videos)} videos in R2")
        return videos

    except ClientError as e:
        print(f"❌ R2 list error: {e}")
        raise


def delete_video(file_key: str) -> bool:
    """
    Delete a video from R2

    Args:
        file_key: Object key in R2

    Returns:
        True if successful
    """
    try:
        client = get_r2_client()

        client.delete_object(
            Bucket=R2_BUCKET_NAME,
            Key=file_key
        )

        print(f"✅ Deleted video: {file_key}")
        return True

    except ClientError as e:
        print(f"❌ R2 delete error: {e}")
        raise


def get_video_metadata(file_key: str) -> Dict[str, Any]:
    """
    Get metadata for a video

    Args:
        file_key: Object key in R2

    Returns:
        Metadata dictionary
    """
    try:
        client = get_r2_client()

        response = client.head_object(
            Bucket=R2_BUCKET_NAME,
            Key=file_key
        )

        metadata = {
            "key": file_key,
            "size": response['ContentLength'],
            "content_type": response['ContentType'],
            "last_modified": response['LastModified'].isoformat(),
            "public_url": f"{R2_PUBLIC_URL}/{file_key}",
            "metadata": response.get('Metadata', {})
        }

        return metadata

    except ClientError as e:
        print(f"❌ R2 metadata error: {e}")
        raise


def test_connection() -> bool:
    """Test R2 connection"""
    try:
        client = get_r2_client()
        client.list_buckets()
        print("✅ R2 connection successful")
        return True
    except Exception as e:
        print(f"❌ R2 connection failed: {e}")
        return False
