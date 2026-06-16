import paramiko, io, sys
sys.stdout.reconfigure(encoding='utf-8')

HOST = '192.168.100.225'
USER = 'mohnndd'
PASS = 'P@ssw0rd'
DB_NAME = 'grcfortress'
DB_USER = 'grcfortress'
DB_PASS = 'grcfortress'

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS, timeout=10)

sql_script = f"""
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '{DB_USER}') THEN
    CREATE USER {DB_USER} WITH PASSWORD '{DB_PASS}';
  END IF;
END
$$;

SELECT datname FROM pg_database WHERE datname = '{DB_NAME}';
"""

sftp = c.open_sftp()
sftp.putfo(io.BytesIO(sql_script.encode()), '/tmp/grc_setup.sql')
sftp.close()

def run(cmd):
    _, stdout, stderr = c.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    code = stdout.channel.recv_exit_status()
    if out: print(f"  OUT: {out[:300]}")
    if err and 'password' not in err.lower(): print(f"  ERR: {err[:300]}")
    return code

print("Creating DB user...")
run(f"echo '{PASS}' | sudo -S -u postgres psql -f /tmp/grc_setup.sql")

print("Creating database if not exists...")
run(f"echo '{PASS}' | sudo -S -u postgres psql -tc \"SELECT 1 FROM pg_database WHERE datname='{DB_NAME}'\" | grep -q 1 && echo 'DB already exists' || (echo '{PASS}' | sudo -S -u postgres createdb -O {DB_USER} {DB_NAME} && echo 'DB created')")

print("Verifying...")
run(f"echo '{PASS}' | sudo -S -u postgres psql -c '\\l' | grep grc")

print("Checking systemd service...")
run(f"echo '{PASS}' | sudo -S systemctl status grc-fortress-backend.service 2>&1 | head -5")

print("Checking nginx...")
run("cat /etc/nginx/sites-enabled/grc-fortress.conf | head -5")

print("Done.")
c.close()
