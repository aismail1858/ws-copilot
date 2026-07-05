import os
import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

load_dotenv()

s3 = boto3.client(
    "s3",
    region_name=os.getenv("AWS_REGION"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)

bucket = os.getenv("S3_BUCKET_NAME")

try:
    s3.head_bucket(Bucket=bucket)
    print(f"[OK] Zugriff auf Bucket '{bucket}' erfolgreich")
except ClientError as e:
    code = e.response["Error"]["Code"]
    if code == "404":
        print(f"[ERROR] Bucket '{bucket}' existiert nicht")
    elif code == "403":
        print(f"[ERROR] Keine Berechtigung für Bucket '{bucket}'")
    else:
        print(f"[ERROR] Fehler: {e}")
