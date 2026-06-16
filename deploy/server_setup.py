"""
One-time server setup for GRC Fortress.
Run this from your Windows machine: python deploy/server_setup.py
"""
import paramiko, getpass, sys

HOST = '192.168.100.225'
USER = 'mohnndd'
PASS = 'P@ssw0rd'

DB_NAME = 'grcfortress'
DB_USER = 'grcfortress'
DB_PASS = 'grcfortress'
APP_PORT = '8086'
JWT_SECRET = 'fecf1e3928210e84833bc952a17208d7467cd5d2e2824bf668de22e50051b6f8'
DOMAIN = 'grcfortress.rental-droop1.com'
DEPLOY_PATH = '/home/mohnndd/apps/grc-fortress'

SYSTEMD_SERVICE = f"""[Unit]
Description=GRC Fortress Backend
After=network.target postgresql.service

[Service]
Type=simple
User=mohnndd
WorkingDirectory={DEPLOY_PATH}
EnvironmentFile={DEPLOY_PATH}/backend.env
ExecStart=/usr/bin/java -jar {DEPLOY_PATH}/backend/current.jar
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
"""

NGINX_CONF = f"""server {{
    listen 80;
    listen [::]:80;
    server_name {DOMAIN};
    root {DEPLOY_PATH}/current;
    index index.html;

    location /api/ {{
        proxy_pass http://127.0.0.1:{APP_PORT};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }}

    location / {{
        try_files $uri $uri/ /index.html;
    }}
}}
"""

BACKEND_ENV = f"""SERVER_PORT={APP_PORT}
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/{DB_NAME}
SPRING_DATASOURCE_USERNAME={DB_USER}
SPRING_DATASOURCE_PASSWORD={DB_PASS}
JWT_SECRET={JWT_SECRET}
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
"""

SUDOERS_LINE = f"mohnndd ALL=(root) NOPASSWD: /usr/bin/systemctl restart grc-fortress-backend.service"

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS, timeout=10)

def run(cmd, sudo=False):
    if sudo:
        cmd = f"echo '{PASS}' | sudo -S bash -c {repr(cmd)}"
    _, stdout, stderr = c.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    exit_code = stdout.channel.recv_exit_status()
    if out:
        print(f"  OUT: {out[:500]}")
    if err and 'sudo' not in err.lower() and 'password' not in err.lower():
        print(f"  ERR: {err[:500]}")
    return exit_code == 0

print("=== Creating PostgreSQL database ===")
run(f"sudo -u postgres psql -tc \"SELECT 1 FROM pg_roles WHERE rolname='{DB_USER}'\" | grep -q 1 || sudo -u postgres psql -c \"CREATE USER {DB_USER} WITH PASSWORD '{DB_PASS}'\"", sudo=True)
run(f"sudo -u postgres psql -tc \"SELECT 1 FROM pg_database WHERE datname='{DB_NAME}'\" | grep -q 1 || sudo -u postgres createdb -O {DB_USER} {DB_NAME}", sudo=True)
print("  Done")

print("=== Creating app directory structure ===")
run(f"mkdir -p {DEPLOY_PATH}/releases {DEPLOY_PATH}/backend/releases")
print("  Done")

print("=== Writing backend.env ===")
sftp = c.open_sftp()
import io
sftp.putfo(io.BytesIO(BACKEND_ENV.encode()), f'{DEPLOY_PATH}/backend.env')
sftp.chmod(f'{DEPLOY_PATH}/backend.env', 0o600)
sftp.putfo(io.BytesIO(SYSTEMD_SERVICE.encode()), '/tmp/grc-fortress-backend.service')
sftp.putfo(io.BytesIO(NGINX_CONF.encode()), '/tmp/grc-fortress.conf')
sftp.putfo(io.BytesIO(SUDOERS_LINE.encode()), '/tmp/grc-fortress-sudoers')
sftp.close()
print("  Done")

print("=== Installing systemd service ===")
run("cp /tmp/grc-fortress-backend.service /etc/systemd/system/grc-fortress-backend.service", sudo=True)
run("systemctl daemon-reload", sudo=True)
run("systemctl enable grc-fortress-backend.service", sudo=True)
print("  Done")

print("=== Installing nginx config ===")
run("cp /tmp/grc-fortress.conf /etc/nginx/sites-enabled/grc-fortress.conf", sudo=True)
ok = run("nginx -t", sudo=True)
if ok:
    run("systemctl reload nginx", sudo=True)
    print("  Nginx reloaded")
else:
    print("  WARNING: nginx config test failed! Check /etc/nginx/sites-enabled/grc-fortress.conf")

print("=== Installing sudoers entry (passwordless systemctl restart) ===")
run(f"echo '{SUDOERS_LINE}' > /tmp/grc-fortress-sudoers && chmod 440 /tmp/grc-fortress-sudoers && mv /tmp/grc-fortress-sudoers /etc/sudoers.d/grc-fortress", sudo=True)
print("  Done")

print()
print("=== SETUP COMPLETE ===")
print(f"Domain:      https://{DOMAIN}  (add A record in Cloudflare → 192.168.100.225)")
print(f"App port:    {APP_PORT}")
print(f"DB:          postgresql://localhost:5432/{DB_NAME}")
print()
print("Next: push to main branch on GitHub to trigger the deployment workflow.")
print("Make sure the GitHub Actions runner is added to the GRC Fortress repo.")

c.close()
