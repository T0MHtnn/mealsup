import { GENERIC_FOODS, GROCERY_CATALOG, GROCERY_CATEGORIES, type GroceryCategory } from '@/constants/groceryCatalog'
import { normalizeText } from '@/utils/text'

/** Lowercase, no accents, "œ" -> "oe", punctuation -> spaces: "Huile d'olive" -> "huile d olive". */
export function simplify(value: string): string {
  return normalizeText(value)
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

type Rule = [keywords: string[], category: GroceryCategory]

// Checked in order, first match wins: specific phrases come before the generic
// words they contain ("lait de coco" before "lait", "vinaigre" before "vin"...).
const RULES: Rule[] = [
  // --- Non alimentaire (avant tout : "crème solaire", "lait infantile", "tampons à récurer"...) ---
  [['lait infantile', 'lait 1er age', 'lait 2e age', 'petits pots', 'couches', 'lingettes bebe', 'biberon', 'tetine',
    'liniment', 'gel lavant bebe'], 'Bébé'],
  [['croquettes', 'patee', 'litiere', 'friandises pour', 'friandises chien', 'friandises chat', 'antiparasitaire',
    'graines pour oiseaux', 'nourriture pour'], 'Animaux'],
  [['tampons a recurer', 'lessive', 'adoucissant', 'liquide vaisselle', 'lave vaisselle', 'eponge', 'essuie tout',
    'sacs poubelle', 'sac poubelle', 'nettoyant', 'javel', 'produit wc', 'gel wc', 'desodorisant', 'detartrant',
    'deboucheur', 'serpilliere', 'balai', 'torchon', 'papier aluminium', 'film alimentaire', 'papier cuisson',
    'sacs congelation', 'sacs zip', 'piles', 'ampoule', 'ampoules', 'allumettes', 'bougie', 'bougies', 'briquet',
    'insecticide', 'microfibre', 'microfibres', 'gants de menage', 'serviettes en papier', 'filtres a cafe',
    'charbon de bois', 'stylo', 'stylos', 'cahier', 'enveloppes', 'ramette', 'terreau', 'engrais'], 'Entretien & Maison'],
  [['papier toilette', 'gel douche', 'savon', 'shampoing', 'apres shampoing', 'dentifrice', 'brosse a dents',
    'brosses a dents', 'bain de bouche', 'fil dentaire', 'deodorant', 'rasoir', 'rasoirs', 'mousse a raser',
    'creme solaire', 'apres soleil', 'creme hydratante', 'lait corporel', 'demaquillant', 'eau micellaire',
    'mascara', 'rouge a levres', 'vernis a ongles', 'coton tiges', 'cotons demaquillants', 'coton hydrophile',
    'mouchoirs', 'serviettes hygieniques', 'tampons', 'protege slips', 'protections hygieniques', 'pansements',
    'compresses', 'preservatifs', 'gel hydroalcoolique', 'laque', 'coloration'], 'Hygiène & Beauté'],

  // --- Phrases spécifiques ---
  [['huile', 'vinaigre', 'lait de coco', 'creme de coco', 'bouillon', 'concentre de tomate', 'tomates concassees',
    'tomates en conserve', 'sauce tomate', 'tomates san marzano', 'confit', 'confites', 'thon au naturel',
    'thon a l huile', 'thon en boite', 'fecule', 'feuilles de nori', 'mirin', 'sake', 'marsala', 'gingembre marine',
    'pois casses', 'pois chiches', 'dashi', 'copeaux de bonite', 'haricots rouges', 'haricots blancs', 'mais en conserve', 'pate de curry',
    'pate de curry rouge', 'pate miso'], 'Épicerie salée'],
  [['beurre de cacahuete', 'chocolat', 'noix de coco', 'noix de cajou', 'noix de pecan', 'raisins secs', 'sucre',
    'pate a tartiner', 'creme de vinaigre balsamique'], 'Épicerie sucrée'],
  [['noix de muscade', 'ail en poudre', 'gingembre en poudre', 'coriandre moulue', 'graines de coriandre',
    'herbes de provence', 'thym seche', 'origan seche', 'piment en poudre', 'piment de cayenne',
    'piment d espelette', 'piment en flocons', 'piment doux', 'bouquet garni', 'gros sel', 'poivre en grains',
    'sauce soja', 'sauce worcestershire', 'sauce piquante', 'sauce poisson', 'nuoc mam', 'piments guajillo',
    'piments ancho'], 'Épices & Condiments'],
  [['creme de cassis'], 'Boissons'],
  [['beurre'], 'Crèmerie & Œufs'],
  [['jus de citron', 'zeste d orange', 'haricots verts', 'petits pois', 'pousses de soja', 'pousses d epinards',
    'pommes de terre', 'pomme de terre', 'patate douce', 'patates douces', 'chou fleur', 'chou rouge',
    'oignons nouveaux', 'oignon nouveau', 'citron vert', 'citrons verts', 'fruits rouges', 'oranges a jus'], 'Fruits & Légumes'],
  [['pates fraiches', 'pate feuilletee', 'pate brisee', 'pate a pizza', 'pate filo', 'yufka', 'pate de foie',
    'fromage frais', 'choucroute'], 'Frais & Traiteur'],
  [['blancs de poulet', 'blanc de poulet', 'os a moelle', 'plat de cotes', 'faux filet', 'fruits de mer',
    'poissons de roche'], 'Boucherie & Poissonnerie'],
  [['mie de pain', 'pain rassis', 'pains a burger', 'pain a burger'], 'Boulangerie'],
  [['glace pilee', 'glacons', 'congelee', 'congelees', 'congele', 'surgele', 'surgelee', 'surgelees',
    'frites'], 'Surgelés'],
  [['jaune d oeuf', 'jaunes d oeufs', 'blanc d oeuf', 'blancs d oeufs', 'lait vegetal'], 'Crèmerie & Œufs'],

  // --- Mots génériques ---
  [['sel', 'poivre', 'muscade', 'cumin', 'paprika', 'curry', 'curcuma', 'cannelle', 'garam masala',
    'cardamome', 'clou de girofle', 'clous de girofle', 'badiane', 'safran', 'laurier', 'genievre', 'epices',
    'origan', 'moutarde', 'mayonnaise', 'ketchup', 'harissa', 'wasabi', 'gochujang', 'achiote', 'capres',
    'cornichon', 'tahini', 'sauce'], 'Épices & Condiments'],
  [['jambon', 'lardons', 'lard', 'bacon', 'pancetta', 'guanciale', 'chorizo', 'saucisson', 'charcuterie',
    'tofu', 'houmous', 'surimi', 'gnocchi', 'blinis', 'rillettes'], 'Frais & Traiteur'],
  [['oeuf', 'lait', 'beurre', 'creme', 'yaourt', 'fromage', 'mozzarella', 'parmesan', 'pecorino', 'gruyere',
    'emmental', 'comte', 'reblochon', 'camembert', 'feta', 'mascarpone', 'ricotta', 'cheddar', 'kefalotyri',
    'ghee', 'skyr'], 'Crèmerie & Œufs'],
  [['poulet', 'volaille', 'dinde', 'canard', 'boeuf', 'veau', 'porc', 'agneau', 'lapin', 'saucisse', 'merguez',
    'steak', 'escalope', 'cuisse', 'ailes', 'viande', 'jarret', 'couenne', 'poitrine', 'macreuse', 'paleron',
    'joue', 'gigot', 'carcasses', 'bavette', 'rumsteck', 'saumon', 'cabillaud', 'colin', 'lotte', 'poisson',
    'crevettes', 'moules', 'calamar', 'thon', 'truite', 'dorade', 'bonite'], 'Boucherie & Poissonnerie'],
  [['pain', 'baguette', 'brioche', 'croissant', 'pita', 'tortilla', 'buns'], 'Boulangerie'],
  [['pates', 'spaghetti', 'linguine', 'lasagne', 'nouilles', 'vermicelles', 'coquillettes', 'trofie', 'riz',
    'semoule', 'couscous', 'quinoa', 'farine', 'lentilles', 'olives', 'thon', 'anchois', 'sardines', 'mais',
    'chapelure', 'panko', 'crackers', 'chips', 'kombu', 'wakame', 'nori', 'dashi', 'graines', 'savoiardi',
    'proteine'], 'Épicerie salée'],
  [['cassonade', 'miel', 'confiture', 'chocolat', 'pepites', 'cacao', 'levure', 'bicarbonate', 'vanille',
    'extrait de vanille', 'sirop d erable', 'biscuits', 'cereales', 'flocons', 'granola', 'amandes', 'noisettes',
    'noix', 'pistaches', 'pignons', 'dattes', 'pruneaux', 'cafe', 'the', 'compote'], 'Épicerie sucrée'],
  [['eau', 'vin', 'biere', 'jus', 'soda', 'sodas', 'limonade', 'sirop', 'prosecco', 'aperol', 'rhum', 'tequila',
    'triple sec', 'cointreau', 'brandy', 'cognac', 'cassis'], 'Boissons'],
  [['glace', 'glaces'], 'Surgelés'],
  [['tomate', 'carotte', 'oignon', 'echalote', 'ail', 'poireau', 'celeri', 'fenouil', 'courgette', 'aubergine',
    'poivron', 'concombre', 'salade', 'laitue', 'romaine', 'roquette', 'epinards', 'chou', 'brocoli',
    'champignon', 'champignons', 'shiitake', 'potiron', 'courge', 'navet', 'radis', 'betterave', 'avocat',
    'avocats', 'citron', 'orange', 'oranges', 'pomme', 'pommes', 'poire', 'banane', 'fraise', 'framboise',
    'myrtille', 'cerise', 'ananas', 'mangue', 'kiwi', 'raisin', 'herbes', 'persil', 'coriandre', 'basilic',
    'menthe', 'aneth', 'ciboulette', 'thym', 'romarin', 'estragon', 'sauge', 'gingembre', 'edamame',
    'daikon', 'asperge', 'jalapeno', 'piment', 'piments', 'citronnelle', 'feves', 'legumes', 'fruits'],
    'Fruits & Légumes'],
]

const CATALOG_INDEX = new Map<string, GroceryCategory>()
for (const category of GROCERY_CATEGORIES) {
  for (const item of [...(GENERIC_FOODS[category] ?? []), ...GROCERY_CATALOG[category]]) CATALOG_INDEX.set(simplify(item), category)
}

const COMPILED = RULES.map(([keywords, category]) => ({
  category,
  patterns: keywords.map((kw) => new RegExp(`(^| )${kw}(s|x)?( |$)`)),
}))

/** Supermarket aisle of a product or recipe ingredient, from its name. */
export function classifyGroceryItem(name: string): GroceryCategory {
  const simple = simplify(name)
  const fromCatalog = CATALOG_INDEX.get(simple)
  if (fromCatalog) return fromCatalog
  for (const { category, patterns } of COMPILED) {
    if (patterns.some((re) => re.test(simple))) return category
  }
  return 'Épicerie salée'
}

/** Category to display for a stored item: its own if still valid, otherwise guessed from its name. */
export function itemCategory(item: { category?: string | null; food_name: string }): GroceryCategory {
  const known = (GROCERY_CATEGORIES as readonly string[]).includes(item.category || '')
  return known ? (item.category as GroceryCategory) : classifyGroceryItem(item.food_name)
}
