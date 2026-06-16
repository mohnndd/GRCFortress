import paramiko, sys, io
sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=10)

def run(cmd):
    _, stdout, stderr = c.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out: print(out)
    if err and 'sudo' not in err: print("ERR:", err[:300])

# Read current config
_, stdout, _ = c.exec_command("cat /etc/cloudflared/config.yml")
config = stdout.read().decode('utf-8', errors='replace')

# Insert grcfortress entry before the catch-all 404 line
new_entry = "  - hostname: grcfortress.rental-droop1.com\n    service: http://localhost:80\n"
config = config.replace("  - service: http_status:404", new_entry + "  - service: http_status:404")

print("=== New config ===")
print(config)

# Write it
sftp = c.open_sftp()
sftp.putfo(io.BytesIO(config.encode()), '/tmp/cloudflared-config.yml')
sftp.close()

run("echo 'P@ssw0rd' | sudo -S cp /tmp/cloudflared-config.yml /etc/cloudflared/config.yml")
run("echo 'P@ssw0rd' | sudo -S systemctl restart cloudflared")
import time; time.sleep(3)
run("systemctl is-active cloudflared")
print("\nDone. Now delete the A record in Cloudflare and add a Tunnel CNAME for grcfortress pointing to the-machine tunnel.")

c.close()
