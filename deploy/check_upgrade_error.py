import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=10)

def run(cmd, timeout=60):
    _, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out: print(out[:3000])
    if err: print("ERR:", err[:1000])

# Run upgrade with full output captured (not via sudo wrapper to see stderr)
print("=== Run pg_upgradecluster with full output ===")
_, stdout, stderr = c.exec_command(
    "echo 'P@ssw0rd' | sudo -S pg_upgradecluster 16 main 2>&1",
    timeout=300
)
out = stdout.read().decode('utf-8', errors='replace')
err = stderr.read().decode('utf-8', errors='replace')
combined = out + err
# filter sudo lines
for line in combined.splitlines():
    if 'sudo' not in line.lower() and '[sudo]' not in line:
        print(line)

c.close()
