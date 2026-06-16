import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=10)

cmds = [
    "python3 -c \"import json; raw=open('/home/mohnndd/actions-runner/the_machine/.runner','rb').read(); raw=raw.lstrip(b'\\xef\\xbb\\xbf'); d=json.loads(raw); print('url:', d.get('gitHubUrl','')); print('name:', d.get('agentName',''))\"",
    "python3 -c \"import json; raw=open('/home/mohnndd/actions-runner/the_machine/.runner','rb').read(); raw=raw.lstrip(b'\\xef\\xbb\\xbf'); d=json.loads(raw); print(json.dumps(d, indent=2))\"",
]

for cmd in cmds:
    print(f"\n$ {cmd[:80]}...")
    _, stdout, stderr = c.exec_command(cmd)
    print(stdout.read().decode('utf-8', errors='replace').strip())
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if err: print("ERR:", err[:200])

c.close()
