import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=10)

# Check runner registration
cmds = [
    "python3 -c \"import json; d=json.load(open('/home/mohnndd/actions-runner/the_machine/.runner')); print('url:', d.get('gitHubUrl','')); print('name:', d.get('agentName',''))\"",
    "cat /home/mohnndd/actions-runner/the_machine/.credentials | python3 -c \"import json,sys; d=json.load(sys.stdin); print(list(d.keys()))\" 2>/dev/null",
    "ls /home/mohnndd/actions-runner/",
    # Check if there are multiple runner dirs
]

for cmd in cmds:
    print(f"\n$ {cmd}")
    _, stdout, stderr = c.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='replace').strip())

c.close()
