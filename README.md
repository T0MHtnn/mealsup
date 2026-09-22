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

Dans le SQL Editor de Supabase (Dashboard → SQL Editor → New Query), exécute dans cet ordre :

1. **`supabase/schema.sql`** — tables, triggers, règles RLS et bucket des avatars
2. **`supabase/seed.sql`** — les recettes de base avec leurs ingrédients

Les deux fichiers sont idempotents : tu peux les relancer sans risque après une mise à jour.

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
│   ├── schema.sql           # Structure de la base (à lancer en 1er)
│   └── seed.sql             # Recettes de base (à lancer en 2e)
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
