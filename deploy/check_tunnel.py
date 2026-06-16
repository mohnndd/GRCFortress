import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=10)

def run(cmd):
    _, stdout, stderr = c.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out: print(out)
    if err: print("ERR:", err[:300])

print("=== cloudflared version ===")
run("cloudflared --version 2>/dev/null || which cloudflared")

print("\n=== tunnel config files ===")
run("find /home/mohnndd/.cloudflared /etc/cloudflared /usr/local/etc/cloudflared -type f 2>/dev/null")

print("\n=== tunnel config content ===")
run("cat /home/mohnndd/.cloudflared/config.yml 2>/dev/null || cat /etc/cloudflared/config.yml 2>/dev/null")

print("\n=== cloudflared service ===")
run("systemctl status cloudflared 2>/dev/null | head -8")
run("echo 'P@ssw0rd' | sudo -S systemctl list-units | grep cloud")

c.close()
