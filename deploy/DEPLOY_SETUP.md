# GRC Fortress — Deployment Setup

## What's already done on the server

- **Port**: 8086
- **Domain**: grcfortress.rental-droop1.com
- **PostgreSQL**: `grcfortress` DB + `grcfortress` user created
- **Systemd service**: `grc-fortress-backend.service` (installed, enabled, waiting for first JAR)
- **Nginx**: `/etc/nginx/sites-enabled/grc-fortress.conf` active, reload done
- **App dir**: `/home/mohnndd/apps/grc-fortress/`
- **backend.env**: written with correct DB/JWT/port settings

## Steps remaining

### 1. Add Cloudflare DNS record

In Cloudflare, add an A record:
- Name: `grcfortress`
- Value: `192.168.100.225`
- Proxy: On (orange cloud)

### 2. Create GitHub repo

Push this project to a new GitHub repo (e.g. `mohnndd/grc-fortress`).

### 3. Register a self-hosted runner for the GRC Fortress repo

SSH into the server:
```bash
ssh mohnndd@192.168.100.225
```

Create a new runner directory:
```bash
mkdir -p ~/actions-runner/grc-fortress && cd ~/actions-runner/grc-fortress
```

Download the runner (same version as existing):
```bash
curl -o actions-runner-linux-x64-2.322.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.322.0/actions-runner-linux-x64-2.322.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.322.0.tar.gz
```

Get the registration token from GitHub:
- Go to your GRC Fortress repo → Settings → Actions → Runners → New self-hosted runner
- Copy the token shown (starts with `A...`)

Configure the runner:
```bash
./config.sh --url https://github.com/mohnndd/grc-fortress --token <YOUR_TOKEN> --name grc-fortress-runner --labels self-hosted,linux,x64,the-machine --unattended
```

Install and start as a service:
```bash
sudo ./svc.sh install mohnndd
sudo ./svc.sh start
```

Verify it appears as "Idle" in GitHub → Settings → Actions → Runners.

### 4. Push to main

```bash
git add .
git commit -m "Initial deployment setup"
git push origin main
```

The GitHub Actions workflow (`.github/workflows/deploy.yml`) will:
1. Build the React frontend with Vite (API base URL set to empty — same-origin via nginx)
2. Build the Spring Boot JAR
3. Copy artifacts to `/home/mohnndd/apps/grc-fortress/releases/{sha}/`
4. Restart `grc-fortress-backend.service`
5. Switch nginx root to the new frontend build

## Default credentials (first login)

- Username: `admin`
- Password: `Admin@GRC2025` (set in backend.env as `DEFAULT_ADMIN_PASSWORD`)

## Environment variables summary (backend.env)

| Variable | Value |
|---|---|
| SERVER_PORT | 8086 |
| DB_NAME | grcfortress |
| DB_USERNAME | grcfortress |
| DB_PASSWORD | grcfortress |
| MFA_BYPASS_ENABLED | false |
| COMPANY_EMAIL_DOMAIN | company.local (change to your domain) |
