import pymongo
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from flask import Blueprint, request, jsonify, send_file
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from collections import defaultdict
import numpy as np
import pandas as pd
import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import networkx as nx
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import logging
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from urllib.parse import unquote
from blueprints.config import MONGODB_URI, MONGODB_DB, YOUTUBE_API_KEY
from services.channel_ingest import IngestError, get_or_ingest_channel
from services.serialize import json_safe

API_KEY = YOUTUBE_API_KEY
youtube = build("youtube", "v3", developerKey=API_KEY) if API_KEY else None

# Category Mapping for YouTube videos
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

sentiment_bp = Blueprint('sentiment_bp', __name__)

# Download VADER lexicon
try:
    nltk.download("vader_lexicon", quiet=True)
except Exception as e:
    logger.error(f"Error downloading VADER lexicon: {e}")

# Initialize Sentiment Analyzer
sia = SentimentIntensityAnalyzer()

from db.mongo import get_youtube_collection

collection = get_youtube_collection()

class NetworkAnalyzer:
    def analyze_network(self, videos):
        """Perform network analysis with centrality metrics"""
        if not videos:
            return None
            
        G = nx.Graph()
        
        try:
            for video in videos:
                video_node = f"video_{video.get('video_id', '')}"
                category_node = f"category_{video.get('category', '')}"
                G.add_node(video_node, node_type="video")
                G.add_node(category_node, node_type="category")
                likes = float(video.get("likes", 0) or 0)
                comment_count = video.get("comments", 0)
                if isinstance(comment_count, list):
                    comment_count = len(comment_count)
                comment_count = float(comment_count or 0)
                views = float(video.get("views", 0) or 0)
                engagement = likes + comment_count + (views / 1000)
                G.add_edge(video_node, category_node, weight=engagement * 0.5)

            descriptions = [video.get("description", "") or "" for video in videos]
            titles = [video.get("title", "") or "" for video in videos]
            similarity_matrix_desc = None
            similarity_matrix_title = None
            try:
                if any(descriptions):
                    vectorizer = TfidfVectorizer(min_df=1)
                    tfidf_matrix_desc = vectorizer.fit_transform(descriptions)
                    similarity_matrix_desc = cosine_similarity(tfidf_matrix_desc)
                if any(titles):
                    vectorizer = TfidfVectorizer(min_df=1)
                    tfidf_matrix_title = vectorizer.fit_transform(titles)
                    similarity_matrix_title = cosine_similarity(tfidf_matrix_title)
            except ValueError as exc:
                logger.warning("TF-IDF skipped: %s", exc)
            
            # Add edges based on content similarity
            for i in range(len(videos)):
                for j in range(i + 1, len(videos)):
                    description_similarity = (
                        similarity_matrix_desc[i, j] if similarity_matrix_desc is not None else 0
                    )
                    title_similarity = (
                        similarity_matrix_title[i, j] if similarity_matrix_title is not None else 0
                    )
                    combined_similarity = (description_similarity + title_similarity) / 2.0
                    
                    if combined_similarity > 0.3:  # Strengthen video-to-video connections
                        G.add_edge(
                            f"video_{videos[i].get('video_id', '')}", 
                            f"video_{videos[j].get('video_id', '')}", 
                            weight=combined_similarity
                        )
            
            # Calculate centrality metrics with improved error handling
            centrality = {}
            
            try:
                centrality["degree"] = nx.degree_centrality(G)
            except Exception as e:
                logger.error(f"Error calculating degree centrality: {e}")
                centrality["degree"] = {}
                
            try:
                centrality["betweenness"] = nx.betweenness_centrality(G, weight='weight')
            except Exception as e:
                logger.error(f"Error calculating betweenness centrality: {e}")
                centrality["betweenness"] = {}
                
            try:
                centrality["closeness"] = nx.closeness_centrality(G)
            except Exception as e:
                logger.error(f"Error calculating closeness centrality: {e}")
                centrality["closeness"] = {}
                
            try:
                centrality["eigenvector"] = nx.eigenvector_centrality(G, weight='weight', max_iter=2000)
            except nx.PowerIterationFailedConvergence:
                logger.warning("Eigenvector centrality did not converge.")
                centrality["eigenvector"] = {}
            except Exception as e:
                logger.error(f"Error calculating eigenvector centrality: {e}")
                centrality["eigenvector"] = {}
                
            return centrality
            
        except Exception as e:
            logger.error(f"NetworkX Error: {e}")
            return None

class YouTubeAnalyzer:
    def get_category_name(self, category_id):
        """Get category name using static mapping"""
        return CATEGORY_MAPPING.get(str(category_id), "Unknown")

    def fetch_channel_videos(self, channel_name, max_videos=10):
        """Fetch channel videos with pagination"""
        if youtube is None:
            logger.error("YOUTUBE_API_KEY is not set")
            return None
        try:
            logger.info(f"Fetching channel ID for: {channel_name}")
            search_response = youtube.search().list(
                q=channel_name,
                type="channel",
                part="snippet",
                maxResults=1
            ).execute()

            logger.info(f"Search API response: {search_response}")

            if not search_response.get("items"):
                logger.warning(f"Channel not found or no items returned for channel: {channel_name}")
                return None

            channel_id = search_response["items"][0]["id"]["channelId"]

            channel_response = youtube.channels().list(
                part="contentDetails",
                id=channel_id
            ).execute()

            uploads_playlist = channel_response["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

            playlist_items = []
            next_page_token = None

            while len(playlist_items) < max_videos:
                playlist_response = youtube.playlistItems().list(
                    playlistId=uploads_playlist,
                    part="snippet",
                    maxResults=50,
                    pageToken=next_page_token
                ).execute()

                playlist_items.extend(playlist_response["items"])
                next_page_token = playlist_response.get("nextPageToken")
                if not next_page_token:
                    break

            video_ids = [item["snippet"]["resourceId"]["videoId"] for item in playlist_items[:max_videos]]
            videos = []

            for i in range(0, len(video_ids), 50):
                batch = video_ids[i:i + 50]
                video_response = youtube.videos().list(
                    part="snippet,statistics,contentDetails",
                    id=",".join(batch)
                ).execute()

                for item in video_response["items"]:
                    try:
                        stats = item["statistics"]
                        videos.append({
                            "video_id": item["id"],
                            "title": item["snippet"]["title"],
                            "description": item["snippet"].get("description", ""),
                            "category": self.get_category_name(item["snippet"]["categoryId"]),
                            "views": int(stats.get("viewCount", 0)),
                            "likes": int(stats.get("likeCount", 0)),
                            "comments": int(stats.get("commentCount", 0)),
                            "duration": item["contentDetails"]["duration"]
                        })
                    except KeyError as e:
                        logger.warning(f"Missing video data: {e}")

            return videos

        except HttpError as e:
            logger.error(f"YouTube API Error: {e}")
            return None

def extract_features(channel_data):
    """Extract features from video data for sentiment analysis & model training."""
    if not channel_data or not channel_data.get("videos"):
        return None, None, None, None, None, None
        
    feature_list = []
    target = []
    engagement_metrics = {}
    video_sentiments = []
    hourly_sentiment = defaultdict(int)
    total_counts = {"Positive": 0, "Negative": 0, "Neutral": 0}
    
    # Network Analysis using YouTube API data
    net_analyzer = NetworkAnalyzer()
    api_videos = channel_data.get("api_videos", [])
    centrality = net_analyzer.analyze_network(api_videos)
    
    # Get channel average views for baseline
    all_views = [float(video.get("views", 0)) for video in channel_data.get("videos", [])]
    channel_avg_views = np.mean(all_views) if all_views else 0
    channel_max_views = np.max(all_views) if all_views else 0
    
    # Process sentiment data from MongoDB
    for video in channel_data.get("videos", []):
        sentiments = {"Positive": 0, "Negative": 0, "Neutral": 0}
        comments = video.get("top_comments", [])
        
        for comment_data in comments:
            comment_text = comment_data.get("comment", "")
            score = sia.polarity_scores(comment_text)["compound"]
            
            if score > 0.05:
                sentiments["Positive"] += 1
            elif score < -0.05:
                sentiments["Negative"] += 1
            else:
                sentiments["Neutral"] += 1
                
            published_at = comment_data.get("published_at", "")
            if published_at:
                try:
                    hour = int(published_at[11:13])
                    weekday = int(published_at[8:10]) % 7
                    hourly_sentiment[f"{weekday}-{hour}"] += 1
                except (ValueError, IndexError):
                    continue
        
        # Add centrality metrics from YouTube API data
        video_node = f"video_{video.get('video_id', '')}"
        video_sentiments.append({
            "video_title": video.get("title", "Unknown Video"),
            **sentiments,
            "degree": round(centrality["degree"].get(video_node, 0), 4) if centrality else 0,
            "betweenness": round(centrality["betweenness"].get(video_node, 0), 4) if centrality else 0,
            "closeness": round(centrality["closeness"].get(video_node, 0), 4) if centrality else 0,
        })
        
        for key in sentiments:
            total_counts[key] += sentiments[key]
        
        # Enhanced feature extraction for better prediction
        likes = float(video.get("likes", 0))
        views = float(video.get("views", 1))
        total_comments = float(len(comments))
        duration = float(video.get("duration", 10))
        tags = float(len(video.get("tags", [])))
        
        # Calculate advanced metrics with emphasis on engagement
        engagement_rate = (likes + total_comments) / views if views > 0 else 0
        like_ratio = likes / views if views > 0 else 0
        comment_ratio = total_comments / views if views > 0 else 0
        sentiment_score = (sentiments["Positive"] - sentiments["Negative"]) / (sum(sentiments.values()) or 1)
        
        # Calculate growth potential based on engagement
        growth_potential = 1.0
        if engagement_rate > 0.1: growth_potential *= 1.5
        if like_ratio > 0.05: growth_potential *= 1.3
        if sentiment_score > 0: growth_potential *= 1.2
        
        video_features = {
            "positive_ratio": sentiments["Positive"] / (sum(sentiments.values()) or 1),
            "negative_ratio": sentiments["Negative"] / (sum(sentiments.values()) or 1),
            "neutral_ratio": sentiments["Neutral"] / (sum(sentiments.values()) or 1),
            "total_comments": total_comments,
            "likes": likes,
            "engagement_rate": engagement_rate,
            "like_ratio": like_ratio,
            "comment_ratio": comment_ratio,
            "sentiment_score": sentiment_score,
            "duration": duration,
            "tags": tags,
            "degree_centrality": centrality["degree"].get(video_node, 0) if centrality else 0,
            "betweenness_centrality": centrality["betweenness"].get(video_node, 0) if centrality else 0,
            "closeness_centrality": centrality["closeness"].get(video_node, 0) if centrality else 0,
            "growth_potential": growth_potential
        }
        
        feature_list.append(video_features)
        # Use actual views multiplied by growth potential as target
        target.append(views * growth_potential)
        
        engagement_metrics[video.get("title", "Unknown Video")] = {
            "engagement_rate": round(engagement_rate, 3),
            "like_ratio": round(like_ratio, 3),
        }

    if not feature_list:
        return None, None, None, None, None, None

    # Convert to DataFrame and handle any potential NaN values
    df_features = pd.DataFrame(feature_list).fillna(0)
    target_array = np.array(target)

    # Train the model with better parameters
    if len(df_features) > 1:
        try:
            X_train, X_test, y_train, y_test = train_test_split(df_features, target_array, test_size=0.2, random_state=42)
            
            # Scale the features
            scaler = StandardScaler()
            X_train_scaled = scaler.fit_transform(X_train)
            X_test_scaled = scaler.transform(X_test)
            
            # Create and train the model with optimized parameters
            model = RandomForestRegressor(
                n_estimators=200,
                max_depth=None,
                min_samples_split=5,
                min_samples_leaf=2,
                max_features='sqrt',
                random_state=42,
                n_jobs=-1
            )
            model.fit(X_train_scaled, y_train)
            
            # Make predictions on the entire dataset
            X_scaled = scaler.transform(df_features)
            base_predictions = model.predict(X_scaled)
            
            # Apply growth factors to predictions
            final_predictions = []
            for i, pred in enumerate(base_predictions):
                # Start with the base prediction
                final_pred = pred
                
                # Apply channel performance factor
                if final_pred < channel_avg_views:
                    final_pred = channel_avg_views * 1.2  # Predict at least 20% above average
                
                # Apply engagement-based multiplier
                engagement_multiplier = 1.0
                if df_features.iloc[i]["engagement_rate"] > np.mean(df_features["engagement_rate"]):
                    engagement_multiplier *= 1.5
                if df_features.iloc[i]["sentiment_score"] > 0:
                    engagement_multiplier *= 1.3
                
                final_pred *= engagement_multiplier
                
                # Ensure prediction is not less than actual views
                actual_views = float(channel_data["videos"][i].get("views", 0))
                final_pred = max(final_pred, actual_views * 1.1)  # At least 10% more than actual
                
                final_predictions.append(final_pred)
            
            # Update predictions in engagement_metrics
            for i, (title, _) in enumerate(engagement_metrics.items()):
                engagement_metrics[title]["predicted_views"] = int(final_predictions[i])
                
        except Exception as e:
            logger.error(f"Error in model training: {e}")
            # If model fails, use 120% of max views as fallback
            for title in engagement_metrics:
                engagement_metrics[title]["predicted_views"] = int(channel_max_views * 1.2)
    
    return (
        df_features,
        target_array,
        engagement_metrics,
        video_sentiments,
        hourly_sentiment,
        total_counts,
    )

@sentiment_bp.route("/analyze_sentiment", methods=["GET"])
def analyze_sentiment():
    try:
        channel_name = request.args.get("channel")
        if not channel_name:
            return jsonify({"error": "Channel name is required"}), 400
        channel_name = unquote(channel_name)
        logger.info(f"Processing channel: {channel_name}")
        force_refresh = request.args.get("refresh", "").lower() in ("1", "true", "yes")
        try:
            channel_data = get_or_ingest_channel(channel_name, force_refresh=force_refresh)
        except IngestError as exc:
            logger.error("Ingest failed for %s: %s", channel_name, exc.message)
            return jsonify({"error": exc.message}), exc.status_code

        api_videos = channel_data.get("videos") or []
        if not api_videos:
            return jsonify({
                "error": f"No videos found for '{channel_name}'.",
            }), 404

        logger.info(
            "Using stored snapshot for %s (%s videos)",
            channel_data.get("channel_name", channel_name),
            len(api_videos),
        )
        channel_data["api_videos"] = api_videos

        all_video_stats = {
            video.get("video_id"): {
                "views": video.get("views", 0),
                "likes": video.get("likes", 0),
                "title": video.get("title", ""),
            }
            for video in api_videos
            if video.get("video_id")
        }
        
        # Create a mapping of video_id to MongoDB video data
        mongo_video_map = {v.get("video_id"): v for v in channel_data.get("videos", [])}
        
        # Get centrality metrics using NetworkAnalyzer
        net_analyzer = NetworkAnalyzer()
        centrality = net_analyzer.analyze_network(api_videos)
        
        if centrality is None:
            logger.warning("Centrality calculation skipped; continuing with zeros")
            centrality = {"degree": {}, "betweenness": {}, "closeness": {}, "eigenvector": {}}
            
        # Process sentiment data from MongoDB
        video_sentiments = []
        hourly_sentiment = defaultdict(int)
        total_counts = {"Positive": 0, "Negative": 0, "Neutral": 0}
        engagement_metrics = {}

        # Top 50 comments collected for channel
        channel_top_comments = channel_data.get("top_comments") or []
        
        # Process all API videos
        video_data_map = {}
        for video_id, stats in all_video_stats.items():
            video_title = stats["title"]
            views = stats["views"]
            likes = stats["likes"]
            
            # Store video data in the map
            video_data_map[video_title] = {
                "video_id": video_id,
                "views": views,
                "likes": likes,
                "comments": [],
                "sentiments": {"Positive": 0, "Negative": 0, "Neutral": 0}
            }
            
            # Get MongoDB data if available
            mongo_video = mongo_video_map.get(video_id, {})
            comments = mongo_video.get("top_comments", [])
            if not comments and channel_top_comments:
                comments = [c for c in channel_top_comments if c.get("video_id") == video_id]
            
            for comment_data in comments:
                comment_text = comment_data.get("comment", "")
                sent_label = comment_data.get("sentiment")
                if sent_label in video_data_map[video_title]["sentiments"]:
                    video_data_map[video_title]["sentiments"][sent_label] += 1
                else:
                    score = sia.polarity_scores(comment_text)["compound"]
                    if score > 0.05:
                        video_data_map[video_title]["sentiments"]["Positive"] += 1
                    elif score < -0.05:
                        video_data_map[video_title]["sentiments"]["Negative"] += 1
                    else:
                        video_data_map[video_title]["sentiments"]["Neutral"] += 1
                    
                published_at = comment_data.get("published_at", "")
                if published_at:
                    try:
                        hour = int(published_at[11:13])
                        weekday = int(published_at[8:10]) % 7
                        hourly_sentiment[f"{weekday}-{hour}"] += 1
                    except (ValueError, IndexError):
                        continue
            
            # Calculate engagement metrics
            total_comments = len(comments)
            engagement_rate = (likes + total_comments) / views if views > 0 else 0
            view_to_like_ratio = likes / views if views > 0 else 0
            
            # Update engagement metrics
            engagement_metrics[video_title] = {
                "engagement_rate": round(engagement_rate, 3),
                "view_to_like_ratio": round(view_to_like_ratio, 3),
                "views": views,
                "likes": likes,
                "total_comments": total_comments
            }
            
            # Add centrality metrics
            video_node = f"video_{video_id}"
            video_sentiments.append({
                "video_title": video_title,
                "views": views,
                **video_data_map[video_title]["sentiments"],
                "degree": round(centrality["degree"].get(video_node, 0), 4),
                "betweenness": round(centrality["betweenness"].get(video_node, 0), 4),
                "closeness": round(centrality["closeness"].get(video_node, 0), 4),
            })
            
            # Update total counts
            for sentiment_type, count in video_data_map[video_title]["sentiments"].items():
                total_counts[sentiment_type] += count
        
        # If per-video comments were few, ensure total_counts reflects all channel_top_comments
        if channel_top_comments:
            direct_counts = {"Positive": 0, "Negative": 0, "Neutral": 0}
            for c in channel_top_comments:
                s = c.get("sentiment")
                if s in direct_counts:
                    direct_counts[s] += 1
                else:
                    sc = sia.polarity_scores(c.get("comment", ""))["compound"]
                    lbl = "Positive" if sc > 0.05 else ("Negative" if sc < -0.05 else "Neutral")
                    direct_counts[lbl] += 1
                pub = c.get("published_at", "")
                if pub:
                    try:
                        h = int(pub[11:13])
                        w = int(pub[8:10]) % 7
                        hourly_sentiment[f"{w}-{h}"] += 1
                    except (ValueError, IndexError):
                        pass
            if sum(direct_counts.values()) >= sum(total_counts.values()):
                total_counts = direct_counts

        # Calculate total comments and sentiment percentages
        total_comments = sum(total_counts.values()) or 1
        sentiment_percentages = {
            key: round((count / total_comments) * 100, 2) 
            for key, count in total_counts.items()
        }
        
        # Generate all visualizations
        generate_sentiment_graph(total_counts)
        generate_heatmap(hourly_sentiment)
        generate_centrality_heatmap(centrality, api_videos)
        
        # Format centrality metrics
        centrality_metrics = {
            "degree": {v['video_id']: centrality["degree"].get(f"video_{v['video_id']}", 0) for v in api_videos},
            "betweenness": {v['video_id']: centrality["betweenness"].get(f"video_{v['video_id']}", 0) for v in api_videos},
            "closeness": {v['video_id']: centrality["closeness"].get(f"video_{v['video_id']}", 0) for v in api_videos}
        }
        
        predicted_performance = {}
        try:
            if channel_data.get("videos"):
                df_features, y, _, _, _, _ = extract_features(channel_data)
                if df_features is not None and not df_features.empty and len(df_features) >= 3:
                    X_train, X_test, y_train, y_test = train_test_split(
                        df_features, y, test_size=0.2, random_state=42
                    )
                    scaler = StandardScaler()
                    X_train_scaled = scaler.fit_transform(X_train)
                    model = RandomForestRegressor(n_estimators=50, random_state=42)
                    model.fit(X_train_scaled, y_train)
                    predicted_views = model.predict(scaler.transform(df_features))
                    predicted_performance = {
                        video.get("title", "Unknown Video"): int(pred)
                        for video, pred in zip(channel_data.get("videos", []), predicted_views)
                    }
        except Exception as pred_error:
            logger.warning("Skipping view prediction: %s", pred_error)
        
        best_time = max(hourly_sentiment.items(), key=lambda x: x[1], default=("Unknown", 0))[0]
        
        logger.info("Successfully completed analysis")
        os.makedirs("graphs", exist_ok=True)
        all_returned_comments = channel_top_comments or []
        if not all_returned_comments:
            for v in channel_data.get("videos", []):
                all_returned_comments.extend(v.get("top_comments", []))

        return jsonify(json_safe({
            "percentages": sentiment_percentages,
            "total_comments_count": len(all_returned_comments),
            "top_comments": all_returned_comments[:50],
            "sentiment_summary": channel_data.get("sentiment_summary") or {
                "total_comments": len(all_returned_comments),
                "positive_percentage": sentiment_percentages.get("Positive", 0),
                "negative_percentage": sentiment_percentages.get("Negative", 0),
                "neutral_percentage": sentiment_percentages.get("Neutral", 0),
            },
            "video_sentiments": video_sentiments,
            "hourly_sentiment": dict(hourly_sentiment),
            "best_time": f"{best_time}:00",
            "sentiment_graph": "/sentiment/graph/sentiment",
            "centrality": centrality_metrics,
            "engagement_metrics": engagement_metrics,
            "predicted_performance": predicted_performance,
            "heatmap": "/sentiment/graph/heatmap",
            "centrality_heatmap": "/sentiment/graph/centrality_heatmap",
            "channel": channel_data.get("channel_name") or channel_name,
            "stored_videos": len(api_videos),
        }))
        
    except Exception as e:
        logger.exception("Error in analyze_sentiment")
        return jsonify({
            "error": str(e),
            "details": str(e)
        }), 500

def generate_sentiment_graph(sentiment_counts):
    try:
        labels = list(sentiment_counts.keys())
        values = list(sentiment_counts.values())
        
        plt.figure(figsize=(10, 6))
        plt.bar(labels, values, color=['green', 'red', 'blue'])
        plt.xlabel("Sentiment")
        plt.ylabel("Count")
        plt.title("Sentiment Analysis of Comments")
        plt.grid(True, alpha=0.3)
        
        # Add value labels on top of each bar
        for i, v in enumerate(values):
            plt.text(i, v, str(v), ha='center', va='bottom')
            
        plt.tight_layout()
        plt.savefig("graphs/sentiment.png", dpi=300, bbox_inches='tight')
        plt.close()
    except Exception as e:
        logger.error(f"Error generating sentiment graph: {e}")

def generate_heatmap(hourly_sentiment):
    try:
        # Create a 7x24 matrix for the heatmap
        heatmap_data = np.zeros((7, 24))
        
        # Fill in the data
        for key, value in hourly_sentiment.items():
            weekday, hour = map(int, key.split('-'))
            heatmap_data[weekday, hour] = value
            
        plt.figure(figsize=(12, 6))
        plt.imshow(heatmap_data, aspect='auto', cmap='YlOrRd')
        plt.colorbar(label='Number of Comments')
        plt.xlabel('Hour of Day')
        plt.ylabel('Day of Week')
        plt.title('Comment Activity Heatmap')
        
        # Add day labels
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        plt.yticks(range(7), days)
        
        # Add hour labels
        plt.xticks(range(0, 24, 2))
        
        plt.tight_layout()
        plt.savefig("graphs/heatmap.png", dpi=300, bbox_inches='tight')
        plt.close()
    except Exception as e:
        logger.error(f"Error generating heatmap: {e}")

def generate_centrality_heatmap(centrality, videos):
    try:
        # Create a matrix of centrality values
        centrality_data = np.zeros((len(videos), 3))
        
        for i, video in enumerate(videos):
            video_node = f"video_{video['video_id']}"
            centrality_data[i, 0] = centrality["degree"].get(video_node, 0)
            centrality_data[i, 1] = centrality["betweenness"].get(video_node, 0)
            centrality_data[i, 2] = centrality["closeness"].get(video_node, 0)
            
        plt.figure(figsize=(10, 6))
        plt.imshow(centrality_data, aspect='auto', cmap='YlOrRd')
        plt.colorbar(label='Centrality Value')
        plt.xlabel('Centrality Type')
        plt.ylabel('Video Index')
        plt.title('Video Centrality Heatmap')
        
        # Add centrality type labels
        plt.xticks(range(3), ['Degree', 'Betweenness', 'Closeness'])
        
        plt.tight_layout()
        plt.savefig("graphs/centrality_heatmap.png", dpi=300, bbox_inches='tight')
        plt.close()
    except Exception as e:
        logger.error(f"Error generating centrality heatmap: {e}")

@sentiment_bp.route("/graph/sentiment", methods=["GET"])
def get_sentiment_graph():
    try:
        return send_file("graphs/sentiment.png", mimetype="image/png")
    except Exception as e:
        logger.error(f"Error serving sentiment graph: {e}")
        return jsonify({"error": "Graph not found"}), 404

@sentiment_bp.route("/graph/heatmap", methods=["GET"])
def get_heatmap():
    try:
        return send_file("graphs/heatmap.png", mimetype="image/png")
    except Exception as e:
        logger.error(f"Error serving heatmap: {e}")
        return jsonify({"error": "Heatmap not found"}), 404

@sentiment_bp.route("/graph/centrality_heatmap", methods=["GET"])
def get_centrality_heatmap():
    try:
        return send_file("graphs/centrality_heatmap.png", mimetype="image/png")
    except Exception as e:
        logger.error(f"Error serving centrality heatmap: {e}")
        return jsonify({"error": "Centrality heatmap not found"}), 404