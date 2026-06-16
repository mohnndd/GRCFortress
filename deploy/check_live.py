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
    if err: print("ERR:", err[:500])

print("=== current symlink ===")
run("readlink /home/mohnndd/apps/grc-fortress/current && ls /home/mohnndd/apps/grc-fortress/current/ | head -5")

print("\n=== backend current.jar ===")
run("readlink /home/mohnndd/apps/grc-fortress/backend/current.jar && ls -lh /home/mohnndd/apps/grc-fortress/backend/current.jar")

print("\n=== backend service ===")
run("systemctl is-active grc-fortress-backend.service && echo 'P@ssw0rd' | sudo -S journalctl -u grc-fortress-backend.service -n 30 --no-pager")

print("\n=== port 8086 ===")
run("ss -tlnp | grep 8086 || echo 'NOT listening'")

print("\n=== nginx error log (last 20) ===")
run("echo 'P@ssw0rd' | sudo -S tail -20 /var/log/nginx/error.log")

print("\n=== curl test ===")
run("curl -s -o /dev/null -w '%{http_code}' http://localhost/ -H 'Host: grcfortress.rental-droop1.com'")

c.close()
