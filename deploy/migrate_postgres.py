import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=10)

def run(cmd, timeout=300):
    _, stdout, stderr = c.exec_command(f"echo 'P@ssw0rd' | sudo -S bash -c {repr(cmd)}", timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    code = stdout.channel.recv_exit_status()
    if out: print(out[:3000])
    err_lines = [l for l in err.splitlines() if 'sudo' not in l.lower() and '[sudo]' not in l and 'password' not in l.lower()]
    if err_lines: print("ERR:", '\n'.join(err_lines)[:500])
    return code

print("=== Backup all databases first ===")
run("sudo -u postgres pg_dumpall > /home/mohnndd/pg16_backup_$(date +%Y%m%d).sql && echo 'Backup done'")

print("\n=== Stop all app services that use PG ===")
for svc in ['grc-fortress-backend', 'reefperfumes-backend', 'fleetcore360-backend', 'fleetcore360v2-backend', 'fleetcorev2-backend']:
    run(f"systemctl stop {svc}.service 2>/dev/null || true")
run("systemctl list-units --type=service --state=running | grep -E 'fleet|reef|grc|machine-api' || echo 'all stopped'")

print("\n=== Upgrade cluster 16/main -> 17 ===")
# pg_upgradecluster migrates data and switches ports automatically
code = run("pg_upgradecluster 16 main", timeout=300)
print(f"Upgrade exit code: {code}")

print("\n=== Clusters after upgrade ===")
run("pg_lsclusters")

print("\n=== Verify PG 17 has all databases ===")
run("sudo -u postgres psql -p 5432 -l")

c.close()
