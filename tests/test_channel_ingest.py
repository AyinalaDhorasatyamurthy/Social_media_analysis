from services.channel_ingest import normalize_country, parse_duration_seconds
from services.serialize import json_safe
from bson import ObjectId


def test_parse_duration_seconds():
    assert parse_duration_seconds("PT45S") == 45
    assert parse_duration_seconds("PT1M") == 60
    assert parse_duration_seconds("PT1H2M3S") == 3723
    assert parse_duration_seconds("") == 0
    assert parse_duration_seconds(None) == 0
    assert parse_duration_seconds("PT1M30S") == 90


def test_normalize_country():
    assert normalize_country("india") == "IN"
    assert normalize_country("IN") == "IN"
    assert normalize_country("france") == "FR"


def test_json_safe_objectid():
    payload = json_safe({"_id": ObjectId("507f1f77bcf86cd799439011"), "views": 10})
    assert payload["_id"] == "507f1f77bcf86cd799439011"
    assert payload["views"] == 10
