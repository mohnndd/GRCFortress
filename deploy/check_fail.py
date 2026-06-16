import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=10)

def run(cmd):
    _, stdout, stderr = c.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out: print(out[:2000])
    if err: print("ERR:", err[:300])

print("=== All Worker logs ===")
run("ls -lt /home/mohnndd/actions-runner/grc-fortress/_diag/Worker_*.log 2>/dev/null")

print("\n=== Latest full Worker log ===")
run("cat $(ls -t /home/mohnndd/actions-runner/grc-fortress/_diag/Worker_*.log 2>/dev/null | head -1) | grep -E 'error|Error|fail|Fail|FAIL|exception|Exception|npm|mvn|Build' | tail -50")

print("\n=== _work GRCFortress contents ===")
run("ls /home/mohnndd/actions-runner/grc-fortress/_work/GRCFortress/GRCFortress/ 2>/dev/null | head -20")

print("\n=== Check mvnw exists ===")
run("ls /home/mohnndd/actions-runner/grc-fortress/_work/GRCFortress/GRCFortress/backend/ 2>/dev/null | head -10")

c.close()
