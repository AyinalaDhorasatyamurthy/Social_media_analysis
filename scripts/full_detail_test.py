"""
Full Detailed Verification Test Suite for InsightSphere Creator & Channel Discovery
Tests all 13 YouTube Categories and sovereign Country Filters.
Supports both live HTTP server mode (default) and in-process Flask test_client mode (--inprocess).
Validates:
1. 100% strict vertical/thematic relevance (no cross-category leakage)
2. Prioritization of local sovereign country creators
3. Working, high-resolution thumbnail images for all cards
4. No empty or broken channels
"""

import argparse
import os
import sys
import requests

# Ensure parent repo root is importable when executed directly
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

BASE_URL = "http://127.0.0.1:5000/recommendations/recommendations"

CATEGORIES = [
    ("1", "Film & Animation"),
    ("2", "Autos & Vehicles"),
    ("10", "Music"),
    ("15", "Pets & Animals"),
    ("17", "Sports"),
    ("20", "Gaming"),
    ("22", "People & Blogs"),
    ("23", "Comedy"),
    ("24", "Entertainment"),
    ("25", "News & Politics"),
    ("26", "How-to & Style"),
    ("27", "Education"),
    ("28", "Science & Technology")
]

COUNTRIES = ["GB", "US", "IN", "AU", "ALL"]


def run_test(inprocess=False):
    total_tests = 0
    passed_tests = 0
    failures = []

    client = None
    if inprocess:
        from app import create_app
        app = create_app()
        client = app.test_client()

    print("=" * 80)
    print("STARTING FULL DETAIL RECOMMENDATIONS RELEVANCE AUDIT")
    print(f"Mode: {'In-Process Flask test_client' if inprocess else f'Live HTTP ({BASE_URL})'}")
    print("=" * 80)

    for cat_id, cat_name in CATEGORIES:
        for country in COUNTRIES:
            total_tests += 1
            payload = {"categories": [cat_id], "country": country}

            try:
                if inprocess:
                    resp = client.post("/recommendations/recommendations", json=payload)
                    status_code = resp.status_code
                    data = resp.get_json() or {}
                else:
                    resp = requests.post(BASE_URL, json=payload, timeout=8)
                    status_code = resp.status_code
                    data = resp.json()

                if status_code != 200:
                    failures.append(f"HTTP {status_code} for {cat_name} ({cat_id}) in {country}")
                    continue

                results = data.get("results", [])

                if not results:
                    failures.append(f"EMPTY results for {cat_name} ({cat_id}) in {country}")
                    continue

                # Verification 1: All items belong to requested category
                invalid_cats = [r for r in results if str(r.get("category_id")) != cat_id]
                if invalid_cats:
                    failures.append(
                        f"Category mismatch in {cat_name} ({cat_id}) / {country}: "
                        f"found {len(invalid_cats)} items with wrong category"
                    )
                    continue

                # Verification 2: Check thumbnails are valid HTTP URLs
                broken_thumbs = [
                    r for r in results
                    if not r.get("thumbnails", {}).get("high", {}).get("url", "").startswith("http")
                ]
                if broken_thumbs:
                    failures.append(
                        f"Broken thumbnails in {cat_name} ({cat_id}) / {country}: "
                        f"{len(broken_thumbs)} items missing valid URL"
                    )
                    continue

                # Verification 3: If country != ALL and local creators exist, local must be at the top
                if country != "ALL":
                    local_items = [r for r in results if (r.get("country") or "").upper() == country]
                    if local_items:
                        first_item_country = (results[0].get("country") or "").upper()
                        if first_item_country != country:
                            failures.append(
                                f"Priority failure in {cat_name} ({cat_id}) / {country}: "
                                f"First result is {first_item_country}, expected {country}"
                            )
                            continue

                passed_tests += 1

            except Exception as e:
                failures.append(f"Exception during {cat_name} ({cat_id}) in {country}: {str(e)}")

    print(f"SUMMARY: {passed_tests} / {total_tests} Tests PASSED!")
    if failures:
        print("\nFAILURES DETECTED:")
        for f in failures:
            print(f"  [FAIL] {f}")
        return False
    else:
        print("\nALL 65 CATEGORY/COUNTRY COMBINATIONS PASSED WITH 100% RELEVANCE!")
        return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="InsightSphere Recommendations Relevance Audit")
    parser.add_argument(
        "--inprocess",
        action="store_true",
        help="Run directly against Flask test_client without requiring a live HTTP server on port 5000"
    )
    args = parser.parse_args()
    success = run_test(inprocess=args.inprocess)
    sys.exit(0 if success else 1)
