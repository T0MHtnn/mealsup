# App Gestion de Menus 🍳 - Plan Complet

> PWA pour aide à la création de menus, gestion de courses optimisée et propositions de recettes personnalisées

---

## 1️⃣ Architecture Globale & Stack Technique

### Stack Retenue

| Couche | Technologies |
|--------|--------------|
| **Frontend** | React 19 + Vite, Tailwind CSS + Shadcn/ui, PWA (Service Workers) |
| **State** | Zustand, TanStack Query (React Query) |
| **Backend** | Supabase (PostgreSQL + Auth + Realtime) |
| **Déploiement** | GitHub → Vercel (hosting) + Supabase (DB) |
| **PWA** | Service Workers, Web Manifest, Installation native |

### Flux Architecture

```
PWA (React)
    ↓
Zustand State + TanStack Query
    ↓
Supabase Client (JS/TS)
    ↓
Supabase (PostgreSQL + Auth + Edge Functions)
```

---

## 2️⃣ Schéma Base de Données (Supabase / PostgreSQL)

### Tables Principales

#### 🔐 **users**
```sql
id (UUID, PK)
email (UNIQUE)
username
auth_id (Supabase Auth)
allergies (JSON array)
preferences (JSON: light, gras, protéiné, sportif, etc.)
dietary_restrictions (JSON array)
created_at
updated_at
```

#### 🥦 **fridge_items**
```sql
id (UUID, PK)
user_id (FK → users)
food_name (ex: "Tomate", "Poulet", "Riz")
category (ex: "Légumes", "Fruits", "Viandes", etc.)
shelf_life_days (durée de conservation en jours)
quantity (1, 2, 3... ou "500g", "2L")
unit (pièce, g, L, etc.)
added_date
expiry_date
is_available (booléen)
```

#### 📋 **recipes**
```sql
id (UUID, PK)
created_by (FK → users) // recettes communautaires ou by-app
title
description
prep_time_mins
cook_time_mins
servings (nombre par défaut)
difficulty (1-5)
dietary_type (light, gras, protéiné, sportif, normal)
tags (JSON: allergènes, régimes, etc.)
instructions (JSON array d'étapes avec images)
created_at
updated_at
visibility (public, private, friend_shared)
```

#### 🥗 **recipe_ingredients**
```sql
id (UUID, PK)
recipe_id (FK → recipes)
ingredient_name (ex: "Tomate")
quantity
unit (g, mL, pièce, etc.)
optional (booléen)
```

#### 🛒 **shopping_lists**
```sql
id (UUID, PK)
user_id (FK → users)
created_at
status (draft, active, completed)
total_items
```

#### 🛒 **shopping_list_items**
```sql
id (UUID, PK)
shopping_list_id (FK → shopping_lists)
food_name
category (par rayon: Fruits, Légumes, Produits Laitiers, Viandes, etc.)
quantity
unit
is_purchased (booléen)
estimated_price
added_by_recipe_id (FK optionnel → recipes)
```

#### 📅 **purchase_history**
```sql
id (UUID, PK)
user_id (FK → users)
shopping_list_id (FK → shopping_lists)
date_purchased
total_cost
duration_in_fridge_days (combien de jours les aliments ont duré)
items_bought (JSON snapshot de ce qui a été acheté)
```

#### 💾 **meal_plans** (optionnel mais utile)
```sql
id (UUID, PK)
user_id (FK → users)
week_start_date
Monday_recipe_id (FK → recipes)
Tuesday_recipe_id
...
Friday_recipe_id
created_at
```

---

## 3️⃣ Détail des Fonctionnalités

### 🏠 **Onglet 1: Tableau de Bord**
- Vue d'ensemble: Frigo (aliments disponibles), Suggestions du jour, Prochaines courses
- Quick actions: "+ Ajouter au frigo", "Générer une course", "Voir recettes"
- Stats: Économies réalisées ce mois, Aliments consommés

### 🥦 **Onglet 2: Gestion du Frigo**
- **Ajouter aliments**: Formulaire catégorisé par rayon (Fruits, Légumes, Produits Laitiers, Viandes, Féculents, Surgelés, Épicerie)
- **Liste du frigo**: Affichage par catégorie, avec dates d'expiration
- **Autocomplete**: Suggestion d'aliments existants + durée de vie standard
- **Actions**: Marquer comme consommé, supprimer, changer la date d'expiration
- **Alertes**: "Expire bientôt" pour les aliments (< 3 jours)

### 💡 **Onglet 3: Propositions de Plats**
- **Filtre**: Sélectionner préférences (Light, Gras, Protéiné, Sportif, Normal)
- **Algo de recommandation**:
  1. Filtrer recettes selon préférences + allergies + exclusions
  2. Scorer les recettes par ingrédients disponibles au frigo
  3. Afficher top 3 recettes (score + % ingrédients disponibles)
- **Détail recette**:
  - Image, titre, description
  - Temps préparation + cuisson
  - Ingrédients (avec quantités)
  - Étapes détaillées avec images (optionnel)
  - Allergènes / nutrition (optionnel)
- **Actions**: "Ajouter au panier", "Sauvegarder", "Envoyer à quelqu'un"

### 🛒 **Onglet 4: Gestion des Courses**
- **Génération auto**: Depuis une recette ou plusieurs recettes
- **Optimisation par rayon**: Algo pour ordonner par rayon du supermarché
- **Modification**: Ajouter/retirer articles, modifier quantités
- **Historique de courses**: Voir ce qui a été acheté, quand, pour combien
- **Checkoff**: Cocher articles au fur et à mesure
- **Partage**: Envoyer la liste à quelqu'un (WhatsApp, Email, etc.)

### 🎯 **Onglet 5: Préférences & Profil**
- **Allergies**: Checkboxes (Cacahuètes, Gluten, Lactose, etc.) + custom
- **Restrictions alimentaires**: Checkboxes (Végétarien, Végan, Casher, Halal, etc.)
- **Préférences culinaires**: Sélection multiples (Light, Gras, Protéiné, Sportif, Sucré, Salé, etc.)
- **Équipe**: Partager frigo avec famille/coloc
- **Notifications**: Alerte aliments qui expirent

### 📊 **Onglet 6: Historique & Stats** (optionnel phase 1)
- Graphique: Coût moyen course / mois
- Graphique: Aliments les plus achetés
- Graphique: Durée de vie moyenne aliments
- Tendances: "Tu achètes trop de tomates"
- Économies réalisées vs. gaspillage

---

## 4️⃣ Plan d'Implémentation par Étapes

### **PHASE 1: MVP (Semaines 1-3)**
Juste le fonctionnel de base pour utiliser l'app

- [ ] Setup Supabase (tables users, fridge_items, recipes, shopping_lists)
- [ ] Setup Vercel + GitHub repo
- [ ] **Frontend**:
  - Authentification (Sign up / Login)
  - Onglet Frigo (CRUD aliments)
  - Onglet Propositions (recettes en dur first, puis DB)
  - Onglet Courses (gen shopping list depuis recette)
  - UI basique (Shadcn/ui)
- [ ] **Backend**:
  - API endpoint pour recommandation recettes (Edge Function)
  - API endpoint pour génération shopping list optimisée
- [ ] PWA setup (manifest.json, service worker)

### **PHASE 2: Optimisation & Expérience (Semaines 4-5)**
Affinage pour vraiment l'utiliser au quotidien

- [ ] Optimisation algo shopping list (par rayon / supermarché)
- [ ] Historique courses (storage + visualisation)
- [ ] Notifications aliments expirant
- [ ] Autocomplete aliments
- [ ] Images recettes + instructions détaillées
- [ ] Mode offline (service worker cache)

### **PHASE 3: Communauté & Stats (Semaines 6+)**
Fonctionnalités sociales et analyse

- [ ] Partage recettes entre utilisateurs
- [ ] Dashboard stats (graphiques, tendances)
- [ ] Pairing avec quelqu'un (frigo partagé)
- [ ] Évaluation recettes (⭐)
- [ ] Base de recettes collaborative
- [ ] Calcul nutrition / calories (optionnel)

---

## 5️⃣ Structure du Projet Git & Code Starter

### Structure des Dossiers

```
menu-app/
├── .github/
│   └── workflows/         # CI/CD Vercel
├── src/
│   ├── components/        # Shadcn/ui + custom
│   │   ├── auth/
│   │   ├── fridge/
│   │   ├── recipes/
│   │   ├── shopping/
│   │   └── common/
│   ├── pages/             # React Router pages
│   │   ├── dashboard.tsx
│   │   ├── fridge.tsx
│   │   ├── recipes.tsx
│   │   ├── shopping.tsx
│   │   └── preferences.tsx
│   ├── hooks/             # Custom hooks (useAuth, useFridge, etc.)
│   ├── store/             # Zustand stores
│   ├── services/          # Supabase client + API calls
│   ├── types/             # TypeScript types
│   ├── utils/             # Helpers
│   ├── styles/            # Global styles
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service Worker
│   └── icons/             # App icons
├── supabase/
│   └── migrations/        # SQL migrations
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── .env.local             # Supabase keys (ignored)
└── .gitignore
```

### Dépendances Clés (package.json)

```json
{
  "name": "menu-app",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .ts,.tsx"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "@supabase/supabase-js": "^2.38.0",
    "zustand": "^4.4.0",
    "@tanstack/react-query": "^5.28.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "tailwindcss": "^3.3.0",
    "lucide-react": "^0.292.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.1.0",
    "vite": "^5.0.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 6️⃣ Variables d'Environnement (.env.local)

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Vercel (auto)
VERCEL=1
```

---

## 7️⃣ Recommandations & Astuces

### Performance
- **Image recettes**: Utiliser Supabase Storage + lazy load
- **Caching**: TanStack Query pour cache local smart
- **Service Worker**: Precache pour offline mode

### UX/UI
- **Mobile first**: Design pour téléphone d'abord
- **Catégories rayon**: Hardcoder rayons classiques (Fruits, Légumes, etc.) pour cohérence
- **Autocomplete**: Suggestion d'aliments depuis history de l'user
- **Notifications**: Push notifications si aliment expire bientôt

### Sécurité
- **RLS (Row Level Security)**: Activer sur toutes les tables Supabase
- **Auth**: Utiliser Supabase Auth (email + password ou OAuth)
- **API Keys**: Jamais committer les keys dans le repo

### Scalabilité Future
- Edge Functions Supabase pour algo recommandation lourd
- Pagination shopping lists si très longs
- Caching Redis pour recettes populaires (optionnel)

---

## 8️⃣ Prochaines Étapes Immédiates

1. ✅ **Créer projet GitHub** (nom: `menu-app`)
2. ✅ **Créer projet Supabase** (gratuit tier OK pour start)
3. ✅ **Setup Vercel** (connecter GitHub repo)
4. ✅ **Clone local** et setup dev environment
5. ✅ **Initialiser tables Supabase** (via SQL editor)
6. ✅ **Commencer PHASE 1** avec composant Auth

---

**Besoin d'aide pour:** starter code, setup Supabase, configuration Vercel? 🚀
