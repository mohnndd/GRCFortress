import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=10)

def run(cmd):
    _, stdout, stderr = c.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    if out: print(out[:800])

print("=== Nginx status ===")
run("echo 'P@ssw0rd' | sudo -S systemctl is-active nginx")
run("echo 'P@ssw0rd' | sudo -S nginx -t 2>&1")

print("\n=== Nginx config for grc-fortress ===")
run("cat /etc/nginx/sites-enabled/grc-fortress.conf")

print("\n=== App dir ===")
run("ls -la /home/mohnndd/apps/grc-fortress/")

print("\n=== current symlink ===")
run("readlink -f /home/mohnndd/apps/grc-fortress/current 2>/dev/null || echo 'MISSING - no current symlink yet'")

print("\n=== Backend service ===")
run("echo 'P@ssw0rd' | sudo -S systemctl status grc-fortress-backend.service 2>/dev/null | head -6")

print("\n=== Port 8086 ===")
run("ss -tlnp | grep 8086 || echo 'nothing on 8086 yet'")

print("\n=== DNS resolution ===")
run("dig +short grcfortress.rental-droop1.com @8.8.8.8 || nslookup grcfortress.rental-droop1.com 8.8.8.8 2>/dev/null | grep Address")

print("\n=== Workflow runner log tail ===")
run("find /home/mohnndd/actions-runner/grc-fortress/_diag -name '*.log' 2>/dev/null | sort | tail -1 | xargs tail -20 2>/dev/null")

c.close()
