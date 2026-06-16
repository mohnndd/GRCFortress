import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=10)

def run(cmd):
    _, stdout, stderr = c.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    code = stdout.channel.recv_exit_status()
    print(f"exit={code}")
    if out: print(out)
    if err: print("ERR:", err[:300])

print("=== Test exact workflow command (no TTY, no password) ===")
run("sudo /usr/bin/systemctl restart grc-fortress-backend.service")

print("\n=== Check service after restart ===")
run("systemctl is-active grc-fortress-backend.service")

c.close()
