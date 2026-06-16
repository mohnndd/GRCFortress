import paramiko, sys

sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=10)

cmds = [
    "cat /home/mohnndd/actions-runner/the_machine/.runner | python3 -c \"import sys,json; d=json.load(sys.stdin); print('gitHubUrl:', d.get('gitHubUrl','')); print('workFolder:', d.get('workFolder',''))\" 2>/dev/null",
    "find /home/mohnndd/actions-runner/the_machine/_work -name 'deploy.yml' 2>/dev/null | head -5",
    "ls /home/mohnndd/actions-runner/the_machine/_work/the_machine/the_machine/.github/workflows/ 2>/dev/null",
    "cat /home/mohnndd/actions-runner/the_machine/_work/the_machine/the_machine/.github/workflows/deploy.yml 2>/dev/null | head -80",
    "ss -tlnp | grep 8086 || echo 'port 8086 is free'",
    "systemctl is-active postgresql 2>/dev/null || echo 'postgresql not active'",
]

for cmd in cmds:
    print(f"\n{'='*60}\n$ {cmd}\n{'='*60}")
    _, stdout, stderr = c.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='replace'))
    err = stderr.read().decode('utf-8', errors='replace')
    if err.strip():
        print("STDERR:", err[:300])

c.close()
