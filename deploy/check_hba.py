import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=10)

def run(cmd):
    _, stdout, _ = c.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    if out: print(out[:3000])

print("=== PG 17 pg_hba.conf ===")
run("echo 'P@ssw0rd' | sudo -S cat /etc/postgresql/17/main/pg_hba.conf | grep -v '^#' | grep -v '^$'")

print("\n=== the-machine-api service logs ===")
run("echo 'P@ssw0rd' | sudo -S journalctl -u the-machine-api.service -n 30 --no-pager 2>/dev/null")

print("\n=== PG 16 pg_hba.conf (for reference) ===")
run("echo 'P@ssw0rd' | sudo -S cat /etc/postgresql/16/main/pg_hba.conf | grep -v '^#' | grep -v '^$'")

c.close()
