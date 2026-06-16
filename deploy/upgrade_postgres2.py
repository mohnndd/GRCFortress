import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=10)

def run(cmd, timeout=180, show=True):
    _, stdout, stderr = c.exec_command(f"echo 'P@ssw0rd' | sudo -S bash -c {repr(cmd)}", timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    code = stdout.channel.recv_exit_status()
    if show and out: print(out[:3000])
    err_lines = [l for l in err.splitlines() if 'sudo' not in l.lower() and '[sudo]' not in l]
    if err_lines: print("ERR:", '\n'.join(err_lines)[:500])
    return code

print("=== Add PostgreSQL official apt repo ===")
run("apt-get install -y curl ca-certificates")
run("install -d /usr/share/postgresql-common/pgdg")
run("curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc --fail https://www.postgresql.org/media/keys/ACCC4CF8.asc")
run("sh -c 'echo \"deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main\" > /etc/apt/sources.list.d/pgdg.list'")
run("apt-get update -q", timeout=60)

print("\n=== Install PostgreSQL 17 ===")
code = run("DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql-17", timeout=300)
print(f"Install exit code: {code}")

print("\n=== Clusters after install ===")
run("pg_lsclusters")

c.close()
