import paramiko, sys, urllib.request
sys.stdout.reconfigure(encoding='utf-8')

# Test from outside
try:
    req = urllib.request.Request('https://grcfortress.rental-droop1.com', headers={'User-Agent': 'Mozilla/5.0'})
    resp = urllib.request.urlopen(req, timeout=10)
    print(f"HTTP {resp.status} - site is UP")
    html = resp.read(200).decode('utf-8', errors='replace')
    print(f"Response starts with: {html[:100]}")
except Exception as e:
    print(f"Error: {e}")
