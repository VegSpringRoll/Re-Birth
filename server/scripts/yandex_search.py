import sys
import json
import argparse
import urllib.request
import urllib.parse
import html as html_lib
import re

# Ensure standard output can print Unicode characters safely on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

def scrape_yandex_direct(query, max_results=10, family_filter=0):
    if not query or not query.strip():
        return []

    url = f'https://yandex.com/images/search?text={urllib.parse.quote(query.strip())}&family={family_filter}'
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
    except Exception as e:
        sys.stderr.write(f"[YandexDirect] Request failed: {e}\n")
        return []

    match = re.search(r'data-state="([^"]*viewerData[^"]*)"', html)
    if not match:
        match = re.search(r'data-state="([^"]*serpList[^"]*)"', html)
    if not match:
        return []

    items = []
    seen = set()

    try:
        unescaped = html_lib.unescape(match.group(1))
        data = json.loads(unescaped)
        entities = data.get('initialState', {}).get('serpList', {}).get('items', {}).get('entities', {})

        for key, item in entities.items():
            snippet = item.get('snippet', {})
            title = snippet.get('title') or snippet.get('text') or ''
            viewer = item.get('viewerData', {})
            dups = viewer.get('dups', [])
            preview = viewer.get('preview', [])
            thumb = item.get('thumb', {}).get('url')

            full_url = None
            # Check for GIF in duplicate high-res sources first
            for d in dups:
                u = d.get('url', '')
                if u and ('.gif' in u.lower() or 'tenor.com' in u.lower() or 'giphy.com' in u.lower()):
                    full_url = u
                    break

            if not full_url and dups:
                full_url = dups[0].get('url')
            elif not full_url and preview:
                full_url = preview[0].get('url')
            elif not full_url and thumb:
                full_url = thumb if thumb.startswith('http') else f"https:{thumb}"

            thumb_url = None
            if preview:
                thumb_url = preview[0].get('url')
            elif thumb:
                thumb_url = thumb if thumb.startswith('http') else f"https:{thumb}"
            else:
                thumb_url = full_url

            if full_url and full_url not in seen:
                seen.add(full_url)
                is_gif = (
                    '.gif' in full_url.lower() or
                    (thumb_url and '.gif' in thumb_url.lower()) or
                    'tenor.com' in full_url.lower() or
                    'giphy.com' in full_url.lower() or
                    'gif' in title.lower()
                )

                items.append({
                    'title': title,
                    'image': full_url,
                    'thumbnail': thumb_url or full_url,
                    'url': full_url,
                    'source': snippet.get('domain', 'yandex.com'),
                    'isGif': is_gif
                })

                if len(items) >= max_results:
                    break
    except Exception as e:
        sys.stderr.write(f"[YandexDirect] Parsing failed: {e}\n")

    return items

def search_with_imgsearch_api(query, max_results=10):
    try:
        from imgsearch_api import image_search
        # Try yandex first, then bing and ddg fallback
        urls = image_search(query, engines=['yandex', 'bing', 'ddg'], n=max_results)
        if urls:
            items = []
            for u in urls:
                items.append({
                    'title': query,
                    'image': u,
                    'thumbnail': u,
                    'url': u,
                    'source': 'yandex (imgsearch-api)',
                    'isGif': '.gif' in u.lower() or 'tenor.com' in u.lower()
                })
            return items
    except Exception as e:
        sys.stderr.write(f"[imgsearch-api] Engine error: {e}\n")
    return []

def main():
    parser = argparse.ArgumentParser(description="Yandex Image Search CLI via imgsearch-api & Direct Engine")
    parser.add_argument("query", type=str, help="Search query")
    parser.add_argument("--max", type=int, default=10, help="Max results")
    parser.add_argument("--safesearch", type=str, default="off", choices=["on", "moderate", "off"], help="Safesearch mode")

    args = parser.parse_args()
    family_filter = 1 if args.safesearch == "on" else 0

    clean_query = args.query.strip() if args.query else ""
    results = scrape_yandex_direct(clean_query, max_results=args.max, family_filter=family_filter)

    # If direct scraper returned fewer than 3 results, fallback to imgsearch-api
    if len(results) < 3:
        api_results = search_with_imgsearch_api(clean_query, max_results=args.max)
        if api_results:
            seen_urls = {r['image'] for r in results}
            for ar in api_results:
                if ar['image'] not in seen_urls:
                    seen_urls.add(ar['image'])
                    results.append(ar)
                    if len(results) >= args.max:
                        break

    # If still 0 results, retry with anime keyword
    if len(results) == 0 and "anime" not in clean_query.lower():
        fallback_query = f"{clean_query} anime"
        results = scrape_yandex_direct(fallback_query, max_results=args.max, family_filter=family_filter)
        if len(results) == 0:
            results = search_with_imgsearch_api(fallback_query, max_results=args.max)

    output = {
        "query": clean_query,
        "results": results[:args.max],
        "count": len(results[:args.max])
    }

    print(json.dumps(output, ensure_ascii=False))

if __name__ == "__main__":
    main()
