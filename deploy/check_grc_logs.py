import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=10)

def run(cmd):
    _, stdout, _ = c.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='replace').strip()[:3000])

print("=== GRC Fortress backend - full recent log ===")
run("echo 'P@ssw0rd' | sudo -S journalctl -u grc-fortress-backend.service -n 80 --no-pager 2>/dev/null")

print("\n=== Does uuidv7() exist in PG 17? ===")
run("echo 'P@ssw0rd' | sudo -S -u postgres psql -p 5432 -c \"SELECT uuidv7();\" 2>&1")

print("\n=== Flyway migration status on grcfortress DB ===")
run("echo 'P@ssw0rd' | sudo -S -u postgres psql -p 5432 -d grcfortress -c \"SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank;\" 2>&1")

c.close()
