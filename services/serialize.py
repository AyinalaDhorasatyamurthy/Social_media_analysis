from datetime import datetime

from bson import ObjectId


def json_safe(value):
    if value is None or isinstance(value, (str, bool, int, float)):
        return value
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if hasattr(value, "item") and callable(value.item):
        try:
            return json_safe(value.item())
        except Exception:
            return str(value)
    if isinstance(value, dict):
        return {str(key): json_safe(item) for key, item in value.items()}
    if isinstance(value, (list, tuple, set)):
        return [json_safe(item) for item in value]
    return str(value)
