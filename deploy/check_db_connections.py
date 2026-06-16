import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=10)

def run(cmd):
    _, stdout, stderr = c.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out: print(out[:3000])
    if err: print("ERR:", err[:500])

print("=== Active PG connections by database ===")
run("echo 'P@ssw0rd' | sudo -S -u postgres psql -p 5432 -c \"SELECT datname, count(*), state FROM pg_stat_activity GROUP BY datname, state ORDER BY datname;\"")

print("\n=== Full journal last 20 lines for each service ===")
for svc in ['grc-fortress-backend', 'reefperfumes-backend', 'fleetcore360-backend', 'fleetcore360v2-backend', 'fleetcorev2-backend']:
    print(f"\n{'='*50}\n{svc}\n{'='*50}")
    run(f"echo 'P@ssw0rd' | sudo -S journalctl -u {svc}.service -n 20 --no-pager 2>/dev/null")

c.close()
