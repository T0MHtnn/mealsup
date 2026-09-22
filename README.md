# 🍳 Menu App - PWA de Gestion de Menus

PWA progressive pour créer des menus, gérer vos courses et optimiser votre temps en supermarché avec propositions de recettes personnalisées.

**Stack:** React 19 + Vite + Tailwind CSS + Supabase + Vercel

---

## 🚀 Quick Start

### Prérequis
- Node.js 18+ et npm/yarn
- Compte Supabase (gratuit)
- Compte Vercel (gratuit)
- Compte GitHub

### 1. Setup Local

```bash
# Clone le repo
git clone https://github.com/yourusername/menu-app.git
cd menu-app

# Installe les dépendances
npm install

# Copie le fichier .env
cp .env.example .env.local

# Édite .env.local avec tes clés Supabase
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_ANON_KEY=...

# Lance le dev server
npm run dev
```

L'app sera disponible à `http://localhost:5173`

### 2. Setup Supabase

#### Créer le projet
1. Va sur https://supabase.com
2. Crée un nouveau projet (gratuit tier OK)
3. Note ton **Project URL** et **Anon Key**
4. Mets-les dans `.env.local`

#### Créer les tables SQL

Copie ce SQL dans l'éditeur SQL de Supabase (Dashboard → SQL Editor → New Query):

```sql
-- ============ USERS ============
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  allergies JSONB DEFAULT '[]'::jsonb,
  preferences JSONB DEFAULT '[]'::jsonb,
  dietary_restrictions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============ FRIDGE ITEMS ============
CREATE TABLE fridge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Fruits', 'Légumes', 'Viandes', etc.
  shelf_life_days INTEGER,
  quantity TEXT,
  unit TEXT, -- 'pièce', 'g', 'L'
  added_date TIMESTAMP DEFAULT NOW(),
  expiry_date TIMESTAMP,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============ RECIPES ============
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  prep_time_mins INTEGER,
  cook_time_mins INTEGER,
  servings INTEGER DEFAULT 4,
  difficulty INTEGER DEFAULT 3, -- 1-5
  dietary_type TEXT, -- 'light', 'gras', 'protéiné', 'sportif', 'normal'
  tags JSONB DEFAULT '[]'::jsonb,
  instructions JSONB DEFAULT '[]'::jsonb, -- Array of steps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  visibility TEXT DEFAULT 'public' -- 'public', 'private', 'friend_shared'
);

-- ============ RECIPE INGREDIENTS ============
CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  quantity FLOAT,
  unit TEXT, -- 'g', 'mL', 'pièce'
  optional BOOLEAN DEFAULT FALSE
);

-- ============ SHOPPING LISTS ============
CREATE TABLE shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'draft', -- 'draft', 'active', 'completed'
  total_items INTEGER DEFAULT 0
);

-- ============ SHOPPING LIST ITEMS ============
CREATE TABLE shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  category TEXT, -- Par rayon
  quantity TEXT,
  unit TEXT,
  is_purchased BOOLEAN DEFAULT FALSE,
  estimated_price FLOAT,
  added_by_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL
);

-- ============ PURCHASE HISTORY ============
CREATE TABLE purchase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shopping_list_id UUID REFERENCES shopping_lists(id) ON DELETE SET NULL,
  date_purchased TIMESTAMP DEFAULT NOW(),
  total_cost FLOAT,
  duration_in_fridge_days INTEGER,
  items_bought JSONB DEFAULT '[]'::jsonb
);

-- ============ Enable RLS ============
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fridge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES ============
-- Users can only see their own data
CREATE POLICY "Users can read own data" ON users FOR SELECT
  USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own data" ON users FOR UPDATE
  USING (auth.uid() = auth_id);

-- Fridge items
CREATE POLICY "Users can read own fridge" ON fridge_items FOR SELECT
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can create own fridge items" ON fridge_items FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update own fridge items" ON fridge_items FOR UPDATE
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can delete own fridge items" ON fridge_items FOR DELETE
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Shopping lists
CREATE POLICY "Users can read own shopping lists" ON shopping_lists FOR SELECT
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can create shopping lists" ON shopping_lists FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Recipes (public recipes visible to all, private only to owner)
CREATE POLICY "Users can read public recipes" ON recipes FOR SELECT
  USING (visibility = 'public' OR created_by = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Purchase history
CREATE POLICY "Users can read own purchase history" ON purchase_history FOR SELECT
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
```

**Exécute ce SQL** en cliquant sur "Run" dans le SQL Editor de Supabase.

### 3. Déployer sur Vercel

```bash
# Push sur GitHub
git add .
git commit -m "Initial commit"
git push origin main

# Va sur Vercel et connecte le repo GitHub
# https://vercel.com/new

# Ajoute les variables d'environnement dans Vercel:
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY

# Vercel deploy automatiquement à chaque push
```

---

## 📁 Structure du Projet

```
menu-app/
├── src/
│   ├── components/          # Composants React réutilisables
│   │   ├── layout/          # MainLayout, Navbar, Sidebar
│   │   ├── fridge/          # Composants frigo
│   │   ├── recipes/         # Composants recettes
│   │   ├── shopping/        # Composants shopping
│   │   ├── auth/            # Composants authentification
│   │   └── common/          # Loading, Error, etc.
│   ├── pages/               # Pages (route handlers)
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Fridge.tsx
│   │   ├── Recipes.tsx
│   │   ├── Shopping.tsx
│   │   └── Preferences.tsx
│   ├── hooks/               # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useFridge.ts
│   │   └── useRecipes.ts
│   ├── store/               # Zustand stores
│   │   ├── authStore.ts
│   │   ├── fridgeStore.ts
│   │   └── shoppingStore.ts
│   ├── services/            # API & Supabase
│   │   └── supabaseClient.ts
│   ├── types/               # TypeScript types
│   │   └── index.ts
│   ├── utils/               # Helper functions
│   │   └── helpers.ts
│   ├── styles/              # Global styles
│   │   └── globals.css
│   ├── App.tsx
│   └── main.tsx
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── sw.js                # Service Worker
│   └── icons/               # App icons
├── supabase/
│   └── migrations/          # SQL migrations (optional)
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

---

## 🎨 Personnalisation

### Tailwind Config
Édite `tailwind.config.ts` pour changer les couleurs, fonts, etc.

### Shadcn/ui Components
Utilise Shadcn/ui pour des composants professionnels:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
```

### Icônes
Utilise lucide-react pour les icônes:
```tsx
import { Utensils, ShoppingCart, Refrigerator } from 'lucide-react'
```

---

## 🔐 Sécurité

- ✅ **RLS (Row Level Security)** activé sur Supabase
- ✅ **Clés d'environnement** jamais commitées (`.env.local` dans `.gitignore`)
- ✅ **Auth Supabase** pour authentification sécurisée
- ✅ **HTTPS** sur Vercel (automatique)

---

## 📱 PWA Features

Cette app est une PWA complète:
- ✅ Installable sur téléphone (Home screen)
- ✅ Works offline (Service Worker + cache)
- ✅ Responsive design
- ✅ Native-like experience

### Installer sur iPhone
1. Ouvre l'app dans Safari
2. Appuie sur Share → Add to Home Screen

### Installer sur Android
1. Ouvre l'app dans Chrome
2. Appuie sur le menu (3 points) → Install app

---

## 🚀 Prochaines Étapes (Après Phase 1)

1. **Ajouter base de recettes**: Utilise une seed SQL ou Supabase seed
2. **Algorithme de recommandation**: Edge Function Supabase
3. **Images recettes**: Upload vers Supabase Storage
4. **Historique & stats**: TanStack Query + graphiques
5. **Notifications**: Web Push Notifications

---

## 📚 Documentation Utile

- [Vite](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/)
- [PWA Guidelines](https://web.dev/progressive-web-apps/)

---

## 🆘 Troubleshooting

### "Cannot find module '@/services/supabaseClient'"
→ Vérifi que `tsconfig.json` a le path alias `@/*` configuré correctement

### Supabase connection error
→ Vérifie que `.env.local` a les bonnes clés et URLs

### PWA not installing
→ Utilise https (Vercel est auto https), pas http

---

## 📄 License

MIT

---

**Made with 💚 for meal planning lovers** 🍳
