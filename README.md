# With You — Documentation Technique & Architecture Complète

Plateforme SaaS B2B et vitrine interactive 3D dédiée à la simplification numérique des TPE et PME (**création de sites web sur mesure, automatisation de processus et déploiement d'assistants IA supervisés**).

- **URL de production :** `https://with-you.store/`
- **Hébergement Frontend :** Netlify (déploiement continu, en-têtes CSP & HSTS stricts)
- **Backend & Base de données :** Supabase (PostgreSQL, Auth OTP + 2FA TOTP AAL2, Storage, Realtime, Edge Functions)
- **Transactionnel E-mail :** Resend (`contact@with-you.store`)

---

## 1. Arborescence du Projet

> **Note de nettoyage :** Les anciens fichiers `contact.html` (formulaire `mailto:` non fonctionnel) et `.readme.md` (obsolète) doivent être supprimés. La route `/contact` est désormais redirigée automatiquement vers `/#demande` via `_redirects`.

```text
/ (Racine du projet)
├── index.html                      # Vitrine 3D WebGL (Monogramme "Wy" + Dalle verre + Formulaire Supabase)
├── connexion.html                  # Portail Auth (Inscription, Connexion, OTP 6 chiffres, Mot de passe oublié)
├── reset-password.html             # Réinitialisation du mot de passe (flux PASSWORD_RECOVERY)
├── dashboard.html                  # Espace Client (KPI, Demandes, Agents IA, Automatisations, Conversations, 2FA)
├── admin.html                      # Centre de Contrôle Admin (10 modules, RBAC, Sandbox IA Overlay, Audit, RGPD)
├── creation-site-web.html          # Page service SEO : Création de sites web vitrines & portfolios
├── automatisation-ia.html          # Page service SEO : Automatisation & Assistants IA sur mesure
├── mentions-legales.html           # Page légale (Bandeau sombre + Carte de lecture claire)
├── cgv-cgu.html                    # Conditions Générales de Vente et d'Utilisation
├── politique-confidentialite.html  # Politique de Confidentialité & RGPD
├── _headers                        # Politique de sécurité HTTP (CSP, HSTS, COOP, Cache-Control)
├── _redirects                      # Redirections 301 (/contact -> /#demande) et réécritures d'URLs propres
├── sitemap.xml                     # Plan du site SEO pour les moteurs de recherche
├── robots.txt                      # Directives d'indexation
├── README-COMPLET.md               # Documentation technique de référence
│
├── .well-known/
│   └── security.txt                # Contact de sécurité conforme RFC 9116
│
├── SVG/
│   ├── fav.png                     # Icône carrée "WY" (512x512)
│   ├── favico.ico                  # Favicon navigateur
│   ├── logo.png                    # Logo historique
│   ├── logo-light.png              # Logo "With" blanc & "YOU" vert menthe (utilisé sur les en-têtes sombres)
│   └── logo-bright.png             # Logo vert lumineux (utilisé pour OpenGraph / partages sociaux)
│
└── assets/
    ├── css/
    │   └── wy-tokens.css           # Design System partagé (variables, @font-face, composants verre & cartes légales)
    ├── js/
    │   └── wy-config.js            # Configuration publique centralisée (Supabase URL/Anon Key, Turnstile, nettoyage)
    └── fonts/
        ├── space-grotesk-400.woff2 # Police locale Space Grotesk Regular (RGPD & CSP)
        ├── space-grotesk-400.ttf
        ├── space-grotesk-500.woff2 # Police locale Space Grotesk Medium
        ├── space-grotesk-500.ttf
        ├── space-grotesk-700.woff2 # Police locale Space Grotesk Bold
        └── space-grotesk-700.ttf
```

---

## 2. Design System « Dark Emerald Liquid Glass »

L'ensemble des pages partage une identité visuelle unique définie dans `assets/css/wy-tokens.css` :

1. **Typographie unique auto-hébergée :** `Space Grotesk` (graisses 400, 500, 700) chargée localement depuis `/assets/fonts/` pour éviter toute requête vers les serveurs Google Fonts (conformité RGPD et rapidité LCP).
2. **Palette de couleurs :**
   - Fond optique profond : `#03180C` et `#042211` avec halos radiaux émeraude et grille optique subtile.
   - Surface en verre (`.glass`, `.glass-card`) : `rgba(4, 28, 15, 0.74)` avec `backdrop-filter: blur(26px) saturate(180%)` et bordure spéculaire `rgba(134, 239, 172, 0.34)`.
   - Textes à haut contraste (conformes WCAG 2.2 AA) : `#FFFFFF` (titres), `#F0FDF4` (texte principal), `#A7F3D0` (texte secondaire).
   - Accents & Actions : `#4ADE80` (focus clavier `:focus-visible` et indicateurs actifs), `#16A34A` → `#15803D` (boutons primaires).
3. **Pages de lecture longue (`mentions-legales.html`, `cgv-cgu.html`, `politique-confidentialite.html`) :**
   - Conservant l'en-tête et le pied de page en verre sombre, elles affichent le corps du texte juridique dans une carte claire `.legal-reader-card` (`#FFFFFF`, texte `#1F2A24`) pour offrir un confort de lecture optimal.
4. **Moteur 3D WebGL (`index.html`) :**
   - Propulsé par `Three.js r160` et `SVGLoader`.
   - Extrude en 3D les **4 éléments identitaires** du logo *With You* : le grand **« W »** manuscrit, le **« y »** manuscrit en haut à droite, **l'arc orbital** et **la sphère satellite**.
   - Shader physique sur mesure avec **triple réfraction chromatique RVB** (`onBeforeCompile` sur `#include <transmission_fragment>`).
   - Au chapitre 05 (`#demande`), une **grande dalle en verre vert clair pleine largeur** (`contactSlabMesh`) s'anime en fondu au-dessus du monogramme 3D et en dessous des textes et champs du formulaire.

---

## 3. Architecture de la Base de Données Supabase (25 Tables)

Le schéma PostgreSQL (`public`) est structuré autour du multi-tenant par entreprise (`organizations`) avec sécurité par ligne (**RLS — Row-Level Security**) :

### A. Utilisateurs, Entreprises & Contrôle d'Accès (RBAC)
1. `public.profiles` : Profil étendu lié à `auth.users` (`id`, `nom_prenom`, `first_name`, `last_name`, `email`, `phone`, `entreprise`, `role` client/admin, `admin_role` super_admin/admin/tech_lead/support, `is_suspended`, préférences d'alertes `notify_errors`, `notify_automations`, `notify_pause`).
2. `public.organizations` : Fiche entreprise cliente (`id`, `name`, `legal_name`, `manager_name`, `logo_url`, `contact_email`, `phone`, `address`, `status` active/suspended/onboarding/archived, `suspension_reason`, `plan_name`, `contract_start_date`, `notes`).
3. `public.organization_members` : Table de liaison entre `organizations` et `auth.users` avec rôle par entreprise (`owner`, `admin`, `member`).
4. `public.user_invitations` : Invitations envoyées par l'administrateur pour rejoindre une entreprise ou l'équipe (`email`, `organization_id`, `org_role`, `admin_role`, `token`, `status`, `expires_at`).
5. `public.admin_role_permissions` : Matrice des permissions granulaires associées à chaque `admin_role` (`orgs.read`, `users.roles`, `agents.secrets`, `audit.read`, etc.).

### B. Catalogue Agents IA, Secrets, Versions & Conversations
6. `public.ai_agents` : Agents IA déployés chez les clients (`id`, `organization_id`, `name`, `description`, `category`, `function_desc`, `status` Actif/En pause/En erreur/En configuration, `provider`, `allow_client_toggle`, `interactions_count`, `estimated_minutes_per_interaction`, `connection_status`, `rate_limit_per_day`, `avg_latency_ms`, `total_tokens_used`).
7. `public.ai_agent_secrets` : Table isolée (jamais exposée aux clients) stockant `system_prompt`, `model_name`, `temperature`, `max_tokens`, `custom_api_key` (BYOK) et `custom_base_url`.
8. `public.agent_versions` : Historique complet de versionning des agents IA avec snapshot JSONB permettant la restauration (Rollback) en un clic depuis `admin.html`.
9. `public.conversations` : Fils de conversations traités par les agents IA (`organization_id`, `agent_id`, `contact_name`, `contact_reference`, `status` En cours/Terminée/Intervention requise/Archivée, `last_message_preview`).

### C. Automatisations & Historique d'Exécutions
10. `public.automations` : Scénarios automatisés (`organization_id`, `linked_agent_id`, `name`, `description`, `workflow_summary`, `status`, `allow_client_toggle`, `trigger_type`, `schedule_cron`, `webhook_url`, `executions_count`, `success_count`, `failure_count`, `estimated_minutes_per_run`).
11. `public.automation_runs` : Journal détaillé de chaque exécution d'automatisation (`automation_id`, `organization_id`, `status` success/failure, `error_message`, `duration_ms`, `started_at`, `finished_at`).

### D. Demandes Clients, Messagerie Support & Prospects
12. `public.prospects` : Demandes issues du formulaire public `#request-form` de `index.html` (`nom`, `email`, `entreprise`, `secteur`, `besoins`, `outils`, `echeance`, `description`, `consent`, `consent_at`, `ip_hash`, `statut`).
13. `public.client_requests` : Dossiers d'accompagnement et tickets support rattachés à un client (`user_id`, `organization_id`, `description`, `statut` en 5 étapes de projet, `support_status`, `priority`, `internal_notes`).
14. `public.messages` : Table unifiée des messages (support client via `request_id` ET échanges IA/opérateur via `conversation_id`, avec `sender_type` et horodatage d'alerte e-mail `notified_at`).
15. `public.admin_notes` : Notes internes additionnelles sur les demandes (`request_id`, `notes`).

### E. Supervision, Facturation, Audit Immuable & RGPD
16. `public.activity_logs` : Journal d'activité temps réel visible par le client et l'admin (`event_type`, `title`, `description`, `status`).
17. `public.incidents` : Déclaration et suivi des incidents techniques (`title`, `severity`, `status`, `organization_id`, `resolution_notes`).
18. `public.integration_configs` : Référentiel des connecteurs externes et noms des variables d'environnement associées (`secret_env_key`, `connection_status`).
19. `public.billing_plans` : Catalogue des offres commerciales (`Essentiel TPE`, `Croissance PME`, `Sur Mesure`).
20. `public.subscriptions` : Abonnements actifs par entreprise (`organization_id`, `plan_name`, `amount_cents`, `status`).
21. `public.invoices` : Historique de facturation des entreprises.
22. `public.admin_notifications` : Centre d'alertes de la console d'administration.
23. `public.audit_logs` : Journal d'audit immuable traçant toutes les actions sensibles des administrateurs (avec motif obligatoire sur les suspensions).
24. `public.gdpr_requests` : Registre de suivi des demandes d'exercice de droits RGPD (accès, rectification, export, droit à l'oubli).
25. `public.platform_settings` : Paramètres globaux clé/valeur de la plateforme.

### F. Supabase Storage
- **Bucket `org-logos` :** Stocke les logos uploadés par les entreprises clientes depuis l'onglet Paramètres de `dashboard.html` (formats autorisés : PNG, JPG, WebP, SVG ; taille max : 2 Mo).

---

## 4. Configuration des 4 Edge Functions (via l'Interface Web Supabase)

Toutes les fonctions sont gérées directement depuis le menu **Edge Functions** du tableau de bord Supabase.

### ⚠️ Réglage indispensable dans l'interface Supabase
Pour chacune des 4 fonctions ci-dessous, ouvre la fonction dans Supabase → onglet **Details** (ou paramètres) → **décoche `Enforce JWT Verification`** et sauvegarde. Cela permet aux requêtes `OPTIONS` (CORS) de passer et laisse chaque fonction appliquer son propre contrôle de sécurité.

| Nom de la fonction | Rôle principal | Sécurité appliquée dans le code |
| :--- | :--- | :--- |
| **`contact-form`** | Traite le formulaire public `#request-form` de `index.html`. | Honeypot `#website`, délai minimal `elapsed_ms`, Cloudflare Turnstile (optionnel), limite de 3 envois/heure par `ip_hash` et par e-mail, insertion dans `public.prospects`, échappement HTML intégral avant envoi Resend. |
| **`notify-message`** | Envoie un e-mail d'alerte lors d'un nouveau message sur un dossier `client_requests`. | Vérifie le JWT Supabase de l'expéditeur (propriétaire du dossier ou admin), n'expose pas le contenu confidentiel dans l'e-mail et horodate `messages.notified_at`. |
| **`run-automation`** | Déclenche le webhook externe (`Make`, `n8n`) d'une automatisation active. | Exige le secret `x-withyou-secret` ou un JWT Admin/Owner, bloque les entreprises suspendues, filtre les URLs privées/locales (anti-SSRF) et enregistre le résultat via la RPC `record_automation_execution`. |
| **`smooth-service`** | Moteur d'exécution des Agents IA (Gemini, Gemma, OpenAI, Groq, Mistral, OpenRouter, BYOK) & Sandbox Admin. | Liste blanche d'actions, contrôle du secret webhook ou du JWT Admin avec vérification **2FA AAL2**, quota quotidien `rate_limit_per_day`, protection de la clé serveur globale sur les URLs tierces, gestion distincte des erreurs `429` sans bloquer l'agent. |

---

## 5. Secrets & Configuration SMTP dans Supabase

### A. Secrets des Edge Functions (`Edge Functions` → `Secrets`)
Renseigne ces variables dans le gestionnaire de secrets Supabase :
- `RESEND_API_KEY` : Clé API Resend ayant la permission d'envoi sur `with-you.store`.
- `ADMIN_EMAIL` : `contact@with-you.store`
- `WITHYOU_WEBHOOK_SECRET` : Chaîne aléatoire secrète d'au moins 16 caractères pour authentifier les webhooks entrants.
- `GEMINI_API_KEY` : Clé API Google AI Studio par défaut pour les agents Gemini / Gemma.
- `OPENAI_API_KEY` *(optionnel)* : Clé API OpenAI globale si des agents utilisent GPT-4o.
- `TURNSTILE_SECRET_KEY` *(optionnel)* : Clé secrète Cloudflare Turnstile (à associer à `TURNSTILE_SITE_KEY` dans `assets/js/wy-config.js`).

### B. Paramètres SMTP & Auth (`Authentication` → `Emails` & `Providers`)
1. **Longueur du mot de passe (`Authentication` → `Providers` → `Email`) :**
   - Régler **Minimum password length** sur **`8`** caractères.
2. **Serveur SMTP personnalisé (`Project Settings` → `Authentication` → `SMTP Settings`) :**
   - **Enable Custom SMTP :** Activé
   - **Sender email :** `contact@with-you.store`
   - **Sender name :** `With You`
   - **Host :** `smtp.resend.com`
   - **Port number :** `587`
   - **Username :** `resend`
   - **Password :** Ta clé API Resend (`re_...`)
3. **Modèle d'e-mail OTP (`Authentication` → `Emails` → `Templates` → `Confirm signup`) :**
   - Utiliser la variable `{{ .Token }}` pour envoyer le code de vérification à 6 chiffres demandé par `connexion.html`.

---

## 6. Sécurité HTTP & Déploiement Netlify

Le déploiement sur Netlify est sans étape de build obligatoire (fichiers statiques prêts pour la production) :

- **`_headers` :**
  - Active `Strict-Transport-Security` (HSTS preload), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Cross-Origin-Opener-Policy: same-origin`.
  - Configure la `Content-Security-Policy` (CSP) autorisant les appels API/Realtime et l'affichage des logos stockés sur `https://xlumemoczjcqhisqgncz.supabase.co`.
  - Force `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` sur `/admin*`, `/dashboard*`, `/connexion*` et `/reset-password*`.
  - Active un cache longue durée (`max-age=31536000, immutable`) sur `/SVG/*` et `/assets/*`.
- **`_redirects` :**
  - Redirige `/contact` et `/contact.html` en `301` vers `/#demande`.
  - Sert `/creation-site-web` et `/automatisation-ia` avec des URLs propres en statut `200`.
