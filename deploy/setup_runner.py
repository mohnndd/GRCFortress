import paramiko, sys, time
sys.stdout.reconfigure(encoding='utf-8')

HOST = '192.168.100.225'
USER = 'mohnndd'
PASS = 'P@ssw0rd'
RUNNER_TOKEN = 'AJTJP3QZQW43HBCVW5MZHFDKGCXI2'
RUNNER_DIR = '/home/mohnndd/actions-runner/grc-fortress'

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PASS, timeout=30)

def run(cmd, timeout=120):
    print(f"$ {cmd[:100]}")
    _, stdout, stderr = c.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    code = stdout.channel.recv_exit_status()
    if out: print(f"  {out[:500]}")
    if err and 'sudo' not in err.lower() and '[sudo]' not in err: print(f"  ERR: {err[:300]}")
    return code

# Get existing runner version
print("=== Getting runner version ===")
run("ls /home/mohnndd/actions-runner/the_machine/bin/Runner.Listener 2>/dev/null && /home/mohnndd/actions-runner/the_machine/bin/Runner.Listener --version 2>/dev/null || echo '2.322.0'")
_, stdout, _ = c.exec_command("ls /home/mohnndd/actions-runner/the_machine/*.tar.gz 2>/dev/null | head -1 || echo 'notfound'")
tarfile = stdout.read().decode().strip()
print(f"  existing tarball: {tarfile}")

print("\n=== Creating runner directory ===")
run(f"mkdir -p {RUNNER_DIR}")

print("\n=== Copying runner binary from existing installation ===")
run(f"cp -a /home/mohnndd/actions-runner/the_machine/. {RUNNER_DIR}/")
# Remove old configuration
run(f"rm -f {RUNNER_DIR}/.runner {RUNNER_DIR}/.credentials {RUNNER_DIR}/.credentials_rsaparams {RUNNER_DIR}/.service")

print("\n=== Configuring runner for GRCFortress repo ===")
code = run(
    f"cd {RUNNER_DIR} && ./config.sh "
    f"--url https://github.com/mohnndd/GRCFortress "
    f"--token {RUNNER_TOKEN} "
    f"--name grc-fortress-runner "
    f"--labels self-hosted,linux,x64,the-machine "
    f"--unattended",
    timeout=60
)

if code != 0:
    print("  Config failed, trying download approach...")
    run(f"cd {RUNNER_DIR} && curl -o runner.tar.gz -L https://github.com/actions/runner/releases/download/v2.322.0/actions-runner-linux-x64-2.322.0.tar.gz 2>/dev/null && tar xzf runner.tar.gz", timeout=120)
    run(
        f"cd {RUNNER_DIR} && ./config.sh "
        f"--url https://github.com/mohnndd/GRCFortress "
        f"--token {RUNNER_TOKEN} "
        f"--name grc-fortress-runner "
        f"--labels self-hosted,linux,x64,the-machine "
        f"--unattended",
        timeout=60
    )

print("\n=== Installing as systemd service ===")
run(f"cd {RUNNER_DIR} && echo '{PASS}' | sudo -S ./svc.sh install mohnndd", timeout=30)
run(f"cd {RUNNER_DIR} && echo '{PASS}' | sudo -S ./svc.sh start", timeout=30)

print("\n=== Verifying ===")
run(f"echo '{PASS}' | sudo -S systemctl status actions.runner.mohnndd-GRCFortress.grc-fortress-runner.service 2>/dev/null | head -8")
run(f"ls {RUNNER_DIR}/.runner 2>/dev/null && echo 'runner configured' || echo 'runner NOT configured'")

print("\nDone. Check GitHub → GRCFortress → Settings → Actions → Runners to confirm 'Idle' status.")
c.close()
