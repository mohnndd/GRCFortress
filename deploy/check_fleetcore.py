import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=10)

def run(cmd):
    _, stdout, stderr = c.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    if out: print(out[:3000])

# Find which port fleetcore.rental-droop1.com proxies to
print("=== nginx config for fleetcore ===")
run("grep -A5 'fleetcore.rental' /etc/nginx/sites-enabled/*.conf 2>/dev/null | grep -E 'server_name|proxy_pass' | head -20")

# Check which service is on port 8082
print("\n=== What's on port 8082 ===")
run("ss -tlnp | grep 8082")

# Check fleetcore360 backend logs (runtime errors, not just startup)
print("\n=== fleetcore360-backend last 50 lines ===")
run("echo 'P@ssw0rd' | sudo -S journalctl -u fleetcore360-backend.service -n 50 --no-pager 2>/dev/null")

# Check all backend services' env files to confirm DB URLs
print("\n=== All backend.env files ===")
run("for f in /home/mohnndd/apps/*/backend.env; do echo \"=== $f ===\"; cat $f; done")

c.close()
