import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('192.168.100.225', username='mohnndd', password='P@ssw0rd', timeout=300)

def run(cmd, timeout=240):
    _, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out: print(out[:3000])
    if err: print("ERR:", err[:500])
    return stdout.channel.recv_exit_status()

WORK = "/home/mohnndd/actions-runner/grc-fortress/_work/GRCFortress/GRCFortress"

print("=== Fix mvnw permission ===")
run(f"chmod +x {WORK}/backend/mvnw")

print("\n=== Run Maven build ===")
code = run(f"cd {WORK}/backend && ./mvnw -B -DskipTests package 2>&1 | tail -50", timeout=240)
print(f"Exit code: {code}")

if code == 0:
    print("\n=== Build succeeded! Deploying manually ===")
    SHA = "manual-deploy"
    DEPLOY = "/home/mohnndd/apps/grc-fortress"

    run(f"mkdir -p {DEPLOY}/releases/{SHA} {DEPLOY}/backend/releases/{SHA}")

    # Build frontend too
    print("\n=== Build frontend ===")
    run(f"cd {WORK}/frontend && npm ci 2>&1 | tail -5")
    run(f"cd {WORK}/frontend && VITE_API_BASE_URL='' npm run build 2>&1 | tail -10")

    print("\n=== Copy artifacts ===")
    run(f"cp -a {WORK}/frontend/dist/. {DEPLOY}/releases/{SHA}/")
    run(f"cp {WORK}/backend/target/backend-*.jar {DEPLOY}/backend/releases/{SHA}/backend.jar")
    run(f"ln -sfn {DEPLOY}/backend/releases/{SHA}/backend.jar {DEPLOY}/backend/current.jar")
    run(f"chmod -R a+rX {DEPLOY}/releases/{SHA} {DEPLOY}/backend/releases/{SHA}")

    print("\n=== Start backend service ===")
    run(f"echo 'P@ssw0rd' | sudo -S systemctl restart grc-fortress-backend.service")
    import time; time.sleep(8)
    run(f"echo 'P@ssw0rd' | sudo -S systemctl status grc-fortress-backend.service | head -8")

    print("\n=== Switch nginx to new frontend ===")
    run(f"ln -sfn {DEPLOY}/releases/{SHA} {DEPLOY}/current")
    run(f"ls {DEPLOY}/current | head -5")
    run(f"ss -tlnp | grep 8086")
else:
    print("\nBuild failed. Check error above.")

c.close()
