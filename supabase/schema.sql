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
-- Type de compte : 'member' (par défaut) ou 'admin'
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('member', 'admin'));
-- Enseigne habituelle, pour ajuster les prix ESTIMÉS (voir src/constants/prices.ts)
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_store TEXT NOT NULL DEFAULT 'average';
-- Alertes de péremption (notifications push) : activées ? déjà proposées une fois ?
ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications_asked BOOLEAN NOT NULL DEFAULT false;

-- allergies / dietary_restrictions doivent être des tableaux JSON (pas '{}')
UPDATE users SET allergies = '[]'::jsonb WHERE allergies IS NULL OR jsonb_typeof(allergies) <> 'array';
UPDATE users SET dietary_restrictions = '[]'::jsonb WHERE dietary_restrictions IS NULL OR jsonb_typeof(dietary_restrictions) <> 'array';
ALTER TABLE users ALTER COLUMN allergies SET DEFAULT '[]'::jsonb;
ALTER TABLE users ALTER COLUMN dietary_restrictions SET DEFAULT '[]'::jsonb;

-- Création automatique du profil à l'inscription
-- Le profil MealsUp n'est créé qu'une fois l'adresse e-mail confirmée (lien
-- reçu par e-mail). Un compte Google est confirmé dès sa création.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL THEN
    RETURN NEW;
  END IF;
  INSERT INTO public.users (id, email, username, allergies, preferences, dietary_restrictions, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    '[]'::jsonb,
    '{}'::jsonb,
    '[]'::jsonb,
    CASE WHEN lower(NEW.email) = 'tomhatonlcsm@gmail.com' THEN 'admin' ELSE 'member' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Clic sur le lien de confirmation : le compte devient actif
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- Rattrapage : profil manquant pour les comptes confirmés déjà inscrits
INSERT INTO public.users (id, email, username, allergies, preferences, dietary_restrictions)
SELECT au.id, au.email, split_part(au.email, '@', 1), '[]'::jsonb, '{}'::jsonb, '[]'::jsonb
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL AND au.email_confirmed_at IS NOT NULL;

-- Comptes jamais confirmés : supprimés au bout de 30 jours (il faudra se réinscrire).
-- Tâche planifiée chaque nuit à 3 h UTC (extension pg_cron).
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.delete_unconfirmed_accounts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  removed integer;
BEGIN
  DELETE FROM auth.users
  WHERE email_confirmed_at IS NULL
    AND created_at < now() - interval '30 days';
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_unconfirmed_accounts() FROM PUBLIC, anon, authenticated;

-- Même nom = la tâche existante est remplacée (fichier rejouable)
SELECT cron.schedule(
  'mealsup-delete-unconfirmed-accounts',
  '0 3 * * *',
  'SELECT public.delete_unconfirmed_accounts()'
);


-- ============ ADMINISTRATION ============

-- Compte administrateur de l'app
UPDATE users SET role = 'admin' WHERE lower(email) = 'tomhatonlcsm@gmail.com';

-- L'utilisateur connecté est-il admin ? (utilisée par les règles RLS et les fonctions ci-dessous)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
$$;

-- Personne ne peut se donner lui-même le rôle admin : seul un admin (ou le SQL Editor) change un rôle
CREATE OR REPLACE FUNCTION public.protect_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.role := 'member';
  ELSIF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Only an admin can change a role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS users_protect_role ON users;
CREATE TRIGGER users_protect_role
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION public.protect_user_role();

-- Liste des utilisateurs (admins uniquement)
DROP FUNCTION IF EXISTS public.admin_list_users();
CREATE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  email text,
  username text,
  role text,
  avatar_url text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  RETURN QUERY
    SELECT u.id, u.email::text, u.username::text, u.role::text, u.avatar_url::text,
           u.created_at::timestamptz, au.last_sign_in_at::timestamptz
    FROM public.users u
    LEFT JOIN auth.users au ON au.id = u.id
    ORDER BY u.created_at DESC;
END;
$$;

-- Changer le rôle d'un autre utilisateur (admins uniquement, pas soi-même)
CREATE OR REPLACE FUNCTION public.admin_set_role(target uuid, new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF target = auth.uid() THEN
    RAISE EXCEPTION 'You cannot change your own role';
  END IF;
  IF new_role NOT IN ('member', 'admin') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;
  UPDATE public.users SET role = new_role WHERE id = target;
END;
$$;

-- Supprimer définitivement un compte et ses données (admins uniquement, pas soi-même)
CREATE OR REPLACE FUNCTION public.admin_delete_user(target uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF target = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account here';
  END IF;
  -- ses recettes privées disparaissent avec lui
  DELETE FROM public.recipes WHERE created_by = target;
  -- supprimer le compte de connexion supprime en cascade son profil, frigo, planning, courses...
  DELETE FROM auth.users WHERE id = target;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM anon;
REVOKE ALL ON FUNCTION public.admin_set_role(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.admin_delete_user(uuid) FROM anon;


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
-- Jour où l'alerte de péremption a été envoyée (une seule alerte par aliment)
ALTER TABLE fridge_items ADD COLUMN IF NOT EXISTS expiry_notified_on DATE;


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

-- Un ingrédient = une seule ligne, quelle que soit l'écriture : « Oignons », « oignon »
-- et « OIGNON » ont la même clé (sans accents, sans majuscules, sans pluriel).
CREATE OR REPLACE FUNCTION public.ingredient_norm(txt TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT btrim(regexp_replace(
    regexp_replace(
      translate(replace(replace(lower(coalesce(txt, '')), 'œ', 'oe'), 'æ', 'ae'),
                'àâäáãåçéèêëíìîïñóòôöõúùûüýÿ', 'aaaaaaceeeeiiiinooooouuuuyy'),
      '[^a-z0-9]+', ' ', 'g'),
    '([a-z]{3,})[sx]( |$)', '\1\2', 'g'))
$$;

ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS norm_key TEXT;

CREATE OR REPLACE FUNCTION public.set_ingredient_norm()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.norm_key := public.ingredient_norm(NEW.name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ingredients_set_norm ON ingredients;
CREATE TRIGGER ingredients_set_norm
  BEFORE INSERT OR UPDATE OF name ON ingredients
  FOR EACH ROW EXECUTE FUNCTION public.set_ingredient_norm();

UPDATE ingredients SET norm_key = public.ingredient_norm(name)
WHERE norm_key IS DISTINCT FROM public.ingredient_norm(name);

-- Fusion des doublons déjà en base : on garde celui du catalogue (qui a un rayon),
-- sinon le nom le plus court ; les recettes sont reliées à celui qu'on garde.
WITH ranked AS (
  SELECT id, first_value(id) OVER (
    PARTITION BY norm_key ORDER BY (category IS NULL), length(name), name
  ) AS keep_id
  FROM ingredients
)
UPDATE recipe_ingredients ri
SET ingredient_id = r.keep_id
FROM ranked r
WHERE ri.ingredient_id = r.id AND r.id <> r.keep_id;

WITH ranked AS (
  SELECT id, first_value(id) OVER (
    PARTITION BY norm_key ORDER BY (category IS NULL), length(name), name
  ) AS keep_id
  FROM ingredients
)
DELETE FROM ingredients i
USING ranked r
WHERE i.id = r.id AND r.id <> r.keep_id;

CREATE UNIQUE INDEX IF NOT EXISTS ingredients_norm_key ON ingredients (norm_key);

-- Chaque ligne insérée / modifiée est reliée au catalogue "ingredients"
-- (l'ingrédient y est créé s'il n'existe pas encore, sous l'écriture de la recette).
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

  SELECT id INTO NEW.ingredient_id FROM ingredients WHERE norm_key = public.ingredient_norm(clean_name);
  IF NEW.ingredient_id IS NULL THEN
    INSERT INTO ingredients (name) VALUES (clean_name)
    ON CONFLICT (norm_key) DO NOTHING
    RETURNING id INTO NEW.ingredient_id;
    IF NEW.ingredient_id IS NULL THEN
      SELECT id INTO NEW.ingredient_id FROM ingredients WHERE norm_key = public.ingredient_norm(clean_name);
    END IF;
  END IF;
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
SELECT DISTINCT ON (public.ingredient_norm(btrim(ingredient_name))) btrim(ingredient_name)
FROM recipe_ingredients
WHERE ingredient_name IS NOT NULL AND btrim(ingredient_name) <> ''
ORDER BY public.ingredient_norm(btrim(ingredient_name)), length(btrim(ingredient_name))
ON CONFLICT (norm_key) DO NOTHING;

UPDATE recipe_ingredients ri
SET ingredient_id = i.id
FROM ingredients i
WHERE i.norm_key = public.ingredient_norm(btrim(ri.ingredient_name))
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

-- Nombre de portions prévues (NULL = portions de base de la recette)
ALTER TABLE planned_meals ADD COLUMN IF NOT EXISTS servings INTEGER CHECK (servings IS NULL OR servings BETWEEN 1 AND 50);


-- ============ AVIS SUR LES RECETTES (note + note perso) ============

CREATE TABLE IF NOT EXISTS recipe_ratings (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  rating SMALLINT CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  note TEXT CHECK (note IS NULL OR char_length(note) <= 2000),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, recipe_id)
);


-- ============ ABONNEMENTS AUX NOTIFICATIONS PUSH ============
-- Un abonnement par appareil (téléphone, ordinateur) où l'utilisateur a accepté.

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


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
-- Lus par les admins dans l'app (onglet Feedbacks du mode administrateur).

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Marqué "traité" par l'admin
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS resolved BOOLEAN NOT NULL DEFAULT false;

-- Nouveau message -> fonction feedback-notify (notification push / e-mail aux admins).
-- L'adresse du projet et le secret sont lus dans le coffre-fort Supabase (Vault) :
-- rien de secret ici. Tant qu'ils n'y sont pas, le message est enregistré sans alerte.
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION public.notify_new_feedback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_url text;
  secret text;
BEGIN
  SELECT decrypted_secret INTO project_url FROM vault.decrypted_secrets WHERE name = 'mealsup_project_url';
  SELECT decrypted_secret INTO secret FROM vault.decrypted_secrets WHERE name = 'mealsup_cron_secret';
  IF project_url IS NOT NULL AND secret IS NOT NULL THEN
    PERFORM net.http_post(
      url := rtrim(project_url, '/') || '/functions/v1/feedback-notify',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', secret),
      body := jsonb_build_object('type', 'INSERT', 'table', 'feedback', 'record', jsonb_build_object('id', NEW.id))
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- une alerte ratée ne doit jamais empêcher l'envoi du message
  RAISE WARNING 'notify_new_feedback: %', SQLERRM;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_new_feedback() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS feedback_notify ON feedback;
CREATE TRIGGER feedback_notify
  AFTER INSERT ON feedback
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_feedback();


-- ============ ARTICLES AJOUTÉS PAR L'UTILISATEUR ============
-- Produits absents du catalogue, ajoutés par un membre à sa propre liste
-- d'aliments (onglet Ingrédients des courses), avec un prix facultatif.

CREATE TABLE IF NOT EXISTS user_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
  category TEXT,
  -- prix d'une unité (un paquet, une pièce), en euros ; NULL = prix inconnu
  price NUMERIC(8,2) CHECK (price IS NULL OR (price > 0 AND price < 10000)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_foods_user_name ON user_foods (user_id, lower(btrim(name)));


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
ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_foods ENABLE ROW LEVEL SECURITY;

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

-- Articles ajoutés
DROP POLICY IF EXISTS "Users manage their own foods" ON user_foods;
CREATE POLICY "Users manage their own foods"
  ON user_foods FOR ALL
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


-- Avis : chacun gère les siens
DROP POLICY IF EXISTS "Users manage their own ratings" ON recipe_ratings;
CREATE POLICY "Users manage their own ratings"
  ON recipe_ratings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Abonnements push : chacun gère ceux de ses appareils (l'envoi se fait côté serveur)
DROP POLICY IF EXISTS "Users manage their own push subscriptions" ON push_subscriptions;
CREATE POLICY "Users manage their own push subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Retours : chacun peut envoyer un message en son nom ; seuls les admins les lisent et les gèrent
DROP POLICY IF EXISTS "Users send feedback" ON feedback;
CREATE POLICY "Users send feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins read feedback" ON feedback;
CREATE POLICY "Admins read feedback"
  ON feedback FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins update feedback" ON feedback;
CREATE POLICY "Admins update feedback"
  ON feedback FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins delete feedback" ON feedback;
CREATE POLICY "Admins delete feedback"
  ON feedback FOR DELETE
  USING (public.is_admin());


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


-- ============ PHOTOS DES RECETTES ============

-- URL de la photo + crédit affiché sous la photo (auteur, licence) quand elle
-- n'appartient pas à l'utilisateur (photos libres de Wikimedia Commons pour
-- les recettes de base, voir seed.sql).
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_credit TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_source_url TEXT;

-- Photos des recettes perso : un dossier par utilisateur ({user_id}/...)
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Recipe images are publicly readable" ON storage.objects;
CREATE POLICY "Recipe images are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-images');

DROP POLICY IF EXISTS "Users upload their own recipe images" ON storage.objects;
CREATE POLICY "Users upload their own recipe images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'recipe-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users update their own recipe images" ON storage.objects;
CREATE POLICY "Users update their own recipe images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'recipe-images' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users delete their own recipe images" ON storage.objects;
CREATE POLICY "Users delete their own recipe images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'recipe-images' AND (storage.foldername(name))[1] = auth.uid()::text);


-- ============ SUPPRESSION DE SON PROPRE COMPTE (RGPD) ============

-- Appelée depuis le Profil. Les fichiers (photo de profil, photos de recettes)
-- sont supprimés avant par l'app via l'API Storage (Supabase interdit de les
-- supprimer en SQL).
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  -- ses recettes privées disparaissent avec lui
  DELETE FROM public.recipes WHERE created_by = me;
  -- ses messages restent lisibles par l'admin, mais sans son e-mail
  UPDATE public.feedback SET email = NULL WHERE user_id = me;
  -- supprime en cascade son profil, frigo, planning, courses, favoris, avis...
  DELETE FROM auth.users WHERE id = me;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_my_account() FROM anon;
