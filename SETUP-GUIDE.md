# 📋 Guide Détaillé Setup: Supabase + Vercel + GitHub

Ce guide te montre pas à pas comment configurer l'app avec Supabase, Vercel et GitHub.

---

## ÉTAPE 1️⃣ Créer repo GitHub

### 1.1 Sur GitHub.com
- Va sur https://github.com/new
- **Repository name:** `menu-app`
- **Description:** "PWA for menu planning and shopping list optimization"
- **Public** ou **Private** (à ton choix)
- ✅ Clique "Create repository"

### 1.2 Cloner localement et initialiser

```bash
# Clone le repo
git clone https://github.com/yourusername/menu-app.git
cd menu-app

# Initialise git (si pas déjà fait)
git init

# Ajoute tous les fichiers
git add .

# Commit initial
git commit -m "🍳 Initial commit: Menu App PWA with Supabase + Vercel"

# Push sur GitHub
git branch -M main
git remote add origin https://github.com/yourusername/menu-app.git
git push -u origin main
```

---

## ÉTAPE 2️⃣ Configurer Supabase

### 2.1 Créer un projet Supabase

1. Va sur https://supabase.com
2. Clique "Start your project" ou "Sign in" si tu as un compte
3. Crée un nouveau projet:
   - **Name:** `menu-app`
   - **Database password:** (crée un mot de passe sécurisé 🔐)
   - **Region:** EU (ou ta région préférée)
   - **Pricing:** Free tier ✅

4. Attends que le projet soit créé (~2 minutes)

### 2.2 Récupérer les clés API

1. Dans Supabase, va à **Settings → API**
2. Tu veras deux clés:
   - **Project URL** → Copie-la
   - **anon public** (Anon Key) → Copie-la
3. Garde ces clés de côté pour l'étape suivante

### 2.3 Créer les tables

1. Dans Supabase, va à **SQL Editor → New Query**
2. Copie-colle le contenu de `supabase/schema.sql`
3. Clique **"Run"** (triangle play en haut à droite)
4. ✅ Les tables sont créées!

### 2.4 Initialiser les recettes

1. Nouveau SQL Query
2. Copie-colle le contenu de `supabase/seed.sql`
3. Clique "Run"
4. ✅ Tu as des recettes de base!

### 2.5 Configurer l'authentification

1. Dans Supabase, va à **Authentication → Providers**
2. Assure-toi que **Email** est activé (défaut)
3. Va à **Authentication → URL Configuration**
4. Mets à jour **"Authorized redirect URLs":**
   - `http://localhost:5173` (pour dev local)
   - `https://menu-app.vercel.app` (remplace par ton domaine Vercel)
   - `https://yourdomain.com` (si tu as un domaine custom)

---

## ÉTAPE 3️⃣ Configurer le projet local

### 3.1 Installe les dépendances

```bash
cd menu-app
npm install
# ou
yarn install
```

### 3.2 Crée .env.local

```bash
# Copie le fichier d'exemple
cp .env.example .env.local
```

### 3.3 Édite .env.local

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Remplace avec tes vraies clés de l'étape 2.2!

### 3.4 Lance le dev server

```bash
npm run dev
```

Accède à `http://localhost:5173` et tu devrais voir la page de login! 🎉

### 3.5 Teste l'authentification

1. Clique "Sign up"
2. Rentre un email et mot de passe
3. Crée un compte
4. ✅ Vérifie que tu es redirigé au dashboard

---

## ÉTAPE 4️⃣ Déployer sur Vercel

### 4.1 Connecter GitHub à Vercel

1. Va sur https://vercel.com
2. Clique "Sign up" ou "Sign in"
3. Choisis "Continue with GitHub"
4. Autorise Vercel à accéder à tes repos

### 4.2 Importer le projet

1. Clique "New Project" ou "Add New..."
2. Choisis le repo `menu-app`
3. ✅ Vercel détecte automatiquement Vite

### 4.3 Configurer les variables d'environnement

1. Dans la page de configuration du projet:
   - **Environment Variables** section
2. Ajoute deux variables:
   - **VITE_SUPABASE_URL** = (ta URL Supabase)
   - **VITE_SUPABASE_ANON_KEY** = (ta Anon Key)
3. Clique "Deploy"

### 4.4 Attendre le déploiement

- Vercel build et déploie automatiquement
- Attends 2-5 minutes
- Tu recevras une notification de succès
- Tu auras une URL: `https://menu-app-XXXXX.vercel.app` 🚀

### 4.5 Mettre à jour les URLs Supabase

Retour à Supabase:
1. **Settings → Authentication → URL Configuration**
2. Ajoute ta nouvelle URL Vercel dans **Authorized redirect URLs:**
   - `https://menu-app-XXXXX.vercel.app`

---

## ÉTAPE 5️⃣ Configurer la PWA

### 5.1 Ajouter des icônes

Pour que ta PWA soit installable, tu dois ajouter des icônes:

1. Crée des images carrées:
   - `icons/icon-192.png` (192×192)
   - `icons/icon-512.png` (512×512)
   - `icons/icon-maskable-192.png` (maskable 192×192)
   - `icons/icon-maskable-512.png` (maskable 512×512)

   **Conseil:** Utilise un outil comme https://www.favicon-generator.org/

2. Place-les dans `public/icons/`

3. Assure-toi que `public/manifest.json` les référence (c'est déjà fait)

### 5.2 Enregistrer le Service Worker

Ajoute à `src/main.tsx`:

```tsx
// Registre le service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then((registration) => {
    console.log('Service Worker registered:', registration)
  })
}
```

### 5.3 Tester la PWA

**Sur Chrome/Desktop:**
1. Ouvre DevTools (F12)
2. Va à **Application → Manifest**
3. Vérifie que le manifest charge correctement
4. Vérifie que le Service Worker est enregistré

**Sur Chrome Mobile:**
1. Ouvre l'app sur ton téléphone
2. Appuie sur le menu (3 points)
3. Cherche "Install app" ou "Ajouter à l'écran d'accueil"

---

## ÉTAPE 6️⃣ Mettre à jour Supabase pour la sécurité

### 6.1 Activer les connexions HTTPS seulement

1. Dans Supabase, va à **Settings → Security**
2. Assure-toi que la base de données utilise HTTPS uniquement
3. Vercel utilise HTTPS par défaut ✅

### 6.2 Vérifier les RLS policies

1. Va à **SQL Editor**
2. Exécute une query pour vérifier:

```sql
SELECT schemaname, tablename, policydefs 
FROM pg_partitioned_table;
```

Les RLS doivent être actives sur toutes les tables sensibles.

---

## ÉTAPE 7️⃣ CI/CD: Auto-deploy

Vercel déploie automatiquement quand tu push sur main!

```bash
# Fais une modification
echo "# Version 0.2.0" >> README.md

# Commit et push
git add .
git commit -m "🎉 Version 0.2.0: Add PWA improvements"
git push origin main

# Vercel détecte le push et redéploie automatiquement 🚀
```

---

## ✅ Checklist Final

- [ ] Repo GitHub créé et clôné
- [ ] Supabase project créé
- [ ] Tables SQL créées
- [ ] Anon Key et Project URL sauvegardées
- [ ] `.env.local` configuré avec les clés
- [ ] Dev local fonctionne: `npm run dev`
- [ ] Compte de test créé et login testé
- [ ] Vercel connecté à GitHub
- [ ] Variables d'env dans Vercel
- [ ] App déployée et accessible
- [ ] PWA installable sur téléphone
- [ ] Icônes ajoutées pour PWA

---

## 🐛 Troubleshooting

### "Cannot fetch data from Supabase"
→ Vérifie `.env.local` a les bonnes clés (sans espaces extra)

### Vercel build échoue
→ Clique sur "View Logs" dans Vercel et cherche l'erreur

### Login ne fonctionne pas
→ Vérifie que Authorized redirect URLs dans Supabase inclut ta URL Vercel

### PWA ne s'installe pas
→ Assure-toi que le site est en HTTPS et qu'il y a un manifest.json valide

### Service Worker ne s'enregistre pas
→ Assure-toi que `sw.js` est dans `public/` et `navigator.serviceWorker.register('/sw.js')` dans `main.tsx`

---

## 🎓 Documentation Utile

- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- PWA Guide: https://web.dev/progressive-web-apps/
- React Router: https://reactrouter.com/
- Zustand: https://github.com/pmndrs/zustand

---

**Besoin d'aide?** Réfère-toi à la doc officielle ou pose une question! 🚀
