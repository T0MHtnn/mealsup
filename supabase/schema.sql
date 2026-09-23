-- ============================================================================
-- MealsUp — SCHÉMA COMPLET (tables, colonnes, triggers, RLS, stockage)
-- ============================================================================
-- À exécuter dans le SQL Editor de Supabase, AVANT seed.sql.
--
-- Idempotent : peut être rejoué sans danger, sur une base vide comme sur la
-- base existante (CREATE ... IF NOT EXISTS, ADD COLUMN IF NOT EXISTS,
-- DROP POLICY IF EXISTS avant chaque CREATE POLICY).
--
-- Remplace les anciennes migrations 001 à 011 et le schéma du README.
-- ============================================================================


-- ============ UTILISATEURS ============
-- users.id = auth.users.id (une ligne par compte, créée par le trigger plus bas)

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  allergies JSONB DEFAULT '[]'::jsonb,            -- aliments exclus
  preferences JSONB DEFAULT '{}'::jsonb,
  dietary_restrictions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS equipment JSONB NOT NULL DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS equipment_all BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
-- Enseigne habituelle, pour ajuster les prix ESTIMÉS (voir src/constants/prices.ts)
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_store TEXT NOT NULL DEFAULT 'average';

-- allergies / dietary_restrictions doivent être des tableaux JSON (pas '{}')
UPDATE users SET allergies = '[]'::jsonb WHERE allergies IS NULL OR jsonb_typeof(allergies) <> 'array';
UPDATE users SET dietary_restrictions = '[]'::jsonb WHERE dietary_restrictions IS NULL OR jsonb_typeof(dietary_restrictions) <> 'array';
ALTER TABLE users ALTER COLUMN allergies SET DEFAULT '[]'::jsonb;
ALTER TABLE users ALTER COLUMN dietary_restrictions SET DEFAULT '[]'::jsonb;

-- Création automatique du profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, username, allergies, preferences, dietary_restrictions)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    '[]'::jsonb,
    '{}'::jsonb,
    '[]'::jsonb
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Rattrapage : profil manquant pour les comptes déjà inscrits
INSERT INTO public.users (id, email, username, allergies, preferences, dietary_restrictions)
SELECT au.id, au.email, split_part(au.email, '@', 1), '[]'::jsonb, '{}'::jsonb, '[]'::jsonb
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL;


-- ============ FRIGO ============

CREATE TABLE IF NOT EXISTS fridge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Autre',
  shelf_life_days INTEGER,
  quantity TEXT,
  unit TEXT,
  added_date TIMESTAMPTZ DEFAULT now(),
  expiry_date TIMESTAMPTZ,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE fridge_items ALTER COLUMN category SET DEFAULT 'Autre';
UPDATE fridge_items SET category = 'Autre' WHERE category IS NULL;


-- ============ RECETTES ============

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  prep_time_mins INTEGER,
  cook_time_mins INTEGER,
  servings INTEGER DEFAULT 4,
  difficulty INTEGER DEFAULT 3,                   -- 1 à 3
  dietary_type TEXT,                              -- 'light', 'gras', 'protéiné'...
  tags JSONB DEFAULT '[]'::jsonb,
  instructions JSONB DEFAULT '[]'::jsonb,         -- tableau d'étapes
  visibility TEXT DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Équipement requis, ex: '["oven","stovetop"]'
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS equipment_needed JSONB NOT NULL DEFAULT '[]';

-- Recettes système (created_by NULL) : titre unique, le seed les met à jour par titre.
-- Les recettes des utilisateurs peuvent reprendre un titre existant ("Mes crêpes"...).
DROP INDEX IF EXISTS recipes_title_key;
CREATE UNIQUE INDEX IF NOT EXISTS recipes_system_title_key ON recipes (title) WHERE created_by IS NULL;


-- ============ CATALOGUE D'INGRÉDIENTS ============

CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ingredients_name_key ON ingredients (name);


-- ============ INGRÉDIENTS DES RECETTES ============

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,                  -- texte affiché
  quantity FLOAT,
  unit TEXT,
  optional BOOLEAN DEFAULT false
);

ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS ingredient_id UUID REFERENCES ingredients(id);

-- Chaque ligne insérée / modifiée est reliée au catalogue "ingredients"
-- (l'ingrédient y est créé s'il n'existe pas encore).
CREATE OR REPLACE FUNCTION link_recipe_ingredient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean_name TEXT := btrim(NEW.ingredient_name);
BEGIN
  IF clean_name IS NULL OR clean_name = '' THEN
    NEW.ingredient_id := NULL;
    RETURN NEW;
  END IF;

  INSERT INTO ingredients (name) VALUES (clean_name)
  ON CONFLICT (name) DO NOTHING;

  SELECT id INTO NEW.ingredient_id FROM ingredients WHERE name = clean_name;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS recipe_ingredients_link_ingredient ON recipe_ingredients;
CREATE TRIGGER recipe_ingredients_link_ingredient
  BEFORE INSERT OR UPDATE OF ingredient_name ON recipe_ingredients
  FOR EACH ROW
  EXECUTE FUNCTION link_recipe_ingredient();

-- Rattrapage : relie les lignes déjà présentes
INSERT INTO ingredients (name)
SELECT DISTINCT btrim(ingredient_name)
FROM recipe_ingredients
WHERE ingredient_name IS NOT NULL AND btrim(ingredient_name) <> ''
ON CONFLICT (name) DO NOTHING;

UPDATE recipe_ingredients ri
SET ingredient_id = i.id
FROM ingredients i
WHERE i.name = btrim(ri.ingredient_name)
  AND ri.ingredient_id IS DISTINCT FROM i.id;


-- ============ FAVORIS ============

CREATE TABLE IF NOT EXISTS favorite_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, recipe_id)
);


-- ============ PLANNING DE LA SEMAINE ============

CREATE TABLE IF NOT EXISTS planned_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  meal_date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'snack', 'dinner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS planned_meals_slot_key ON planned_meals (user_id, meal_date, meal_type);


-- ============ COURSES ============

CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'draft',                    -- 'draft', 'completed'
  total_items INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE shopping_lists ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  food_name TEXT NOT NULL,
  category TEXT DEFAULT 'Autre',
  quantity NUMERIC,
  unit TEXT,
  is_purchased BOOLEAN DEFAULT false,
  estimated_price FLOAT,
  added_by_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL
);

-- Colonnes en double ajoutées par erreur dans une ancienne version
ALTER TABLE shopping_list_items DROP COLUMN IF EXISTS item_name;
ALTER TABLE shopping_list_items DROP COLUMN IF EXISTS is_checked;

CREATE TABLE IF NOT EXISTS purchase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shopping_list_id UUID REFERENCES shopping_lists(id) ON DELETE SET NULL,
  items JSONB,                                    -- détail des produits achetés
  date_purchased TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_cost FLOAT
);

ALTER TABLE purchase_history ADD COLUMN IF NOT EXISTS shopping_list_id UUID REFERENCES shopping_lists(id) ON DELETE SET NULL;
ALTER TABLE purchase_history ADD COLUMN IF NOT EXISTS items JSONB;
ALTER TABLE purchase_history ADD COLUMN IF NOT EXISTS date_purchased TIMESTAMPTZ NOT NULL DEFAULT now();


-- ============ RETOURS UTILISATEURS (section Contact du profil) ============
-- Lecture : Supabase > Table Editor > feedback (l'app ne permet que d'envoyer).

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============ ROW LEVEL SECURITY ============

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fridge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Profil
DROP POLICY IF EXISTS "Users manage their own profile" ON users;
CREATE POLICY "Users manage their own profile"
  ON users FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Frigo
DROP POLICY IF EXISTS "Users manage their own fridge items" ON fridge_items;
CREATE POLICY "Users manage their own fridge items"
  ON fridge_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Recettes : les recettes système (seed) sont publiques et en lecture seule
-- depuis l'app ; chaque utilisateur crée, modifie et supprime ses propres
-- recettes, qui restent privées (invisibles pour les autres).
-- (le seed s'exécute depuis le SQL Editor, qui n'est pas soumis au RLS)
DROP POLICY IF EXISTS "Users can read public recipes" ON recipes;
DROP POLICY IF EXISTS "Authenticated users can manage recipes" ON recipes;

DROP POLICY IF EXISTS "Recipes are publicly readable" ON recipes;
CREATE POLICY "Recipes are publicly readable"
  ON recipes FOR SELECT
  USING (visibility = 'public' OR created_by = auth.uid());

DROP POLICY IF EXISTS "Users create their own recipes" ON recipes;
CREATE POLICY "Users create their own recipes"
  ON recipes FOR INSERT
  WITH CHECK (created_by = auth.uid() AND visibility = 'private');

DROP POLICY IF EXISTS "Users update their own recipes" ON recipes;
CREATE POLICY "Users update their own recipes"
  ON recipes FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid() AND visibility = 'private');

DROP POLICY IF EXISTS "Users delete their own recipes" ON recipes;
CREATE POLICY "Users delete their own recipes"
  ON recipes FOR DELETE
  USING (created_by = auth.uid());

-- Ingrédients des recettes : mêmes règles que la recette à laquelle ils appartiennent
DROP POLICY IF EXISTS "Authenticated users can manage recipe ingredients" ON recipe_ingredients;

DROP POLICY IF EXISTS "Recipe ingredients are publicly readable" ON recipe_ingredients;
CREATE POLICY "Recipe ingredients are publicly readable"
  ON recipe_ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_ingredients.recipe_id
        AND (r.visibility = 'public' OR r.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users manage ingredients of their own recipes" ON recipe_ingredients;
CREATE POLICY "Users manage ingredients of their own recipes"
  ON recipe_ingredients FOR ALL
  USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_ingredients.recipe_id AND r.created_by = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_ingredients.recipe_id AND r.created_by = auth.uid())
  );

-- Catalogue d'ingrédients : lecture seule (alimenté par le trigger, qui passe outre le RLS)
DROP POLICY IF EXISTS "Authenticated users can manage ingredients" ON ingredients;

DROP POLICY IF EXISTS "Ingredients are publicly readable" ON ingredients;
CREATE POLICY "Ingredients are publicly readable"
  ON ingredients FOR SELECT
  USING (true);

-- Favoris
DROP POLICY IF EXISTS "Users manage their own favorites" ON favorite_recipes;
CREATE POLICY "Users manage their own favorites"
  ON favorite_recipes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Planning
DROP POLICY IF EXISTS "Users manage their own planned meals" ON planned_meals;
CREATE POLICY "Users manage their own planned meals"
  ON planned_meals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Courses
DROP POLICY IF EXISTS "Users manage their own shopping lists" ON shopping_lists;
CREATE POLICY "Users manage their own shopping lists"
  ON shopping_lists FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage items in their own shopping lists" ON shopping_list_items;
CREATE POLICY "Users manage items in their own shopping lists"
  ON shopping_list_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      WHERE sl.id = shopping_list_items.shopping_list_id AND sl.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists sl
      WHERE sl.id = shopping_list_items.shopping_list_id AND sl.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users manage their own purchase history" ON purchase_history;
CREATE POLICY "Users manage their own purchase history"
  ON purchase_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- Retours : chacun peut envoyer un message en son nom, personne ne les relit depuis l'app
DROP POLICY IF EXISTS "Users send feedback" ON feedback;
CREATE POLICY "Users send feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ============ STOCKAGE : PHOTOS DE PROFIL ============

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly readable" ON storage.objects;
CREATE POLICY "Avatar images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users upload their own avatar" ON storage.objects;
CREATE POLICY "Users upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users update their own avatar" ON storage.objects;
CREATE POLICY "Users update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users delete their own avatar" ON storage.objects;
CREATE POLICY "Users delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
