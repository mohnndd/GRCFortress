import paramiko, sys, io, time
sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=10)

def run(cmd, timeout=300):
    _, stdout, stderr = c.exec_command(f"echo 'P@ssw0rd' | sudo -S bash -c {repr(cmd)}", timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    code = stdout.channel.recv_exit_status()
    if out: print(out[:2000])
    err_lines = [l for l in err.splitlines() if 'sudo' not in l.lower() and '[sudo]' not in l and 'password' not in l.lower()]
    if err_lines: print("ERR:", '\n'.join(err_lines)[:300])
    return code

# Write the pgdg source file directly via sftp (avoids all shell quoting issues)
pgdg_list = b"deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt noble-pgdg main\n"

sftp = c.open_sftp()
sftp.putfo(io.BytesIO(pgdg_list), '/tmp/pgdg.list')
sftp.close()

print("=== Installing pgdg repo ===")
run("install -d /usr/share/postgresql-common/pgdg")
run("curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc")
run("cp /tmp/pgdg.list /etc/apt/sources.list.d/pgdg.list")
run("cat /etc/apt/sources.list.d/pgdg.list")

print("\n=== apt-get update ===")
run("apt-get update -q", timeout=60)

print("\n=== Install postgresql-17 ===")
code = run("DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql-17", timeout=300)
print(f"exit code: {code}")

print("\n=== Clusters ===")
run("pg_lsclusters")

c.close()
