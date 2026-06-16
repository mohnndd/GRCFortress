import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=10)

def run(cmd):
    _, stdout, stderr = c.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    if out: print(out[:2000])

print("=== PG status ===")
run("pg_lsclusters")

print("\n=== All backend services ===")
run("echo 'P@ssw0rd' | sudo -S systemctl status grc-fortress-backend reefperfumes-backend fleetcore360-backend fleetcore360v2-backend fleetcorev2-backend 2>/dev/null | grep -E 'service|Active|error|Failed'")

print("\n=== Recent errors from each service ===")
for svc in ['grc-fortress-backend', 'reefperfumes-backend', 'fleetcore360-backend', 'fleetcore360v2-backend', 'fleetcorev2-backend']:
    print(f"\n-- {svc} --")
    run(f"echo 'P@ssw0rd' | sudo -S journalctl -u {svc}.service -n 5 --no-pager 2>/dev/null | grep -E 'ERROR|error|connect|refused|Active|Started'")

c.close()
