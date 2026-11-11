"""Fetch a YouTube channel snapshot, store it in MongoDB, reuse while fresh."""

from __future__ import annotations

import logging
import re
from datetime import datetime, timedelta, timezone

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from blueprints.config import YOUTUBE_API_KEY
from db.mongo import get_imports_collection, get_youtube_collection

logger = logging.getLogger(__name__)

MAX_VIDEOS = 15
COMMENTS_PER_VIDEO = 10
TARGET_TOTAL_COMMENTS = 150
CACHE_HOURS = 24
SHORT_MAX_SECONDS = 60
TRENDING_CHANNEL_LIMIT = 8

try:
    import nltk
    from nltk.sentiment import SentimentIntensityAnalyzer
    nltk.download("vader_lexicon", quiet=True)
    _sia = SentimentIntensityAnalyzer()
except Exception:
    _sia = None


def _score_comment_sentiment(text: str) -> tuple[float, str]:
    """Score sentiment using VADER compound score."""
    if not _sia or not text:
        return 0.0, "Neutral"
    try:
        compound = float(_sia.polarity_scores(text)["compound"])
        if compound > 0.05:
            return compound, "Positive"
        elif compound < -0.05:
            return compound, "Negative"
        else:
            return compound, "Neutral"
    except Exception:
        return 0.0, "Neutral"


COUNTRY_ALIASES = {
    "in": "IN",
    "india": "IN",
    "us": "US",
    "usa": "US",
    "united states": "US",
    "uk": "GB",
    "gb": "GB",
    "united kingdom": "GB",
    "fr": "FR",
    "france": "FR",
}


def normalize_country(value: str) -> str:
    raw = (value or "").strip()
    if not raw:
        return ""
    return COUNTRY_ALIASES.get(raw.lower(), raw.upper() if len(raw) <= 3 else raw)


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
    "29": "Nonprofits & Activism",
}

DURATION_RE = re.compile(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?")


class IngestError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def parse_duration_seconds(iso_duration: str | None) -> int:
    if not iso_duration:
        return 0
    match = DURATION_RE.fullmatch(iso_duration)
    if not match:
        return 0
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    return hours * 3600 + minutes * 60 + seconds


def _youtube():
    if not YOUTUBE_API_KEY:
        raise IngestError("YOUTUBE_API_KEY is not configured. Add it to your .env file.", 503)
    return build("youtube", "v3", developerKey=YOUTUBE_API_KEY)


def _is_fresh(document: dict) -> bool:
    imported_at = document.get("imported_at")
    if not imported_at:
        return False
    if isinstance(imported_at, str):
        try:
            imported_at = datetime.fromisoformat(imported_at.replace("Z", "+00:00"))
        except ValueError:
            return False
    if imported_at.tzinfo is None:
        imported_at = imported_at.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) - imported_at < timedelta(hours=CACHE_HOURS)


def find_cached_channel(query: str) -> dict | None:
    collection = get_youtube_collection()
    escaped = re.escape(query.strip())
    name_match = {"$regex": f"^{escaped}$", "$options": "i"}
    return collection.find_one(
        {
            "$or": [
                {"channel_id": query},
                {"channel_name": name_match},
                {"title": name_match},
                {"search_query": name_match},
            ]
        }
    )


def get_or_ingest_channel(query: str, force_refresh: bool = False) -> dict:
    query = (query or "").strip()
    if not query:
        raise IngestError("Channel name is required", 400)

    cached = find_cached_channel(query)
    # Ensure cached channel has distributed comments across multiple videos (at least 3 videos with comments)
    videos_with_comments = [v for v in (cached.get("videos", []) or []) if v.get("top_comments")] if cached else []
    has_valid_distributed_comments = bool(
        cached
        and len(videos_with_comments) >= 3
        and len(cached.get("top_comments", []) or []) >= 25
    )

    if cached and not force_refresh and _is_fresh(cached) and has_valid_distributed_comments:
        logger.info("Using cached YouTube snapshot for %s (%s comments across %s videos)", query, len(cached.get("top_comments", [])), len(videos_with_comments))
        return cached

    document = fetch_and_store_channel(query, previous=cached)
    return document


def fetch_and_store_channel(query: str, previous: dict | None = None) -> dict:
    youtube = _youtube()
    now = datetime.now(timezone.utc)
    imports = get_imports_collection()
    import_record = {
        "source": "youtube",
        "search_query": query,
        "status": "running",
        "created_at": now,
        "counts": {"videos": 0, "shorts": 0, "comments": 0},
    }
    import_id = imports.insert_one(import_record).inserted_id

    try:
        channel = _search_channel(youtube, query)
        channel_id = channel["id"]
        snippet = channel.get("snippet", {})
        statistics = channel.get("statistics", {})
        uploads_playlist = channel["contentDetails"]["relatedPlaylists"]["uploads"]
        official_title = snippet.get("title", query)

        raw_videos = _fetch_upload_videos(youtube, uploads_playlist, MAX_VIDEOS)
        videos = []
        shorts = []

        for item in raw_videos:
            video = _normalize_video(item)
            videos.append(video)
            if video["is_short"]:
                shorts.append(video)

        # Collect top 10-15 comments from EACH video and short across the 10-15 uploaded items
        all_channel_comments = _fetch_channel_top_comments(youtube, videos, per_video_limit=COMMENTS_PER_VIDEO)

        # Also distribute into shorts array
        for s in shorts:
            s_vid = s.get("video_id")
            s["top_comments"] = [c for c in all_channel_comments if c.get("video_id") == s_vid]

        # Compute channel-level sentiment summary across all sampled videos & shorts
        pos_cnt = sum(1 for c in all_channel_comments if c.get("sentiment") == "Positive")
        neg_cnt = sum(1 for c in all_channel_comments if c.get("sentiment") == "Negative")
        neu_cnt = sum(1 for c in all_channel_comments if c.get("sentiment") == "Neutral")
        tot_c = len(all_channel_comments) or 1

        sentiment_summary = {
            "total_comments": len(all_channel_comments),
            "videos_sampled": len(videos),
            "positive_count": pos_cnt,
            "negative_count": neg_cnt,
            "neutral_count": neu_cnt,
            "positive_percentage": round((pos_cnt / tot_c) * 100, 1),
            "negative_percentage": round((neg_cnt / tot_c) * 100, 1),
            "neutral_percentage": round((neu_cnt / tot_c) * 100, 1),
            "dominant_sentiment": "Positive" if pos_cnt >= max(neg_cnt, neu_cnt) else ("Negative" if neg_cnt >= neu_cnt else "Neutral"),
        }

        subscriber_count = int(statistics.get("subscriberCount", 0) or 0)
        view_count = int(statistics.get("viewCount", 0) or 0)
        video_count = int(statistics.get("videoCount", 0) or 0)

        document = {
            "channel_id": channel_id,
            "channel_name": official_title,
            "title": official_title,
            "search_query": query,
            "description": snippet.get("description", ""),
            "country": snippet.get("country", ""),
            "subscribers": subscriber_count,
            "subscriber_count": subscriber_count,
            "total_views": view_count,
            "total_videos": video_count,
            "thumbnail": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
            "videos": videos,
            "shorts": shorts,
            "top_comments": all_channel_comments,
            "total_comments_analyzed": len(all_channel_comments),
            "sentiment_summary": sentiment_summary,
            "imported_at": now,
            "source": "youtube",
            "last_import_id": str(import_id),
        }
        collection = get_youtube_collection()
        if previous and previous.get("_id"):
            if previous.get("channel_id") == channel_id:
                document["_id"] = previous["_id"]
            else:
                try:
                    collection.delete_one({"_id": previous["_id"]})
                except Exception:
                    pass

        collection.replace_one({"channel_id": channel_id}, document, upsert=True)
        stored = collection.find_one({"channel_id": channel_id})

        imports.update_one(
            {"_id": import_id},
            {
                "$set": {
                    "status": "completed",
                    "channel_id": channel_id,
                    "channel_name": official_title,
                    "completed_at": datetime.now(timezone.utc),
                    "counts": {
                        "videos": len(videos),
                        "shorts": len(shorts),
                        "comments": len(all_channel_comments),
                    },
                }
            },
        )
        logger.info(
            "Stored channel %s (%s videos, %s shorts, %s comments)",
            official_title,
            len(videos),
            len(shorts),
            len(all_channel_comments),
        )
        return stored
    except IngestError:
        imports.update_one(
            {"_id": import_id},
            {"$set": {"status": "failed", "completed_at": datetime.now(timezone.utc)}},
        )
        raise
    except HttpError as exc:
        imports.update_one(
            {"_id": import_id},
            {
                "$set": {
                    "status": "failed",
                    "error": str(exc),
                    "completed_at": datetime.now(timezone.utc),
                }
            },
        )
        logger.error("YouTube API error while ingesting %s: %s", query, exc)
        raise IngestError(
            "YouTube API request failed. Check the API key, quota, and channel name.",
            502,
        ) from exc
    except Exception:
        imports.update_one(
            {"_id": import_id},
            {"$set": {"status": "failed", "completed_at": datetime.now(timezone.utc)}},
        )
        raise


def _search_channel(youtube, query: str) -> dict:
    search_response = youtube.search().list(
        q=query,
        type="channel",
        part="snippet",
        maxResults=5,
    ).execute()
    items = search_response.get("items") or []
    if not items:
        raise IngestError(
            f"Channel '{query}' was not found on YouTube. Try the exact channel name.",
            404,
        )
    channel_ids = [it["id"]["channelId"] for it in items if "channelId" in it.get("id", {})]
    channel_response = youtube.channels().list(
        part="snippet,statistics,contentDetails",
        id=",".join(channel_ids),
    ).execute()
    channels = channel_response.get("items") or []
    if not channels:
        raise IngestError(f"Channel '{query}' was not found on YouTube.", 404)

    # Rank channels: exact match first, highest subscriber count first to avoid copycats
    q_norm = query.strip().lower()
    def _rank(ch):
        title = (ch.get("snippet", {}).get("title") or "").strip().lower()
        sub_cnt = int(ch.get("statistics", {}).get("subscriberCount", 0) or 0)
        exact = 1 if title == q_norm else 0
        return (exact, sub_cnt)

    channels.sort(key=_rank, reverse=True)
    return channels[0]


def _fetch_upload_videos(youtube, playlist_id: str, limit: int) -> list[dict]:
    video_ids = []
    next_page_token = None
    while len(video_ids) < limit:
        playlist_response = youtube.playlistItems().list(
            playlistId=playlist_id,
            part="contentDetails",
            maxResults=min(50, limit - len(video_ids)),
            pageToken=next_page_token,
        ).execute()
        for item in playlist_response.get("items", []):
            video_id = item.get("contentDetails", {}).get("videoId")
            if video_id:
                video_ids.append(video_id)
            if len(video_ids) >= limit:
                break
        next_page_token = playlist_response.get("nextPageToken")
        if not next_page_token:
            break

    if not video_ids:
        return []

    videos = []
    for index in range(0, len(video_ids), 50):
        batch = video_ids[index : index + 50]
        video_response = youtube.videos().list(
            part="snippet,statistics,contentDetails",
            id=",".join(batch),
        ).execute()
        videos.extend(video_response.get("items", []))
    return videos


def _normalize_video(item: dict) -> dict:
    snippet = item.get("snippet", {})
    statistics = item.get("statistics", {})
    duration_iso = item.get("contentDetails", {}).get("duration", "")
    duration_seconds = parse_duration_seconds(duration_iso)
    category_id = str(snippet.get("categoryId", "Unknown"))
    views = int(statistics.get("viewCount", 0) or 0)
    likes = int(statistics.get("likeCount", 0) or 0)
    comment_count = int(statistics.get("commentCount", 0) or 0)
    return {
        "video_id": item.get("id"),
        "title": snippet.get("title", ""),
        "description": snippet.get("description", ""),
        "category": CATEGORY_MAPPING.get(category_id, "Unknown"),
        "category_id": category_id,
        "views": views,
        "likes": likes,
        "comments": comment_count,
        "comments_count": comment_count,
        "duration": duration_seconds,
        "duration_iso": duration_iso,
        "tags": snippet.get("tags", []),
        "published_at": snippet.get("publishedAt", ""),
        "top_comments": [],
        "is_short": duration_seconds > 0 and duration_seconds <= SHORT_MAX_SECONDS,
    }


def _fetch_channel_top_comments(youtube, videos: list[dict], per_video_limit: int = 10) -> list[dict]:
    """Fetch top 10-15 comments for EACH video and short across the top 10-15 uploaded items."""
    all_comments = []
    seen_texts = set()

    for video in videos:
        vid = video.get("video_id")
        vtitle = video.get("title", "")
        if not vid:
            continue

        video_comments = []
        try:
            response = youtube.commentThreads().list(
                part="snippet",
                videoId=vid,
                maxResults=per_video_limit,
                order="relevance",
                textFormat="plainText",
            ).execute()

            for item in response.get("items", []):
                snippet = item["snippet"]["topLevelComment"]["snippet"]
                raw_text = (snippet.get("textDisplay") or "").strip()
                if not raw_text or raw_text in seen_texts:
                    continue
                seen_texts.add(raw_text)

                vader_score, sentiment_label = _score_comment_sentiment(raw_text)
                comment_obj = {
                    "comment": raw_text,
                    "author": snippet.get("authorDisplayName", "Anonymous"),
                    "author_channel_url": snippet.get("authorChannelUrl", ""),
                    "likes": int(snippet.get("likeCount", 0) or 0),
                    "published_at": snippet.get("publishedAt", ""),
                    "video_id": vid,
                    "video_title": vtitle,
                    "sentiment": sentiment_label,
                    "vader_compound": round(vader_score, 3),
                }
                video_comments.append(comment_obj)
                all_comments.append(comment_obj)

        except HttpError as exc:
            logger.warning("Could not fetch comments for video %s: %s", vid, exc)
        except Exception as e:
            logger.warning("Error fetching comments for video %s: %s", vid, e)

        # Assign per-video comments directly
        video["top_comments"] = video_comments
        video["comments_count"] = max(video.get("comments_count", 0), len(video_comments))

    return all_comments


def _fetch_comments(youtube, video_id: str, limit: int) -> list[dict]:
    comments = []
    next_page_token = None
    try:
        while len(comments) < limit:
            response = youtube.commentThreads().list(
                part="snippet",
                videoId=video_id,
                maxResults=min(100, limit - len(comments)),
                pageToken=next_page_token,
                order="relevance",
                textFormat="plainText",
            ).execute()
            for item in response.get("items", []):
                snippet = item["snippet"]["topLevelComment"]["snippet"]
                txt = snippet.get("textDisplay", "")
                score, sent = _score_comment_sentiment(txt)
                comments.append(
                    {
                        "comment": txt,
                        "author": snippet.get("authorDisplayName", "Anonymous"),
                        "published_at": snippet.get("publishedAt", ""),
                        "likes": int(snippet.get("likeCount", 0) or 0),
                        "sentiment": sent,
                        "vader_compound": round(score, 3)
                    }
                )
                if len(comments) >= limit:
                    break
            next_page_token = response.get("nextPageToken")
            if not next_page_token:
                break
    except HttpError as exc:
        logger.warning("Could not fetch comments for %s: %s", video_id, exc)
        return comments
    return comments


def ingest_trending_creators(region_code: str, limit: int = TRENDING_CHANNEL_LIMIT) -> list[dict]:
    """Store light channel profiles from a region's trending videos."""
    region = normalize_country(region_code) or "IN"
    youtube = _youtube()
    response = youtube.videos().list(
        part="snippet",
        chart="mostPopular",
        regionCode=region,
        maxResults=50,
    ).execute()

    channel_ids = []
    seen = set()
    for item in response.get("items", []):
        channel_id = item.get("snippet", {}).get("channelId")
        if channel_id and channel_id not in seen:
            seen.add(channel_id)
            channel_ids.append(channel_id)
        if len(channel_ids) >= limit:
            break

    if not channel_ids:
        return []

    channels_response = youtube.channels().list(
        part="snippet,statistics",
        id=",".join(channel_ids),
    ).execute()

    collection = get_youtube_collection()
    stored = []
    now = datetime.now(timezone.utc)
    for item in channels_response.get("items", []):
        snippet = item.get("snippet", {})
        statistics = item.get("statistics", {})
        subscriber_count = int(statistics.get("subscriberCount", 0) or 0)
        view_count = int(statistics.get("viewCount", 0) or 0)
        video_count = int(statistics.get("videoCount", 0) or 0)
        title = snippet.get("title", "")
        document = {
            "channel_id": item.get("id"),
            "channel_name": title,
            "title": title,
            "search_query": title,
            "description": snippet.get("description", ""),
            "country": snippet.get("country") or region,
            "subscribers": subscriber_count,
            "subscriber_count": subscriber_count,
            "total_views": view_count,
            "total_videos": video_count,
            "thumbnail": snippet.get("thumbnails", {}).get("high", {}).get("url", ""),
            "videos": [],
            "shorts": [],
            "imported_at": now,
            "source": "youtube_trending",
        }
        collection.update_one(
            {"channel_id": document["channel_id"]},
            {"$set": document},
            upsert=True,
        )
        stored.append(collection.find_one({"channel_id": document["channel_id"]}))
    logger.info("Stored %s trending creators for region %s", len(stored), region)
    return stored
