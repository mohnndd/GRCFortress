import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=10)

cmds = [
    "cat /etc/systemd/system/reefperfumes-backend.service",
    "cat /home/mohnndd/apps/reefperfumes/docker-compose.yml",
    "cat /home/mohnndd/apps/reefperfumes/backend.env",
    "ls /home/mohnndd/actions-runner/the_machine/_work/ 2>/dev/null",
    "find /home/mohnndd/actions-runner/the_machine/_work -name '*.yml' 2>/dev/null | head -5",
    "cat /etc/nginx/sites-enabled/reefperfumes.conf 2>/dev/null || ls /etc/nginx/sites-enabled/",
    "cat /etc/nginx/sites-enabled/reefperfumes*",
]

for cmd in cmds:
    print(f"\n{'='*60}\n$ {cmd}\n{'='*60}")
    _, stdout, stderr = c.exec_command(cmd)
    print(stdout.read().decode())
    err = stderr.read().decode()
    if err.strip():
        print("STDERR:", err[:300])

c.close()
