import paramiko, sys, io
sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=10)

def run(cmd):
    _, stdout, stderr = c.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out: print(out)
    if err: print("ERR:", err[:300])

print("=== Current sudoers.d/grc-fortress ===")
run("echo 'P@ssw0rd' | sudo -S cat /etc/sudoers.d/grc-fortress 2>/dev/null || echo 'FILE NOT FOUND'")

print("\n=== Writing correct sudoers entry ===")
SUDOERS = "mohnndd ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart grc-fortress-backend.service\n"
sftp = c.open_sftp()
sftp.putfo(io.BytesIO(SUDOERS.encode()), '/tmp/grc-fortress-sudoers')
sftp.close()

run("echo 'P@ssw0rd' | sudo -S cp /tmp/grc-fortress-sudoers /etc/sudoers.d/grc-fortress")
run("echo 'P@ssw0rd' | sudo -S chmod 440 /etc/sudoers.d/grc-fortress")
run("echo 'P@ssw0rd' | sudo -S visudo -c -f /etc/sudoers.d/grc-fortress")

print("\n=== Test passwordless sudo ===")
run("sudo systemctl status grc-fortress-backend.service | head -3")

c.close()
