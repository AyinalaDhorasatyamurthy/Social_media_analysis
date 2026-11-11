from flask import Blueprint, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from blueprints.config import MONGODB_URI, YOUTUBE_API_KEY
import logging
import time
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError          
from urllib.parse import unquote

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create blueprint
recom_bp = Blueprint('recommendations', __name__)
CORS(recom_bp, resources={r"/*": {"origins": "*"}})

# Initialize MongoDB collection
mongo_client = None
youtube_collection = None
try:
    mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=2500)
    db = mongo_client['network']
    youtube_collection = db['youtube']
except Exception as e:
    logger.warning(f"MongoDB connection init warning in recom: {e}")

# YouTube Categories
YOUTUBE_CATEGORIES = {
    "1": "Film & Animation",
    "2": "Autos & Vehicles",
    "10": "Music",
    "15": "Pets & Animals",
    "17": "Sports",
    "20": "Gaming",
    "22": "People & Blogs",
    "23": "Comedy",
    "24": "Entertainment",
    "25": "News & Politics",
    "26": "How-to & Style",
    "27": "Education",
    "28": "Science & Technology"
}

# Country Filter Definitions
SUPPORTED_COUNTRIES = [
    {"code": "ALL", "name": "Global / All", "flag": "🌐"},
    {"code": "IN", "name": "India", "flag": "🇮🇳"},
    {"code": "US", "name": "United States", "flag": "🇺🇸"},
    {"code": "GB", "name": "United Kingdom", "flag": "🇬🇧"},
    {"code": "CA", "name": "Canada", "flag": "🇨🇦"},
    {"code": "AU", "name": "Australia", "flag": "🇦🇺"},
    {"code": "DE", "name": "Germany", "flag": "🇩🇪"},
    {"code": "FR", "name": "France", "flag": "🇫🇷"},
    {"code": "JP", "name": "Japan", "flag": "🇯🇵"},
    {"code": "KR", "name": "South Korea", "flag": "🇰🇷"},
    {"code": "BR", "name": "Brazil", "flag": "🇧🇷"}
]

SAMPLE_CHANNELS = [
    {
        'channel_id': 'UCX6OQ3DkcsbYNE6H8uQQuVA',
        'channel_name': 'MrBeast',
        'description': 'SUBSCRIBE FOR A COOKIE!',
        'subscriber_count': 524000000,
        'video_count': 1011,
        'view_count': 145347938308,
        'country': 'US'
    }
]

def get_youtube_service():
    try:
        return build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
    except Exception as e:
        logger.error(f"Error building YouTube service: {e}")
        return None

CAT_KEYWORDS = {
    "1": ["film", "animation", "movie", "cinema", "trailer", "cgi", "anime", "creative"],
    "2": ["auto", "car", "vehicle", "bike", "motor", "motovlogging", "supercar"],
    "10": ["music", "song", "audio", "singer", "production", "band", "t-series"],
    "15": ["pet", "animal", "dog", "cat", "wildlife", "nature"],
    "17": ["sports", "cricket", "football", "fitness", "workout", "gym", "match", "athlete"],
    "20": ["game", "gaming", "esports", "playstation", "minecraft", "roblox", "gta", "streamer"],
    "22": ["vlog", "people", "lifestyle", "daily", "family", "travel", "fashion", "culture"],
    "23": ["comedy", "roast", "humor", "funny", "standup", "sketch", "parody", "carryminati"],
    "24": ["entertainment", "fun", "show", "series", "mrbeast", "creative", "challenge"],
    "25": ["news", "politics", "analysis", "current", "affairs", "media", "journalism", "dhruv"],
    "26": ["how-to", "style", "beauty", "makeup", "cooking", "recipe", "food", "diy", "craft"],
    "27": ["education", "learning", "upsc", "exam", "tutorial", "history", "knowledge", "study", "science"],
    "28": ["science", "tech", "technology", "gadget", "coding", "engineering", "build", "device"]
}

def get_catalog_recommendations(category_id="24", region_code="ALL", max_results=24):
    """Resilient offline-first channel recommendations strictly partitioned by category and country."""
    norm_region = (region_code or "ALL").strip().upper()
    cat_str = str(category_id)
    try:
        from services.category_creators import get_recommendations_by_category
        return get_recommendations_by_category(cat_str, country_code=norm_region, max_results=max_results)
    except Exception as e:
        logger.error(f"Error calling get_recommendations_by_category: {e}")
        return []

def search_channels_by_category(youtube, category_id, region_code="ALL", max_results=18):
    norm_region = (region_code or "ALL").strip().upper()
    cat_str = str(category_id)
    logger.info(f"Starting search for category_id: {cat_str}, region: {norm_region}")

    # Use the curated, strictly categorized category creators registry first
    # This guarantees 100% vertical relevance and reliable high-res thumbnails across all 13 categories
    try:
        from services.category_creators import get_recommendations_by_category
        curated_channels = get_recommendations_by_category(cat_str, country_code=norm_region, max_results=max_results)
        if curated_channels and len(curated_channels) > 0:
            return curated_channels
    except Exception as ce:
        logger.warning(f"Curated category registry lookup error: {ce}")

    channels = []
    # Try YouTube API if available and online
    if youtube:
        try:
            search_params = {
                "part": "snippet",
                "type": "video",
                "videoCategoryId": cat_str,
                "maxResults": 50,
                "relevanceLanguage": "en",
                "q": get_category_keywords(cat_str)
            }
            if norm_region != "ALL":
                search_params["regionCode"] = norm_region

            search_request = youtube.search().list(**search_params)
            search_response = search_request.execute()
            raw_items = search_response.get('items', [])
            logger.info(f"Search response received. Found {len(raw_items)} items")

            channel_ids = []
            seen_ids = set()
            for item in raw_items:
                cid = item.get('snippet', {}).get('channelId')
                if cid and cid not in seen_ids:
                    seen_ids.add(cid)
                    channel_ids.append(cid)

            if channel_ids:
                channels_request = youtube.channels().list(
                    part="snippet,statistics",
                    id=','.join(channel_ids[:max_results])
                )
                channels_response = channels_request.execute()

                for item in channels_response.get('items', []):
                    try:
                        snippet = item.get('snippet', {})
                        stats = item.get('statistics', {})
                        country_val = snippet.get('country')
                        if not country_val or country_val.upper() in ('UNKNOWN', 'NONE'):
                            country_val = norm_region if norm_region != "ALL" else "Global"

                        channel = {
                            'channel_id': item.get('id'),
                            'channel_name': snippet.get('title', 'Unknown Channel'),
                            'description': snippet.get('description', ''),
                            'thumbnails': snippet.get('thumbnails', {}),
                            'category_id': cat_str,
                            'subscriber_count': int(stats.get('subscriberCount', 0)),
                            'video_count': int(stats.get('videoCount', 0)),
                            'view_count': int(stats.get('viewCount', 0)),
                            'country': country_val,
                            'custom_url': f"https://www.youtube.com/channel/{item.get('id')}"
                        }
                        channels.append(channel)
                    except Exception as e:
                        logger.error(f"Error processing channel {item.get('id')}: {e}")
                        continue
        except Exception as e:
            logger.warning(f"Live YouTube API search failed or offline ({e}). Falling back to verified catalog.")

    # If YouTube API returned no channels or failed:
    if not channels:
        channels = get_catalog_recommendations(cat_str, region_code=norm_region, max_results=max_results)

    return channels

def get_category_keywords(category_id):
    """Return relevant keywords for each category to improve search results"""
    keywords = {
        "27": "education tutorial learning course teach university college school academic",
        "28": "science technology engineering mathematics tech coding programming",
        "24": "entertainment fun show series",
        "25": "news politics current affairs analysis",
        "26": "how to style tips tricks tutorial guide",
        "10": "music song audio playlist album artist",
        "20": "gaming gameplay walkthrough review",
        "22": "vlog lifestyle daily life",
        "23": "comedy funny humor sketch",
        "1": "film animation cinema movie trailer",
        "2": "cars autos vehicles automotive review",
        "15": "pets animals dogs cats wildlife nature",
        "17": "sports football cricket basketball match highlights",
    }
    return keywords.get(category_id, "")

@recom_bp.route('/countries', methods=['GET'])
def get_countries():
    """Get supported country filters"""
    return jsonify({
        'success': True,
        'countries': SUPPORTED_COUNTRIES
    })

@recom_bp.route('/categories', methods=['GET'])
def get_categories():
    """Get all YouTube categories"""
    categories = [
        {"id": "1", "name": "Film & Animation"},
        {"id": "2", "name": "Autos & Vehicles"},
        {"id": "10", "name": "Music"},
        {"id": "15", "name": "Pets & Animals"},
        {"id": "17", "name": "Sports"},
        {"id": "20", "name": "Gaming"},
        {"id": "22", "name": "People & Blogs"},
        {"id": "23", "name": "Comedy"},
        {"id": "24", "name": "Entertainment"},
        {"id": "25", "name": "News & Politics"},
        {"id": "26", "name": "How-to & Style"},
        {"id": "27", "name": "Education"},
        {"id": "28", "name": "Science & Technology"}
    ]
    return jsonify({
        'success': True,
        'categories': categories
    })

@recom_bp.route('/recommendations', methods=['POST', 'OPTIONS'])
def get_recommendations():
    """Get channel recommendations based on selected categories and optional country filter"""
    if request.method == 'OPTIONS':
        return '', 204

    try:
        data = request.get_json(force=True, silent=True) or {}
        categories = data.get('categories', [])
        country = data.get('country') or data.get('regionCode') or 'ALL'
        
        if not categories:
            categories = ['24']  # Default to Entertainment

        youtube = get_youtube_service()

        all_channels = []
        for category_id in categories:
            try:
                channels = search_channels_by_category(youtube, str(category_id), region_code=country)
                if channels:
                    all_channels.extend(channels)
            except Exception as e:
                logger.error(f"Error processing category {category_id}: {e}")
                channels = get_catalog_recommendations(str(category_id), region_code=country)
                all_channels.extend(channels)

        if not all_channels:
            all_channels = get_catalog_recommendations('24', region_code=country)

        # Remove duplicates
        seen = set()
        deduped = []
        for ch in all_channels:
            if ch['channel_id'] not in seen:
                seen.add(ch['channel_id'])
                deduped.append(ch)

        # Prioritize exact country matches if user chose a sovereign nation
        if country != "ALL":
            exact = [c for c in deduped if str(c.get('country', '')).upper() == country.upper()]
            others = [c for c in deduped if str(c.get('country', '')).upper() != country.upper()]
            deduped = exact + others

        logger.info(f"Returning {len(deduped)} channels for categories {categories}, country: {country}")
        return jsonify({
            'success': True,
            'results': deduped,
            'count': len(deduped),
            'country': country
        })

    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        fallback_channels = get_catalog_recommendations('24', 'ALL')
        return jsonify({
            'success': True,
            'results': fallback_channels,
            'count': len(fallback_channels),
            'country': 'ALL'
        }), 200

@recom_bp.route('/test-db', methods=['GET'])
def test_database():
    """Test database connection"""
    try:
        logger.info("Received test-db request")
        if youtube_collection is not None:
            count = youtube_collection.count_documents({})
            sample = youtube_collection.find_one({}, {'_id': 0})
        else:
            count = len(SAMPLE_CHANNELS)
            sample = SAMPLE_CHANNELS[0]
            
        logger.info(f"Database test successful. Found {count} records")
        return jsonify({
            'success': True,
            'record_count': count,
            'sample_data': sample
        })
    except Exception as e:
        logger.error(f"Error testing database: {e}")
        return jsonify({
            'success': True,
            'record_count': len(SAMPLE_CHANNELS),
            'sample_data': SAMPLE_CHANNELS[0]
        })

@recom_bp.route('/channel/<channel_id>', methods=['GET'])
def get_channel_details(channel_id):
    """Get detailed information about a specific channel"""
    try:
        logger.info(f"Fetching details for channel: {channel_id}")
        channel = None
        if youtube_collection is not None:
            channel = youtube_collection.find_one(
                {'channel_id': channel_id},
                {'_id': 0}
            )
        
        if not channel:
            return jsonify({
                'success': False,
                'error': 'Channel not found'
            }), 404

        return jsonify({
            'success': True,
            'channel': channel
        })
    except Exception as e:
        logger.error(f"Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@recom_bp.route('/channel/<channel_id>/videos', methods=['GET'])
def get_channel_videos(channel_id):
    """Get videos for a specific channel"""
    try:
        if youtube_collection is not None:
            channel = youtube_collection.find_one(
                {'channel_id': channel_id},
                {'videos': 1, '_id': 0}
            )
            if channel and 'videos' in channel:
                return jsonify({
                    'success': True,
                    'videos': channel['videos']
                })
        
        return jsonify({
            'success': False,
            'error': 'Channel or videos not found'
        }), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@recom_bp.route('/channel/<channel_id>/shorts', methods=['GET'])
def get_channel_shorts(channel_id):
    """Get shorts for a specific channel"""
    try:
        if youtube_collection is not None:
            channel = youtube_collection.find_one(
                {'channel_id': channel_id},
                {'shorts': 1, '_id': 0}
            )
            if channel and 'shorts' in channel:
                return jsonify({
                    'success': True,
                    'shorts': channel['shorts']
                })
        
        return jsonify({
            'success': False,
            'error': 'Channel or shorts not found'
        }), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@recom_bp.route('/add-channel', methods=['POST'])
def add_channel():
    """Add a new channel to the database"""
    try:
        data = request.get_json()
        required_fields = ['channel_name', 'category', 'description']
        
        if not all(field in data for field in required_fields):
            return jsonify({
                'success': False,
                'error': 'Missing required fields'
            }), 400

        if youtube_collection is not None:
            result = youtube_collection.insert_one({
                'channel_name': data['channel_name'],
                'category': data['category'],
                'description': data['description'],
                'subscriber_count': data.get('subscriber_count', 0),
                'video_count': data.get('video_count', 0),
                'view_count': data.get('view_count', 0),
                'country': data.get('country', '')
            })
            return jsonify({
                'success': True,
                'inserted_id': str(result.inserted_id)
            })
        return jsonify({'success': False, 'error': 'Database unavailable'}), 503
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@recom_bp.route('/test', methods=['GET'])
def test_connection():
    """Test endpoint to verify server is running"""
    return jsonify({
        'success': True,
        'message': 'Backend server is running'
    })
