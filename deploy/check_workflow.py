import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=10)

def run(cmd):
    _, stdout, stderr = c.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out: print(out[:1500])
    if err: print("ERR:", err[:500])

print("=== Releases dir ===")
run("ls -la /home/mohnndd/apps/grc-fortress/releases/")
run("ls -la /home/mohnndd/apps/grc-fortress/backend/releases/ 2>/dev/null || echo 'no backend releases'")

print("\n=== Latest runner Worker log ===")
run("find /home/mohnndd/actions-runner/grc-fortress/_work -name '*.log' 2>/dev/null | sort | tail -1 | xargs tail -30 2>/dev/null")

print("\n=== Runner _work dir ===")
run("ls /home/mohnndd/actions-runner/grc-fortress/_work/ 2>/dev/null")
run("ls /home/mohnndd/actions-runner/grc-fortress/_work/GRCFortress/ 2>/dev/null")

print("\n=== Check if workflow ran (look for recent log) ===")
run("find /home/mohnndd/actions-runner/grc-fortress/_diag -name 'Worker_*.log' 2>/dev/null | sort | tail -3")
run("find /home/mohnndd/actions-runner/grc-fortress/_diag -name 'Worker_*.log' 2>/dev/null | sort | tail -1 | xargs grep -i 'error\\|fail\\|exception\\|maven\\|npm' 2>/dev/null | tail -30")

c.close()
