-- ============ SEED RECIPES DE BASE ============
-- À exécuter dans le SQL Editor de Supabase après avoir créé les tables

-- Insert base recipes (created_by = NULL pour les recettes "système")
INSERT INTO recipes (title, description, prep_time_mins, cook_time_mins, servings, difficulty, dietary_type, tags, visibility) VALUES
(
  'Pâtes à la Carbonara',
  'Classique italien: pâtes, œufs, guanciale et pecorino romano',
  10,
  15,
  2,
  2,
  'gras',
  '["italien", "pâtes", "rapide"]'::jsonb,
  'public'
),
(
  'Salade Niçoise',
  'Salade méditerranéenne fraîche avec œufs durs et anchois',
  15,
  10,
  2,
  1,
  'light',
  '["salade", "méditerranéen", "léger", "végétarien"]'::jsonb,
  'public'
),
(
  'Poulet Rôti aux Herbes',
  'Poulet entier rôti avec thym, romarin et ail',
  15,
  60,
  4,
  2,
  'protéiné',
  '["poulet", "viande", "four", "classique"]'::jsonb,
  'public'
),
(
  'Riz Complet aux Légumes',
  'Riz complet accompagné de légumes de saison',
  10,
  25,
  2,
  1,
  'light',
  '["riz", "légumes", "végétarien", "sain"]'::jsonb,
  'public'
),
(
  'Omelette aux Champignons',
  'Omelette fluffy avec champignons sautés',
  5,
  10,
  1,
  1,
  'protéiné',
  '["œufs", "champignons", "rapide", "petit-déj"]'::jsonb,
  'public'
),
(
  'Soupe à l\'Oignon',
  'Soupe gratinée à l\'oignon, classique français',
  20,
  40,
  4,
  2,
  'light',
  '["soupe", "français", "réconfortant"]'::jsonb,
  'public'
),
(
  'Tacos au Poulet',
  'Tacos avec poulet mariné, salsa et guacamole',
  20,
  15,
  4,
  2,
  'protéiné',
  '["mexique", "poulet", "tacos", "rapide"]'::jsonb,
  'public'
),
(
  'Poke Bowl Saumon',
  'Bol avec saumon cru marinalisé, riz et légumes',
  15,
  5,
  2,
  1,
  'protéiné',
  '["poisson", "saumon", "hawaï", "frais", "low-carb"]'::jsonb,
  'public'
),
(
  'Curry de Pois Chiches',
  'Curry végétarien riche et savoureux',
  10,
  25,
  2,
  2,
  'protéiné',
  '["curry", "végétarien", "pois-chiches", "indien"]'::jsonb,
  'public'
),
(
  'Courgettes Farcies',
  'Courgettes évidées et farcies à la viande hachée',
  20,
  35,
  4,
  2,
  'protéiné',
  '["légumes", "viande", "four", "complet"]'::jsonb,
  'public'
);

-- Insert ingredients pour chaque recette
-- 1. Carbonara
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Pâtes', 400, 'g' FROM recipes WHERE title = 'Pâtes à la Carbonara';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Œufs', 3, 'pièce' FROM recipes WHERE title = 'Pâtes à la Carbonara';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Guanciale', 200, 'g' FROM recipes WHERE title = 'Pâtes à la Carbonara';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Pecorino Romano', 100, 'g' FROM recipes WHERE title = 'Pâtes à la Carbonara';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Sel', 1, 'pincée' FROM recipes WHERE title = 'Pâtes à la Carbonara';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Poivre', 1, 'pincée' FROM recipes WHERE title = 'Pâtes à la Carbonara';

-- 2. Salade Niçoise
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Laitue Romaine', 200, 'g' FROM recipes WHERE title = 'Salade Niçoise';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Tomate', 2, 'pièce' FROM recipes WHERE title = 'Salade Niçoise';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Œufs durs', 2, 'pièce' FROM recipes WHERE title = 'Salade Niçoise';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Anchois', 50, 'g' FROM recipes WHERE title = 'Salade Niçoise';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Olives noires', 100, 'g' FROM recipes WHERE title = 'Salade Niçoise';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Huile d\'olive', 3, 'c.s.' FROM recipes WHERE title = 'Salade Niçoise';

-- 3. Poulet Rôti
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Poulet entier', 1.5, 'kg' FROM recipes WHERE title = 'Poulet Rôti aux Herbes';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Thym frais', 10, 'g' FROM recipes WHERE title = 'Poulet Rôti aux Herbes';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Romarin frais', 10, 'g' FROM recipes WHERE title = 'Poulet Rôti aux Herbes';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Ail', 4, 'gousse' FROM recipes WHERE title = 'Poulet Rôti aux Herbes';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Huile d\'olive', 2, 'c.s.' FROM recipes WHERE title = 'Poulet Rôti aux Herbes';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Sel & Poivre', 1, 'à goût' FROM recipes WHERE title = 'Poulet Rôti aux Herbes';

-- 4. Riz Complet aux Légumes
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Riz complet', 200, 'g' FROM recipes WHERE title = 'Riz Complet aux Légumes';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Brocoli', 150, 'g' FROM recipes WHERE title = 'Riz Complet aux Légumes';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Carotte', 100, 'g' FROM recipes WHERE title = 'Riz Complet aux Légumes';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Oignon', 1, 'pièce' FROM recipes WHERE title = 'Riz Complet aux Légumes';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Bouillon de légumes', 400, 'ml' FROM recipes WHERE title = 'Riz Complet aux Légumes';

-- 5. Omelette
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Œufs', 3, 'pièce' FROM recipes WHERE title = 'Omelette aux Champignons';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Champignons de Paris', 200, 'g' FROM recipes WHERE title = 'Omelette aux Champignons';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Beurre', 20, 'g' FROM recipes WHERE title = 'Omelette aux Champignons';
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity, unit) 
SELECT id, 'Sel & Poivre', 1, 'à goût' FROM recipes WHERE title = 'Omelette aux Champignons';

-- Notes:
-- - Ces recettes ont visibility = 'public' donc tout le monde peut les voir
-- - created_by = NULL pour indiquer qu'elles sont de base de l'app
-- - À adapter et enrichir selon tes besoins
-- - Les images peuvent être ajoutées via Supabase Storage
