import os
from pathlib import Path
from dotenv import load_dotenv

# Search for .env in Social_media_analysis dir, cwd, or parent dir
base_dir = Path(__file__).resolve().parent.parent
env_paths = [
    base_dir / ".env",
    Path.cwd() / ".env",
    base_dir.parent / ".env"
]
for p in env_paths:
    if p.exists():
        load_dotenv(p)
        break
else:
    load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
MONGODB_DB = os.getenv("MONGODB_DB", "network")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "")
MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
MAIL_PORT = int(os.getenv("MAIL_PORT", 587))
MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "True").lower() in ("true", "1", "t")
MAIL_USE_SSL = os.getenv("MAIL_USE_SSL", "False").lower() in ("true", "1", "t")
FROM_EMAIL = os.getenv("FROM_EMAIL", "dhorasatyamurthyayinala@gmail.com")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD", "")
