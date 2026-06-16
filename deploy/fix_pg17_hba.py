import paramiko, sys, io
sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=10)

def run(cmd):
    _, stdout, stderr = c.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out: print(out[:2000])
    err_lines = [l for l in err.splitlines() if 'sudo' not in l.lower() and '[sudo]' not in l and 'password' not in l.lower()]
    if err_lines: print("ERR:", '\n'.join(err_lines)[:300])

print("=== PG 17 listen_addresses ===")
run("echo 'P@ssw0rd' | sudo -S grep 'listen_addresses' /etc/postgresql/17/main/postgresql.conf")

# Read current PG 17 hba
_, stdout, _ = c.exec_command("echo 'P@ssw0rd' | sudo -S cat /etc/postgresql/17/main/pg_hba.conf")
current_hba = stdout.read().decode('utf-8', errors='replace')

# Append the machine-specific rules from PG 16
extra_rules = """
# machine db — allows IP-based connections (migrated from PG 16)
host machine machine 192.168.100.225/32 scram-sha-256
host machine machine 127.0.0.1/32       scram-sha-256
host machine machine 192.168.100.0/24   scram-sha-256
host machine machine 192.168.0.0/16     scram-sha-256
host machine machine 10.0.0.0/8         scram-sha-256
host machine machine 172.16.0.0/12      scram-sha-256
"""

new_hba = current_hba + extra_rules
sftp = c.open_sftp()
sftp.putfo(io.BytesIO(new_hba.encode()), '/tmp/pg_hba_new.conf')
sftp.close()

run("echo 'P@ssw0rd' | sudo -S cp /tmp/pg_hba_new.conf /etc/postgresql/17/main/pg_hba.conf")
run("echo 'P@ssw0rd' | sudo -S chown postgres:postgres /etc/postgresql/17/main/pg_hba.conf")
run("echo 'P@ssw0rd' | sudo -S chmod 640 /etc/postgresql/17/main/pg_hba.conf")

print("\n=== Fix listen_addresses to accept IP connections ===")
run("echo 'P@ssw0rd' | sudo -S sed -i \"s/#listen_addresses = 'localhost'/listen_addresses = '*'/\" /etc/postgresql/17/main/postgresql.conf")
run("echo 'P@ssw0rd' | sudo -S sed -i \"s/listen_addresses = 'localhost'/listen_addresses = '*'/\" /etc/postgresql/17/main/postgresql.conf")
run("echo 'P@ssw0rd' | sudo -S grep 'listen_addresses' /etc/postgresql/17/main/postgresql.conf")

print("\n=== Restart PG 17 ===")
run("echo 'P@ssw0rd' | sudo -S systemctl restart postgresql@17-main")
import time; time.sleep(3)
run("pg_lsclusters")

print("\n=== Restart the-machine-api ===")
run("echo 'P@ssw0rd' | sudo -S systemctl restart the-machine-api.service")
time.sleep(5)
run("echo 'P@ssw0rd' | sudo -S journalctl -u the-machine-api.service -n 10 --no-pager 2>/dev/null | grep -E 'Started|ERROR|connect|refused|HikariPool'")

c.close()
