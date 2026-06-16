import paramiko, sys

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=10)

cmds = [
    "java -version 2>&1",
    "node --version && npm --version",
    "ss -tlnp | grep '808'",
    "ls /etc/systemd/system/ | grep -E '(fleet|reef|grc)'",
    "cat /etc/systemd/system/reefperfumes.service 2>/dev/null",
    "ls /home/mohnndd/apps/reefperfumes/",
    "ls /home/mohnndd/actions-runner/the_machine/ | head -20",
    "cat /home/mohnndd/apps/fleetcore360/start.sh 2>/dev/null || ls /home/mohnndd/apps/fleetcore360/",
]

for cmd in cmds:
    print(f"\n{'='*60}\n$ {cmd}\n{'='*60}")
    _, stdout, stderr = c.exec_command(cmd)
    print(stdout.read().decode())
    err = stderr.read().decode()
    if err.strip():
        print("STDERR:", err[:300])

c.close()
