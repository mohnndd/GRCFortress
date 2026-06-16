import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=10)

def run(cmd):
    _, stdout, stderr = c.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    if out: print(out[:3000])

# Try to find the actual stdout/stderr from the failed build step
print("=== Step logs (blocks dir) ===")
run("ls -lt /home/mohnndd/actions-runner/grc-fortress/_diag/blocks/ 2>/dev/null | head -10")

print("\n=== Latest block content (failed step output) ===")
run("ls -t /home/mohnndd/actions-runner/grc-fortress/_diag/blocks/*.1 2>/dev/null | head -5 | xargs -I{} sh -c 'echo \"--- {} ---\"; tail -60 {}'")

# Also try running maven manually to see what error we get
print("\n=== Try manual mvn package ===")
run("cd /home/mohnndd/actions-runner/grc-fortress/_work/GRCFortress/GRCFortress/backend && ./mvnw -B -DskipTests package 2>&1 | tail -40")

c.close()
