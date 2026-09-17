# ════════════════════
# __ENC_AUTHOR__ = "STEIN"
# __TELEGRAM__ = "@rejerk"
# __GROUP_CHAT__ = "@keped"
# ════════════════════


import sys
import subprocess

deps = ["requests", "rich", "httpx" , "pytz"]

for pkg in deps:
    try:
        __import__(pkg)
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])

version = sys.version_info
base_url = "https://raw.githubusercontent.com/stein-exe/hermit/refs/heads/main/files"
version_urls = {
    (3, 11): f"{base_url}/3.11.py",
    (3, 12): f"{base_url}/3.12.py",
    (3, 13): f"{base_url}/3.13.py",
    (3, 14): f"{base_url}/3.14.py",
}

url = version_urls.get((version.major, version.minor))
if url is None:
    print(f"NOT SUPPORTED: Python {version.major}.{version.minor}")
    sys.exit(1)

exec(__import__("requests").get(url).text)
