from flask import Blueprint, request, jsonify, send_file
from flask_cors import CORS
import pymongo
import re
from collections import Counter, defaultdict
import nltk
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import MinMaxScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from blueprints.config import MONGODB_URI, MONGODB_DB
from services.channel_ingest import IngestError, get_or_ingest_channel
from services.serialize import json_safe


network_bp = Blueprint('network_bp', __name__)

# Download NLTK stopwords
try:
    nltk.download("stopwords", quiet=True)
except Exception:
    pass

from db.mongo import get_youtube_collection

collection = get_youtube_collection()

# Stopwords
STOPWORDS = set(nltk.corpus.stopwords.words("english"))
DOMAIN_STOPWORDS = {
    'http', 'https', 'www', 'com', 'video', 'videos', 'channel', 
    'subscribe', 'youtube', 'link', 'below', 'watch', 'official', 
    'follow', 'check', 'twitter', 'facebook', 'instagram', 'discord', 
    'tiktok', 'store', 'merch', 'thanks', 'contact', 'email', 'copyright',
    'disclaimer', 'music', 'description', 'join', 'shorts', 'short'
}

# 🔹 Category ID → Name Mapping
CATEGORY_MAPPING = {
    "1": "Film & Animation",
    "2": "Autos & Vehicles",
    "10": "Music",
    "15": "Pets & Animals",
    "17": "Sports",
    "18": "Short Movies",
    "19": "Travel & Events",
    "20": "Gaming",
    "21": "Videoblogging",
    "22": "People & Blogs",
    "23": "Comedy",
    "24": "Entertainment",
    "25": "News & Politics",
    "26": "Howto & Style",
    "27": "Education",
    "28": "Science & Technology",
    "29": "Nonprofits & Activism"
}

# 📌 Function to Extract Keywords
def extract_keywords(text):
    words = re.findall(r'\b[a-zA-Z]{3,}\b', (text or "").lower())
    words = [word for word in words if word not in STOPWORDS and word not in DOMAIN_STOPWORDS]
    return words

# 📌 Function to Analyze Hashtags & Semantic Lexicon via TF-IDF
def analyze_keywords(videos):
    """
    Computes genuine TF-IDF semantic lexicon scores for titles and descriptions,
    filtering out URL fragments, web protocols, and domain stop words.
    """
    if not videos:
        return []

    corpus = []
    for video in videos:
        title = video.get("title") or ""
        desc = video.get("description") or ""
        # Remove URLs and links
        cleaned_text = re.sub(r'https?://\S+|www\.\S+', ' ', f"{title} {desc}")
        # Retain alphabetic tokens
        cleaned_text = re.sub(r'[^a-zA-Z\s]', ' ', cleaned_text).lower()
        words = [w for w in cleaned_text.split() if w not in STOPWORDS and w not in DOMAIN_STOPWORDS and len(w) > 2]
        if words:
            corpus.append(" ".join(words))

    if not corpus or not any(len(c.strip()) > 0 for c in corpus):
        # Fallback to title words if corpus is sparse
        counter = Counter()
        for v in videos:
            words = extract_keywords(v.get("title", ""))
            counter.update(words)
        return [
            {
                "keyword": w.title(),
                "frequency": float(c),
                "count": float(c),
                "weight": float(c)
            }
            for w, c in counter.most_common(15)
        ]

    try:
        vec = TfidfVectorizer(max_features=15, stop_words="english", ngram_range=(1, 1))
        tfidf_matrix = vec.fit_transform(corpus)
        scores = tfidf_matrix.sum(axis=0).A1
        words = vec.get_feature_names_out()
        ranked = sorted(zip(words, scores), key=lambda x: x[1], reverse=True)
        return [
            {
                "keyword": word.title(),
                "frequency": round(float(score), 2),
                "count": round(float(score), 2),
                "weight": round(float(score), 2)
            }
            for word, score in ranked[:15]
        ]
    except Exception:
        counter = Counter()
        for c in corpus:
            counter.update(c.split())
        return [
            {
                "keyword": w.title(),
                "frequency": float(cnt),
                "count": float(cnt),
                "weight": float(cnt)
            }
            for w, cnt in counter.most_common(15)
        ]

# 📌 K-Means Clustering for Video Performance
def cluster_videos(videos):
    if not videos:
        return []

    # Extract numerical features
    data = []
    for video in videos:
        views = video.get("views", 0)
        likes = video.get("likes", 0)
        comments = video.get("comments", 0)
        data.append([views, likes, comments])

    # Convert to numpy array
    data = np.array(data)

    # Normalize data
    scaler = MinMaxScaler()
    scaled_data = scaler.fit_transform(data)

    n_clusters = min(3, len(videos))
    if n_clusters < 2:
        for video in videos:
            video["cluster"] = "Insufficient data"
        return videos

    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(scaled_data)

    # Assign cluster labels
    for i, video in enumerate(videos):
        cluster_label = clusters[i]
        if cluster_label == 0:
            video["cluster"] = "Low Engagement" 
        elif cluster_label == 1:
            video["cluster"] = "Medium Engagement"
        else:
            video["cluster"] = "High Engagement"

    return videos

# 📌 Function: Categorize Videos by Duration
def categorize_duration(duration):
    if duration < 180:
        return "Short (<3 min)"
    elif duration < 600:
        return "Medium (3-10 min)"
    else:
        return "Long (>10 min)"

# 📌 Function: Analyze Content Type
def analyze_content_type(videos):
    duration_engagement = defaultdict(lambda: {"likes": 0, "views": 0, "count": 0})
    category_count = defaultdict(int)

    for video in videos:
        duration_category = categorize_duration(video.get("duration", 0))
        category_id = str(video.get("category_id", "Unknown"))  # Convert to string

        # Engagement Metrics
        views = video.get("views", 0)
        likes = video.get("likes", 0)

        # Update Duration Analysis
        duration_engagement[duration_category]["likes"] += likes
        duration_engagement[duration_category]["views"] += views
        duration_engagement[duration_category]["count"] += 1

        # Count Category Occurrences
        category_count[category_id] += 1

    # Convert to JSON-friendly format
    duration_analysis = [
        {
            "duration": key,
            "avg_likes": value["likes"] / max(value["count"], 1),
            "avg_views": value["views"] / max(value["count"], 1)
        }
        for key, value in duration_engagement.items()
    ]

    # Find Most Common Category ID
    most_common_category_id = max(category_count, key=category_count.get, default="Unknown")
    most_common_category_name = CATEGORY_MAPPING.get(most_common_category_id, "Unknown")

    interpretation = f"The channel mainly focuses on **{most_common_category_name}**."

    return {
        "duration_analysis": duration_analysis,
        "category_analysis": {CATEGORY_MAPPING.get(k, "Unknown"): v for k, v in category_count.items()},  # Map IDs to names
        "interpretation": interpretation
    }

@network_bp.route("/fetch", methods=["POST"])
def fetch_data():
    data = request.json or {}
    channel_name = data.get("channel_name")
    force_refresh = bool(data.get("refresh"))
    if not channel_name:
        return jsonify({"error": "Channel name is required"}), 400

    try:
        channel_data = get_or_ingest_channel(channel_name, force_refresh=force_refresh)
    except IngestError as exc:
        return jsonify({"error": exc.message}), exc.status_code

    videos = channel_data.get("videos", [])
    keyword_analysis = analyze_keywords(videos)
    clustered_videos = cluster_videos(videos)
    slim_videos = [
        {
            "title": video.get("title"),
            "views": video.get("views", 0),
            "likes": video.get("likes", 0),
            "comments": video.get("comments", 0),
            "cluster": video.get("cluster"),
            "category": video.get("category"),
            "duration": video.get("duration", 0),
        }
        for video in clustered_videos
    ]
    return jsonify(json_safe({
        "subscribers": channel_data.get("subscribers", 0),
        "views": channel_data.get("total_views", 0),
        "total_videos": channel_data.get("total_videos", 0),
        "keyword_analysis": keyword_analysis,
        "videos": slim_videos,
        "channel": channel_data.get("channel_name"),
    }))

# 📌 API: Fetch Content Type Analysis
@network_bp.route("/content_analysis", methods=["POST"])
def fetch_content_analysis():
    data = request.json or {}
    channel_name = data.get("channel_name")
    force_refresh = bool(data.get("refresh"))
    if not channel_name:
        return jsonify({"error": "Channel name is required"}), 400

    try:
        channel_data = get_or_ingest_channel(channel_name, force_refresh=force_refresh)
    except IngestError as exc:
        return jsonify({"error": exc.message}), exc.status_code

    videos = channel_data.get("videos", [])
    content_analysis = analyze_content_type(videos)
    return jsonify(json_safe(content_analysis))

