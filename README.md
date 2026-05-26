# ZlanScrim

Plateforme de tournois multi-jeux (style ZLAN). Inscriptions Discord, brackets single-élimination, gestion admin.

Déployée sur `scrim.mathisjacqueline.com` (Hetzner VPS, Caddy + systemd).
Auto-deploy via GitHub Actions sur push `main`.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- Prisma 7 + SQLite (driver `better-sqlite3`)
- Auth.js v5 (Discord OAuth, sessions DB)
- shadcn/ui (Base UI primitives) + Tailwind 4
- Caddy reverse proxy + systemd

## Développement local

```bash
# 1. installer
npm install

# 2. configurer .env.local
# - AUTH_SECRET déjà généré
# - créer une app Discord (https://discord.com/developers/applications)
#   → ajouter Redirect URL: http://localhost:3000/api/auth/callback/discord
#   → copier Client ID / Client Secret dans .env.local
# - copier votre Discord User ID dans ADMIN_DISCORD_ID

# 3. migrer la DB
npx prisma migrate dev

# 4. lancer
npm run dev
```

## Production (VPS)

Voir [`scripts/setup-vps.sh`](./scripts/setup-vps.sh) — bootstrap idempotent qui crée l'utilisateur, clone, installe, monte le service.

Déploiement auto via GitHub Actions sur push `main`.

## Routes principales

- `/` — Liste des tournois
- `/tournois/[id]` — Détail (signup public, vue complète pour participants)
- `/admin` — Dashboard admin (rôle ADMIN requis)
- `/admin/tournois/nouveau` — Créer un tournoi
- `/admin/tournois/[id]` — Gérer (inscriptions, équipes, bracket)
- `/profil` — Mes inscriptions
- `/connexion` — Sign-in Discord
