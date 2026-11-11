from flask import Blueprint, jsonify, request
from flask_cors import CORS
from googleapiclient.discovery import build
import blueprints.config as config
from wordcloud import WordCloud
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import io
import base64
import logging
import time
from services.regional_trending import get_curated_trending

logger = logging.getLogger(__name__)

dash_bp = Blueprint('dashboard', __name__)
CORS(dash_bp)

# In-memory cache for trending videos: { region_code: { 'timestamp': float, 'videos': list } }
CACHE = {}
CACHE_TTL = 600  # 10 minutes

@dash_bp.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

def get_youtube_client():
    api_key = config.YOUTUBE_API_KEY
    if not api_key:
        logger.error("YOUTUBE_API_KEY is not configured")
        return None
    try:
        return build("youtube", "v3", developerKey=api_key, cache_discovery=False)
    except Exception as e:
        logger.error(f"Failed to build YouTube client: {e}")
        return None

def fetch_trending_videos(region_code="IN"):
    """Fetch real-time trending videos with caching, live YouTube API, and curated resilience fallback"""
    now = time.time()
    region_code = (region_code or "IN").strip().upper()
    
    # 1. Check in-memory cache
    if region_code in CACHE:
        cached = CACHE[region_code]
        if (now - cached['timestamp']) < CACHE_TTL and len(cached['videos']) > 0:
            logger.info(f"Serving {len(cached['videos'])} trending videos from cache for {region_code}")
            return cached['videos']
            
    client = get_youtube_client()
    if client:
        try:
            req = client.videos().list(
                part="snippet,statistics",
                chart="mostPopular",
                regionCode=region_code,
                maxResults=50
            )
            response = req.execute()
            items = response.get('items', [])
            
            trending_videos = []
            for item in items:
                try:
                    snippet = item.get('snippet', {})
                    statistics = item.get('statistics', {})
                    
                    video_data = {
                        "video_id": item.get('id', ''),
                        "title": snippet.get('title', ''),
                        "views": int(statistics.get('viewCount', 0)),
                        "likes": statistics.get('likeCount', 'N/A'),
                        "published_at": snippet.get('publishedAt', ''),
                        "channel_title": snippet.get('channelTitle', ''),
                        "thumbnail": snippet.get('thumbnails', {}).get('high', {}).get('url', '') or snippet.get('thumbnails', {}).get('medium', {}).get('url', '')
                    }
                    trending_videos.append(video_data)
                except Exception:
                    continue
                    
            trending_videos.sort(key=lambda x: x['views'], reverse=True)
            
            if trending_videos:
                CACHE[region_code] = {
                    'timestamp': now,
                    'videos': trending_videos
                }
                logger.info(f"Fetched and cached {len(trending_videos)} trending videos for {region_code}")
                return trending_videos
        except Exception as e:
            logger.warning(f"Live YouTube API trending fetch failed for {region_code}: {e}. Triggering curated fallback.")

    # 2. Resilient Curated Regional Fallback (guarantees feed never shows 0 videos)
    curated = get_curated_trending(region_code)
    if curated:
        CACHE[region_code] = {
            'timestamp': now,
            'videos': curated
        }
        return curated

    # 3. Stale cache fallback if any
    if region_code in CACHE and CACHE[region_code].get('videos'):
        return CACHE[region_code]['videos']

    return []

@dash_bp.route('/get_trending_data')
def get_data():
    try:
        region = request.args.get('region', 'IN').strip().upper()
        videos = fetch_trending_videos(region)
        
        if not videos:
            # Check if we have any other region cached as fallback
            for fallback_reg, val in CACHE.items():
                if val.get('videos'):
                    return jsonify({
                        'videos': val['videos'],
                        'region': fallback_reg,
                        'is_fallback': True
                    })
            return jsonify({
                "error": "No trending videos found",
                "details": "YouTube API returned no items for this region.",
                "region": region
            }), 404
            
        return jsonify({
            'videos': videos,
            'region': region
        })
        
    except Exception as e:
        logger.error(f"Error in get_data: {e}")
        return jsonify({
            "error": "Server error",
            "details": str(e),
            "region": request.args.get('region', 'IN')
        }), 500

@dash_bp.route('/wordcloud')
def get_wordcloud():
    try:
        region = request.args.get('region', 'IN').strip().upper()
        videos = fetch_trending_videos(region)
        
        if not videos:
            return jsonify({"error": "No trending videos available for wordcloud"}), 404
            
        titles_text = " ".join(video.get('title', '') for video in videos if video.get('title'))
        if not titles_text.strip():
            titles_text = "Trending YouTube Content Creators Viral Video Insights"
            
        # YouTube Dark aesthetic wordcloud: #121212 background with vibrant YouTube accents
        wordcloud = WordCloud(
            width=900,
            height=420,
            background_color='#121212',
            colormap='autumn',
            min_font_size=10,
            max_font_size=90,
            collocations=False
        ).generate(titles_text)
        
        fig, ax = plt.subplots(figsize=(9, 4.2), facecolor='#121212')
        ax.imshow(wordcloud, interpolation='bilinear')
        ax.axis('off')
        plt.subplots_adjust(top=1, bottom=0, right=1, left=0, hspace=0, wspace=0)
        plt.margins(0, 0)
        
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='PNG', bbox_inches='tight', pad_inches=0, facecolor='#121212')
        plt.close(fig)
        img_buffer.seek(0)
        
        img_str = base64.b64encode(img_buffer.getvalue()).decode('utf-8')
        return jsonify({'wordcloud': f'data:image/png;base64,{img_str}'})
        
    except Exception as e:
        logger.error(f"Error generating wordcloud: {e}")
        return jsonify({"error": str(e)}), 500

@dash_bp.route('/ping')
def ping():
    return jsonify({"status": "ok", "message": "InsightSphere Dashboard Backend is active"}), 200
