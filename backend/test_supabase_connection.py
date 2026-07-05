import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url = os.getenv("SUPABASE_API_URL")
key = os.getenv("SUPABASE_SECRET_KEY")

if not url:
    print("[ERROR] SUPABASE_API_URL not set in .env")
    exit(1)
if not key:
    print("[ERROR] SUPABASE_SECRET_KEY not set in .env")
    exit(1)
if not url.startswith("http"):
    print(f"[ERROR] SUPABASE_API_URL muss mit https:// beginnen — aktuell: {url}")
    exit(1)

try:
    supabase: Client = create_client(url, key)
    data = supabase.table("users").select("count", count="exact").execute()
    print(f"[OK] Supabase verbunden — {data.count} Benutzer in der users-Tabelle")
except Exception as e:
    print(f"[ERROR] Supabase-Fehler: {e}")
