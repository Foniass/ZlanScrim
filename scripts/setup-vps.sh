#!/usr/bin/env bash
# Bootstrap ZlanScrim on the Hetzner VPS. Idempotent — re-runnable safely.
# Run as root on the VPS: bash setup-vps.sh
set -euo pipefail

APP=zlanscrim
APP_USER=zlanscrim
APP_DIR=/opt/${APP}
DATA_DIR=/var/lib/${APP}
ETC_DIR=/etc/${APP}
DOMAIN=scrim.mathisjacqueline.com
REPO=git@github.com:Foniass/ZlanScrim.git
NODE_MAJOR=22

if [[ $EUID -ne 0 ]]; then
  echo "Run as root." >&2
  exit 1
fi

echo "==> 1/9 System packages"
apt-get update -qq
apt-get install -y -qq curl ca-certificates gnupg git ufw build-essential debian-keyring debian-archive-keyring apt-transport-https

echo "==> 2/9 Node.js ${NODE_MAJOR} LTS (NodeSource)"
if ! command -v node >/dev/null || [[ "$(node --version)" != v${NODE_MAJOR}* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash -
  apt-get install -y -qq nodejs
fi
node --version

echo "==> 3/9 Caddy (web server)"
if ! command -v caddy >/dev/null; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -qq
  apt-get install -y -qq caddy
fi

echo "==> 4/9 App user + directories"
id -u ${APP_USER} >/dev/null 2>&1 || useradd --system --create-home --shell /bin/bash ${APP_USER}
mkdir -p ${APP_DIR} ${DATA_DIR} ${ETC_DIR}
chown -R ${APP_USER}:${APP_USER} ${APP_DIR} ${DATA_DIR}
chown root:${APP_USER} ${ETC_DIR}
chmod 750 ${ETC_DIR}

echo "==> 5/9 SSH deploy key for GitHub Actions"
# A dedicated ed25519 key the deploy workflow uses to SSH back into the VPS.
KEY_FILE=/home/${APP_USER}/.ssh/id_ed25519
sudo -u ${APP_USER} mkdir -p /home/${APP_USER}/.ssh
sudo -u ${APP_USER} chmod 700 /home/${APP_USER}/.ssh
if [[ ! -f ${KEY_FILE} ]]; then
  sudo -u ${APP_USER} ssh-keygen -t ed25519 -N "" -f ${KEY_FILE} -C "deploy@${APP}"
fi
# Authorize the deploy key on this same VPS (lets GitHub Actions SSH back in).
# Use sudo -u with bash -c so the >> redirect runs as the app user, not root.
PUB=$(cat ${KEY_FILE}.pub)
sudo -u ${APP_USER} bash -c "
  touch /home/${APP_USER}/.ssh/authorized_keys
  chmod 600 /home/${APP_USER}/.ssh/authorized_keys
  grep -qxF '${PUB}' /home/${APP_USER}/.ssh/authorized_keys || echo '${PUB}' >> /home/${APP_USER}/.ssh/authorized_keys
"
# Fix ownership in case a previous (buggy) run left root-owned files.
chown -R ${APP_USER}:${APP_USER} /home/${APP_USER}/.ssh
# Ensure github.com host key trusted so `git clone` doesn't prompt.
sudo -u ${APP_USER} bash -c "ssh-keyscan -t rsa,ecdsa,ed25519 github.com 2>/dev/null >> /home/${APP_USER}/.ssh/known_hosts"
sudo -u ${APP_USER} sort -u /home/${APP_USER}/.ssh/known_hosts -o /home/${APP_USER}/.ssh/known_hosts

echo "==> 6/9 Restricted sudo for systemctl restart"
SUDO_FILE=/etc/sudoers.d/${APP}
echo "${APP_USER} ALL=(root) NOPASSWD: /bin/systemctl restart ${APP}, /bin/systemctl reload caddy" > ${SUDO_FILE}
chmod 440 ${SUDO_FILE}

echo "==> 7/9 Clone or update repo"
if [[ ! -d ${APP_DIR}/.git ]]; then
  echo "Repo not yet cloned. Add this deploy key to the GitHub repo first, then re-run this script:"
  echo "----- deploy public key (zlanscrim@$(hostname)) -----"
  cat ${KEY_FILE}.pub
  echo "------------------------------------------------------"
  echo "Add it at:  https://github.com/Foniass/ZlanScrim/settings/keys/new"
  echo "Then re-run this script to clone."
  # Fall through but skip remaining steps.
  if [[ "${1:-}" != "--force-continue" ]]; then
    exit 0
  fi
fi

if [[ ! -d ${APP_DIR}/.git ]]; then
  sudo -u ${APP_USER} git clone ${REPO} ${APP_DIR}
else
  sudo -u ${APP_USER} git -C ${APP_DIR} fetch --quiet
  sudo -u ${APP_USER} git -C ${APP_DIR} reset --hard origin/main --quiet
fi

echo "==> 8/9 Install deps, run migrations, build"
sudo -u ${APP_USER} bash -c "cd ${APP_DIR} && npm ci"
# Production DATABASE_URL points to the persistent data dir owned by app user.
if [[ ! -f ${ETC_DIR}/.env ]]; then
  AUTH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
  cat > ${ETC_DIR}/.env <<EOF
# ZlanScrim production env. Owned by root:${APP_USER}, mode 640.
DATABASE_URL="file:${DATA_DIR}/zlanscrim.db"
AUTH_SECRET="${AUTH_SECRET}"
AUTH_TRUST_HOST="true"
AUTH_URL="https://${DOMAIN}"
# Fill these in before the first sign-in attempt:
AUTH_DISCORD_ID=""
AUTH_DISCORD_SECRET=""
ADMIN_DISCORD_ID=""
EOF
  chown root:${APP_USER} ${ETC_DIR}/.env
  chmod 640 ${ETC_DIR}/.env
  echo "Created ${ETC_DIR}/.env — fill in AUTH_DISCORD_ID / AUTH_DISCORD_SECRET / ADMIN_DISCORD_ID before signing in."
fi
sudo -u ${APP_USER} bash -c "set -a && source ${ETC_DIR}/.env && set +a && cd ${APP_DIR} && npx prisma migrate deploy && npx prisma generate && npm run build"

echo "==> 9/9 systemd unit + Caddy config"
install -m 644 ${APP_DIR}/systemd/zlanscrim.service /etc/systemd/system/${APP}.service

# Append Caddyfile snippet if not already present.
CADDY_SNIPPET=${APP_DIR}/systemd/Caddyfile
if ! grep -q "${DOMAIN}" /etc/caddy/Caddyfile 2>/dev/null; then
  cat ${CADDY_SNIPPET} >> /etc/caddy/Caddyfile
fi

systemctl daemon-reload
systemctl enable --now ${APP}
systemctl restart caddy

echo ""
echo "✓ Setup complete."
echo "  - App:    systemctl status ${APP}"
echo "  - Logs:   journalctl -u ${APP} -f"
echo "  - Edit:   ${ETC_DIR}/.env  (then: systemctl restart ${APP})"
echo "  - URL:    https://${DOMAIN}"
echo ""
echo "If you haven't already, add this VPS deploy key as a Github Actions secret"
echo "named SSH_PRIVATE_KEY (and SSH_KNOWN_HOSTS) so the workflow can ssh in:"
echo "  cat ${KEY_FILE}      # → paste into Github > Settings > Secrets > Actions > SSH_PRIVATE_KEY"
echo "  ssh-keyscan ${DOMAIN} > known_hosts # use VPS IP if DNS isn't live yet"
