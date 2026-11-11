import json
import logging
import os
import re
import time
from datetime import datetime, timezone
from bson import ObjectId
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError, AutoReconnect

from blueprints.config import MONGODB_DB, MONGODB_URI

logger = logging.getLogger(__name__)

CACHE_FILE = os.path.join(os.path.dirname(__file__), "local_store.json")

_client = None
_db = None
_last_check_time = 0
_is_connected = False

def _check_connection():
    global _client, _db, _last_check_time, _is_connected
    now = time.time()
    # Cache connection status for 15 seconds to prevent latency when offline
    if now - _last_check_time < 15 and not _is_connected:
        return False
    _last_check_time = now
    try:
        if _client is None:
            _client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=800, connectTimeoutMS=800)
            _db = _client[MONGODB_DB]
        _client.admin.command('ping')
        _is_connected = True
        return True
    except Exception as exc:
        _is_connected = False
        return False

# Initialize local persistence
_local_store = {"youtube": {}, "imports": {}}

def _load_local_store():
    global _local_store
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                _local_store = json.load(f)
        except Exception as e:
            logger.warning("Error loading local_store.json: %s", e)

def _persist_local_store():
    try:
        def serialize_helper(obj):
            if isinstance(obj, (ObjectId, datetime)):
                return str(obj)
            raise TypeError(f"Type {type(obj)} not serializable")
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(_local_store, f, default=serialize_helper, indent=2)
    except Exception as e:
        logger.warning("Error saving local_store.json: %s", e)

_load_local_store()

class ResilientCollection:
    def __init__(self, name: str):
        self.name = name

    def insert_one(self, doc: dict):
        if "_id" not in doc:
            doc["_id"] = ObjectId()
        if _check_connection() and _db is not None:
            try:
                res = _db[self.name].insert_one(doc)
                self._save_local(doc)
                return res
            except Exception as exc:
                logger.warning("[MongoDB Offline] Insert falling back to local: %s", exc)

        self._save_local(doc)
        class InsertResult:
            inserted_id = doc["_id"]
        return InsertResult()

    def replace_one(self, filter_q: dict, doc: dict, upsert: bool = False):
        if _check_connection() and _db is not None:
            try:
                res = _db[self.name].replace_one(filter_q, doc, upsert=upsert)
                self._save_local(doc, filter_q)
                return res
            except Exception as exc:
                logger.warning("[MongoDB Offline] Replace falling back to local: %s", exc)

        self._save_local(doc, filter_q)
        class ReplaceResult:
            acknowledged = True
        return ReplaceResult()

    def update_one(self, filter_q: dict, update_q: dict, upsert: bool = False):
        if _check_connection() and _db is not None:
            try:
                res = _db[self.name].update_one(filter_q, update_q, upsert=upsert)
                self._update_local(filter_q, update_q, upsert)
                return res
            except Exception as exc:
                logger.warning("[MongoDB Offline] Update falling back to local: %s", exc)

        self._update_local(filter_q, update_q, upsert)
        class UpdateResult:
            acknowledged = True
        return UpdateResult()

    def find_one(self, query: dict = None):
        if _check_connection() and _db is not None:
            try:
                res = _db[self.name].find_one(query)
                if res is not None:
                    return res
            except Exception as exc:
                logger.warning("[MongoDB Offline] Find_one falling back to local: %s", exc)

        return self._find_one_local(query)

    def find(self, query: dict = None):
        if _check_connection() and _db is not None:
            try:
                res = list(_db[self.name].find(query or {}))
                if res:
                    return res
            except Exception as exc:
                logger.warning("[MongoDB Offline] Find falling back to local: %s", exc)

        return self._find_local(query or {})

    def _save_local(self, doc: dict, filter_q: dict = None):
        key = str(doc.get("channel_id") or doc.get("_id") or "")
        if not key and filter_q:
            key = str(filter_q.get("channel_id") or filter_q.get("_id") or "")
        if key:
            _local_store.setdefault(self.name, {})[key] = dict(doc)
            _persist_local_store()

    def _update_local(self, filter_q: dict, update_q: dict, upsert: bool):
        key = str(filter_q.get("channel_id") or filter_q.get("_id") or "")
        set_vals = update_q.get("$set", {})
        store = _local_store.setdefault(self.name, {})
        if key in store:
            store[key].update(set_vals)
            _persist_local_store()
        elif upsert and key:
            new_doc = dict(filter_q)
            new_doc.update(set_vals)
            store[key] = new_doc
            _persist_local_store()

    def _matches(self, doc: dict, query: dict) -> bool:
        if not query:
            return True
        for k, v in query.items():
            if k == "$or" and isinstance(v, list):
                if not any(self._matches(doc, cond) for cond in v):
                    return False
            elif isinstance(v, dict) and "$regex" in v:
                target_str = str(doc.get(k, ""))
                regex = v["$regex"]
                flags = re.IGNORECASE if "i" in v.get("$options", "") else 0
                if not re.search(regex, target_str, flags):
                    return False
            elif isinstance(v, dict) and "$gte" in v:
                if (doc.get(k) or 0) < v["$gte"]:
                    return False
            else:
                if doc.get(k) != v:
                    return False
        return True

    def _find_one_local(self, query: dict):
        store = _local_store.get(self.name, {})
        if not query:
            for item in store.values():
                return dict(item)
            return None
        for item in store.values():
            if self._matches(item, query):
                return dict(item)
        return None

    def _find_local(self, query: dict):
        store = _local_store.get(self.name, {})
        return [dict(item) for item in store.values() if self._matches(item, query)]


_youtube_coll = ResilientCollection("youtube")
_imports_coll = ResilientCollection("imports")

def get_youtube_collection():
    return _youtube_coll

def get_imports_collection():
    return _imports_coll
