import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8')

HOST = '192.168.100.225'
USER = 'mohnndd'
PASS = 'P@ssw0rd'

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS, timeout=10)

def run(cmd, timeout=120, show=True):
    _, stdout, stderr = c.exec_command(f"echo '{PASS}' | sudo -S bash -c {repr(cmd)}", timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    code = stdout.channel.recv_exit_status()
    if show and out: print(out[:2000])
    # filter sudo password prompt from stderr
    err_clean = '\n'.join(l for l in err.splitlines() if 'sudo' not in l.lower() and 'password' not in l.lower())
    if err_clean.strip(): print("ERR:", err_clean[:500])
    return code

print("=== Current PG version ===")
run("pg_lsclusters")

print("\n=== All databases ===")
run("sudo -u postgres psql -l")

print("\n=== Disk space ===")
run("df -h /")

print("\n=== Install PG 17 ===")
run("apt-get install -y postgresql-17 postgresql-17-pgvector 2>/dev/null || apt-get install -y postgresql-17", timeout=180)

print("\n=== PG clusters after install ===")
run("pg_lsclusters")

c.close()
