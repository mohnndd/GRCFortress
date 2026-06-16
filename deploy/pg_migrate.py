import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=30)

def run(cmd, timeout=300):
    _, stdout, stderr = c.exec_command(f"echo 'P@ssw0rd' | sudo -S bash -c {repr(cmd)}", timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stdout.channel.recv_exit_status()
    if out: print(out[:2000])
    return err

def run2(cmd, timeout=300):
    # Run without sudo wrapper to capture stderr too
    _, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    out = (stdout.read() + stderr.read()).decode('utf-8', errors='replace').strip()
    if out: print(out[:2000])

print("=== Restore dump into PG 17 (port 5433) ===")
run("sudo -u postgres psql -p 5433 -f /home/mohnndd/pg16_backup_$(ls /home/mohnndd/pg16_backup_*.sql | head -1 | grep -oP '\\d+(?=\\.sql)').sql 2>&1 | tail -20")

# Actually do it properly
print("\n=== Find backup file ===")
_, out, _ = c.exec_command("ls /home/mohnndd/pg16_backup_*.sql")
backup = out.read().decode().strip().split('\n')[0]
print(f"Backup: {backup}")

print("\n=== Restore to PG 17 ===")
run(f"sudo -u postgres psql -p 5433 -f {backup} > /tmp/pg17_restore.log 2>&1 && echo 'Restore done' || echo 'Restore had errors (check log)'")
run("tail -20 /tmp/pg17_restore.log")

print("\n=== Verify PG 17 databases ===")
run("sudo -u postgres psql -p 5433 -l")

print("\n=== Switch ports: stop PG 16, reconfigure PG 17 to 5432 ===")
run("systemctl stop postgresql@16-main")
time.sleep(2)
run("sed -i 's/^port = 5433/port = 5432/' /etc/postgresql/17/main/postgresql.conf")
run("sed -i 's/^port = 5432/port = 5433/' /etc/postgresql/16/main/postgresql.conf")
run("systemctl restart postgresql@17-main")
time.sleep(3)

print("\n=== Final cluster state ===")
run("pg_lsclusters")

print("\n=== Verify PG 17 on 5432 ===")
run("sudo -u postgres psql -p 5432 -c 'SELECT version();'")

print("\n=== Restart all app services ===")
for svc in ['grc-fortress-backend', 'reefperfumes-backend', 'fleetcore360-backend', 'fleetcore360v2-backend', 'fleetcorev2-backend']:
    run(f"systemctl start {svc}.service 2>/dev/null || true")
time.sleep(5)
run("systemctl list-units --type=service --state=running | grep -E 'fleet|reef|grc'")

c.close()
