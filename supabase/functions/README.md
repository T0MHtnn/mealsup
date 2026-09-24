# Fonctions Supabase (Edge Functions)

Trois fonctions serveur, en plus de `schema.sql` et `seed.sql` :

| Fonction | Rôle | Qui l'appelle |
|---|---|---|
| `import-recipe` | Lit une page de recette (Marmiton, 750g…) et renvoie ses données pour pré-remplir le formulaire « Créer une recette ». | L'app (utilisateur connecté) |
| `expiry-notifications` | Envoie les alertes de péremption (notifications push) avec 1 ou 2 idées de recettes. | Une tâche planifiée, chaque matin |
| `feedback-notify` | Prévient les admins d'un nouveau message (notification push, et e-mail si configuré). | Un Database Webhook, à chaque message |

Tout se fait avec la CLI Supabase via `npx` (rien à installer). `<PROJECT_REF>` est
l'identifiant du projet : la partie avant `.supabase.co` dans l'URL du projet.

## 1. Connexion et liaison du projet (une seule fois)

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
```

## 2. Import de recettes

```bash
npx supabase functions deploy import-recipe
```

Dans le tableau de bord (Edge Functions → `import-recipe` → Settings), laisser **« Verify JWT with legacy secret » sur OFF** : la fonction vérifie elle-même que l'appel vient d'un utilisateur connecté.

## 3. Notifications de péremption

### a. Clés VAPID (chiffrement des notifications)

```bash
npx web-push generate-vapid-keys
```

Garde les deux clés affichées (`Public Key` et `Private Key`).

### b. Clé publique côté app (Vercel)

Vercel → projet → *Settings* → *Environment Variables* :
`VITE_VAPID_PUBLIC_KEY` = la **clé publique**. Puis redéployer.
(En local : même ligne dans `.env.local`.)

Sans cette variable, l'app masque simplement l'option notifications.

### c. Secrets de la fonction

Choisis un mot de passe au hasard pour `CRON_SECRET` (il protège la fonction).

```bash
npx supabase secrets set VAPID_PUBLIC_KEY="<clé publique>" VAPID_PRIVATE_KEY="<clé privée>" VAPID_SUBJECT="mailto:ton@email.fr" CRON_SECRET="<mot de passe au hasard>"
npx supabase functions deploy expiry-notifications --no-verify-jwt
```

(`--no-verify-jwt` : la tâche planifiée n'a pas de session utilisateur ; la
fonction est protégée par `CRON_SECRET` à la place.)

### d. Tâche planifiée (tous les jours à 7 h UTC, soit 8 h/9 h à Paris)

Dans Supabase → *Database* → *Extensions* : activer **pg_cron** et **pg_net**.
Puis dans le *SQL Editor* (en remplaçant `<PROJECT_REF>` et `<CRON_SECRET>`) :

```sql
select cron.schedule(
  'mealsup-expiry-notifications',
  '0 7 * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/expiry-notifications',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', '<CRON_SECRET>'),
    body := '{}'::jsonb
  );
  $$
);
```

Pour tester tout de suite sans attendre le lendemain :

```bash
curl -X POST "https://<PROJECT_REF>.supabase.co/functions/v1/expiry-notifications" -H "x-cron-secret: <CRON_SECRET>"
```

(il faut un aliment du frigo qui périme aujourd'hui ou demain, et les
notifications activées dans le Profil depuis le téléphone).

Pour arrêter la tâche : `select cron.unschedule('mealsup-expiry-notifications');`


## 4. Alerte « nouveau message » pour les admins

Utilise les mêmes secrets que les notifications de péremption (étape 3.c).

### a. Déployer la fonction

```bash
npx supabase functions deploy feedback-notify --no-verify-jwt
```

### b. E-mail (facultatif)

Sans cette étape, seule la notification push est envoyée. Crée un **nouveau** mot de
passe d'application Gmail (myaccount.google.com/apppasswords, nom : « MealsUp alertes »),
puis tape toi-même dans le terminal :

```bash
npx supabase secrets set SMTP_USER="ton.adresse@gmail.com" SMTP_PASS="<mot de passe d'application>"
```

(Facultatif : `NOTIFY_EMAIL="autre@adresse.fr"` pour recevoir les e-mails ailleurs que
sur l'adresse du compte admin.)

### c. Déclencher la fonction à chaque message

Supabase → *Database* → *Webhooks* → **Create a new hook** :
- Name : `feedback-notify`
- Table : `feedback` — Events : **Insert** uniquement
- Type : **Supabase Edge Functions** → `feedback-notify` (méthode POST)
- HTTP Headers : ajouter `x-cron-secret` = la valeur de `CRON_SECRET`
- **Create webhook**

### d. Activer les notifications sur ton téléphone

Dans l'app installée, mode administrateur → *Profil* → **Nouveaux messages** : activer.
