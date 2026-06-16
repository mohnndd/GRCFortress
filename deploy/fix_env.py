import paramiko, io, sys
sys.stdout.reconfigure(encoding='utf-8')

HOST = '192.168.100.225'
USER = 'mohnndd'
PASS = 'P@ssw0rd'

BACKEND_ENV = """SERVER_PORT=8086
DB_HOST=localhost
DB_PORT=5432
DB_NAME=grcfortress
DB_USERNAME=grcfortress
DB_PASSWORD=grcfortress
JWT_SECRET=fecf1e3928210e84833bc952a17208d7467cd5d2e2824bf668de22e50051b6f8
MFA_BYPASS_ENABLED=false
DEFAULT_ADMIN_PASSWORD=Admin@GRC2025
COMPANY_EMAIL_DOMAIN=company.local
"""

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS, timeout=10)

sftp = c.open_sftp()
sftp.putfo(io.BytesIO(BACKEND_ENV.encode()), '/home/mohnndd/apps/grc-fortress/backend.env')
sftp.chmod('/home/mohnndd/apps/grc-fortress/backend.env', 0o600)
sftp.close()

print("backend.env updated")
print("Contents:")
_, stdout, _ = c.exec_command('cat /home/mohnndd/apps/grc-fortress/backend.env')
print(stdout.read().decode())
c.close()
