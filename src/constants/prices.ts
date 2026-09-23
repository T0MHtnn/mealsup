/*
 * PRIX ESTIMÉS — À TITRE INDICATIF UNIQUEMENT
 *
 * Ordres de grandeur de prix moyens en supermarché en France, saisis à la main
 * pour donner une idée du budget. Ils NE SONT PAS VÉRIFIÉS : aucune source de
 * prix officielle, varient selon la marque, la saison, la région et le
 * magasin, et vieillissent avec l'inflation. L'app les affiche toujours comme
 * des estimations ("≈") avec une mention explicite.
 */

export type PricePer = 'kg' | 'L' | 'unit'

export interface PriceEntry {
  /** Mots-clés (sans accents, "oe" pour "œ"), du plus spécifique au plus générique. */
  keywords: string[]
  /** Prix estimé en euros, par kg, par litre ou par unité. */
  price: number
  per: PricePer
  /** Poids moyen d'une pièce en kg (pour "2 oignons" -> 0,3 kg). */
  unitKg?: number
  /** Conditionnement habituel quand on ajoute l'article "à l'unité" dans la liste. */
  pack?: { qty: number; unit: string }
}

const P = (keywords: string, price: number, per: PricePer, extra: Omit<PriceEntry, 'keywords' | 'price' | 'per'> = {}): PriceEntry => ({
  keywords: keywords.split(',').map((k) => k.trim()),
  price,
  per,
  ...extra,
})

// Ordre important : la première entrée qui correspond l'emporte.
export const PRICE_TABLE: PriceEntry[] = [
  // --- Phrases spécifiques (avant les mots qu'elles contiennent) ---
  P('lait de coco, creme de coco', 5, 'L', { pack: { qty: 400, unit: 'ml' } }),
  P('beurre de cacahuete', 10, 'kg', { pack: { qty: 350, unit: 'g' } }),
  P('pate a tartiner', 7, 'kg', { pack: { qty: 400, unit: 'g' } }),
  P('pate feuilletee, pate brisee, pate a pizza', 1.5, 'unit', { unitKg: 0.23 }),
  P('pate filo, yufka', 9, 'kg', { pack: { qty: 250, unit: 'g' } }),
  P('pates fraiches, gnocchi', 6, 'kg', { pack: { qty: 400, unit: 'g' } }),
  P('pate de curry, pate miso, gochujang, pate d achiote', 20, 'kg', { pack: { qty: 100, unit: 'g' } }),
  P('pate de foie', 12, 'kg'),
  P('thon au naturel, thon a l huile, thon en boite', 15, 'kg', { pack: { qty: 140, unit: 'g' } }),
  P('anchois', 30, 'kg', { unitKg: 0.004 }),
  P('graisse d oie, graisse de canard', 12, 'kg'),
  P('huile de friture', 3, 'L', { pack: { qty: 1, unit: 'L' } }),
  P('huile d olive', 10, 'L', { pack: { qty: 1, unit: 'L' } }),
  P('huile de sesame', 15, 'L', { pack: { qty: 250, unit: 'ml' } }),
  P('huile', 3, 'L', { pack: { qty: 1, unit: 'L' } }),
  P('creme de vinaigre balsamique', 12, 'L'),
  P('vinaigre', 2.5, 'L', { pack: { qty: 1, unit: 'L' } }),
  P('bouillon', 0.4, 'L', { pack: { qty: 1, unit: 'L' } }),
  P('concentre de tomate', 5, 'kg', { pack: { qty: 140, unit: 'g' } }),
  P('tomates concassees, tomates en conserve, tomates san marzano, conserve de tomates, sauce tomate', 2, 'kg', { pack: { qty: 400, unit: 'g' } }),
  P('tomates cerises', 7, 'kg', { pack: { qty: 250, unit: 'g' } }),
  P('pommes de terre, pomme de terre', 1.5, 'kg', { unitKg: 0.15, pack: { qty: 1, unit: 'kg' } }),
  P('patate douce, patates douces', 3.5, 'kg', { unitKg: 0.3 }),
  P('citron vert, citrons verts', 6, 'kg', { unitKg: 0.07 }),
  P('jus de citron', 3.5, 'kg'),
  P('oranges a jus', 2.2, 'kg', { unitKg: 0.2 }),
  P('jus d orange, jus de fruits, jus d ananas, jus', 2, 'L', { pack: { qty: 1, unit: 'L' } }),
  P('fruits rouges', 12, 'kg', { pack: { qty: 250, unit: 'g' } }),
  P('haricots verts', 6, 'kg'),
  P('petits pois', 4, 'kg'),
  P('pousses de soja', 5, 'kg'),
  P('pousses d epinards', 10, 'kg'),
  P('chou fleur', 2.5, 'unit', { unitKg: 1 }),
  P('oignons nouveaux, oignon nouveau', 6, 'kg', { unitKg: 0.03, pack: { qty: 1, unit: 'botte' } }),
  P('pois chiches secs, haricots blancs secs, pois casses', 3, 'kg', { pack: { qty: 500, unit: 'g' } }),
  P('tortilla', 0.3, 'unit', { unitKg: 0.04 }),
  P('pois chiches, haricots rouges, haricots blancs, mais', 2.5, 'kg', { pack: { qty: 400, unit: 'g' } }),
  P('lentilles corail', 4, 'kg', { pack: { qty: 500, unit: 'g' } }),
  P('noix de muscade, muscade', 40, 'kg'),
  P('noix de coco', 10, 'kg'),
  P('noix de cajou, noix de pecan', 25, 'kg'),
  P('raisins secs', 7, 'kg'),
  P('sucre vanille, sucre perle, sucre glace', 5, 'kg'),
  P('sucre de canne, cassonade', 3, 'kg', { pack: { qty: 1, unit: 'kg' } }),
  P('pepites de chocolat', 12, 'kg', { pack: { qty: 200, unit: 'g' } }),
  P('cacao', 12, 'kg', { pack: { qty: 250, unit: 'g' } }),
  P('creme de cassis', 15, 'L'),
  P('eau gazeuse', 0.6, 'L', { pack: { qty: 1, unit: 'L' } }),
  P('lait vegetal', 2, 'L', { pack: { qty: 1, unit: 'L' } }),
  P('lait infantile', 15, 'unit'),
  P('yaourt grec', 5, 'kg', { pack: { qty: 500, unit: 'g' } }),
  P('fromage frais', 10, 'kg', { pack: { qty: 150, unit: 'g' } }),
  P('fromage blanc', 3, 'kg', { pack: { qty: 500, unit: 'g' } }),
  P('fromage rape, emmental', 10, 'kg', { pack: { qty: 200, unit: 'g' } }),
  P('creme liquide', 5, 'L', { pack: { qty: 200, unit: 'ml' } }),
  P('creme fraiche, creme', 6, 'kg', { pack: { qty: 200, unit: 'g' } }),
  P('beurre de tourage, beurre clarifie, ghee', 14, 'kg'),
  P('jambon de bayonne, pancetta, guanciale, chorizo', 25, 'kg', { pack: { qty: 100, unit: 'g' } }),
  P('poitrine fumee, lardons, lard, bacon', 11, 'kg', { pack: { qty: 200, unit: 'g' } }),
  P('bouillon de poulet', 0.4, 'L'),
  P('blancs de poulet, blanc de poulet, escalope de poulet, escalopes de poulet', 14, 'kg', { unitKg: 0.15 }),
  P('cuisses de poulet, hauts de cuisse, ailes de poulet', 6, 'kg', { unitKg: 0.25 }),
  P('carcasses de poulet', 3, 'kg'),
  P('poulet', 7, 'kg', { unitKg: 1.5 }),
  P('boeuf hache, steak hache, porc hache, agneau ou boeuf hache', 13, 'kg', { unitKg: 0.125 }),
  P('faux filet, rumsteck, bavette', 25, 'kg'),
  P('os a moelle', 5, 'kg', { unitKg: 0.25 }),
  P('boeuf, macreuse, paleron, joue', 16, 'kg'),
  P('veau', 25, 'kg'),
  P('poitrine de porc, epaule de porc, porc', 10, 'kg'),
  P('agneau, gigot', 19, 'kg'),
  P('lapin', 14, 'kg'),
  P('cuisses de canard confites, confit', 4, 'unit', { unitKg: 0.25 }),
  P('saucisse, merguez', 10, 'kg', { unitKg: 0.1 }),
  P('saumon', 25, 'kg', { unitKg: 0.13 }),
  P('cabillaud, colin, lotte, poisson', 22, 'kg', { unitKg: 0.15 }),
  P('crevettes', 20, 'kg', { unitKg: 0.03 }),
  P('moules', 5, 'kg'),
  P('thon', 30, 'kg'),
  P('jambon', 14, 'kg', { unitKg: 0.04, pack: { qty: 4, unit: 'tranche' } }),

  // --- Fruits & légumes ---
  P('tomate', 3, 'kg', { unitKg: 0.12 }),
  P('carotte', 1.5, 'kg', { unitKg: 0.1 }),
  P('oignon, petits oignons', 1.8, 'kg', { unitKg: 0.15 }),
  P('echalote', 5, 'kg', { unitKg: 0.03 }),
  P('ail en poudre, gingembre en poudre', 30, 'kg'),
  P('ail', 8, 'kg', { unitKg: 0.05 }),
  P('poireau', 3, 'kg', { unitKg: 0.25 }),
  P('courgette', 2.5, 'kg', { unitKg: 0.25 }),
  P('aubergine', 3.5, 'kg', { unitKg: 0.3 }),
  P('poivron', 4, 'kg', { unitKg: 0.2 }),
  P('concombre', 1, 'unit', { unitKg: 0.4 }),
  P('salade, laitue, romaine', 1.2, 'unit', { unitKg: 0.3 }),
  P('roquette, epinards', 8, 'kg', { pack: { qty: 250, unit: 'g' } }),
  P('brocoli', 3, 'kg', { unitKg: 0.5 }),
  P('chou', 2, 'kg', { unitKg: 1 }),
  P('champignons, champignon', 5, 'kg', { pack: { qty: 250, unit: 'g' } }),
  P('shiitake', 20, 'kg'),
  P('potiron, courge', 2.5, 'kg'),
  P('navet, betterave', 2.5, 'kg', { unitKg: 0.15 }),
  P('radis', 6, 'kg', { unitKg: 0.015, pack: { qty: 1, unit: 'botte' } }),
  P('celeri, fenouil', 3.5, 'kg', { unitKg: 0.3 }),
  P('avocat', 1.2, 'unit', { unitKg: 0.2 }),
  P('citron', 3.5, 'kg', { unitKg: 0.12 }),
  P('orange', 2.5, 'kg', { unitKg: 0.2 }),
  P('pomme', 2.5, 'kg', { unitKg: 0.15 }),
  P('poire', 3, 'kg', { unitKg: 0.17 }),
  P('banane', 2, 'kg', { unitKg: 0.12 }),
  P('fraise', 8, 'kg', { pack: { qty: 250, unit: 'g' } }),
  P('framboise, myrtille', 15, 'kg', { pack: { qty: 125, unit: 'g' } }),
  P('cerise', 8, 'kg'),
  P('ananas', 2.5, 'unit', { unitKg: 1.2 }),
  P('mangue', 1.8, 'unit', { unitKg: 0.4 }),
  P('kiwi', 4, 'kg', { unitKg: 0.08 }),
  P('raisin', 4, 'kg'),
  P('persil, coriandre, basilic, menthe, aneth, ciboulette, estragon, sauge, herbes', 1.2, 'unit', { unitKg: 0.03, pack: { qty: 1, unit: 'bouquet' } }),
  P('thym seche, origan seche, herbes de provence', 30, 'kg'),
  P('thym, romarin, laurier', 1.2, 'unit', { unitKg: 0.02, pack: { qty: 1, unit: 'bouquet' } }),
  P('gingembre', 8, 'kg'),
  P('edamame, asperge', 9, 'kg'),
  P('daikon', 4, 'kg'),
  P('jalapeno, piment frais', 10, 'kg', { unitKg: 0.02 }),
  P('legumes surgeles', 3, 'kg', { pack: { qty: 1, unit: 'kg' } }),

  // --- Crèmerie & œufs ---
  P('oeuf, jaune d oeuf, jaunes d oeufs, blancs d oeufs', 0.3, 'unit', { unitKg: 0.06, pack: { qty: 6, unit: 'unité' } }),
  P('lait', 1.05, 'L', { pack: { qty: 1, unit: 'L' } }),
  P('beurre', 10, 'kg', { pack: { qty: 250, unit: 'g' } }),
  P('yaourt', 3, 'kg', { unitKg: 0.125, pack: { qty: 4, unit: 'unité' } }),
  P('mozzarella', 10, 'kg', { unitKg: 0.125 }),
  P('parmesan, pecorino, kefalotyri', 25, 'kg', { pack: { qty: 150, unit: 'g' } }),
  P('comte, gruyere', 17, 'kg', { pack: { qty: 200, unit: 'g' } }),
  P('reblochon', 14, 'kg', { unitKg: 0.45 }),
  P('camembert', 2.5, 'unit', { unitKg: 0.25 }),
  P('feta', 12, 'kg', { pack: { qty: 200, unit: 'g' } }),
  P('mascarpone', 9, 'kg', { pack: { qty: 250, unit: 'g' } }),
  P('cheddar', 14, 'kg'),
  P('fromage', 12, 'kg'),
  P('desserts lactes', 3, 'kg', { pack: { qty: 4, unit: 'unité' } }),

  // --- Boulangerie ---
  P('mie de pain, pain rassis', 4, 'kg'),
  P('pain de mie', 1.8, 'unit', { unitKg: 0.5 }),
  P('pains a burger, pain a burger', 0.5, 'unit', { unitKg: 0.075 }),
  P('pain pita, pita', 0.4, 'unit', { unitKg: 0.08 }),
  P('pains au lait', 0.3, 'unit', { unitKg: 0.035 }),
  P('pains au chocolat, pain au chocolat', 1.2, 'unit', { unitKg: 0.07 }),
  P('croissant', 1.1, 'unit', { unitKg: 0.06 }),
  P('baguette', 1.1, 'unit', { unitKg: 0.25 }),
  P('brioche', 6, 'kg', { unitKg: 0.4 }),
  P('pain', 5, 'kg', { unitKg: 0.5 }),

  // --- Épicerie salée ---
  P('riz basmati, riz jasmin, riz a sushi, riz rond, riz complet', 4, 'kg', { pack: { qty: 1, unit: 'kg' } }),
  P('riz arborio, riz carnaroli, riz bomba', 6, 'kg', { pack: { qty: 1, unit: 'kg' } }),
  P('riz', 2.5, 'kg', { pack: { qty: 1, unit: 'kg' } }),
  P('pates, spaghetti, linguine, coquillettes, vermicelles, trofie, lasagne', 2, 'kg', { pack: { qty: 500, unit: 'g' } }),
  P('nouilles', 5, 'kg', { pack: { qty: 250, unit: 'g' } }),
  P('farine de pois chiche, farine de seigle, farine de gruau, farine type 00', 3, 'kg'),
  P('farine', 1.2, 'kg', { pack: { qty: 1, unit: 'kg' } }),
  P('semoule, couscous', 2, 'kg', { pack: { qty: 1, unit: 'kg' } }),
  P('quinoa', 8, 'kg', { pack: { qty: 500, unit: 'g' } }),
  P('lentilles', 3, 'kg', { pack: { qty: 500, unit: 'g' } }),
  P('olives', 12, 'kg', { pack: { qty: 200, unit: 'g' } }),
  P('chapelure, panko', 4, 'kg'),
  P('sauce soja, nuoc mam, sauce poisson, mirin, sake', 8, 'L', { pack: { qty: 250, unit: 'ml' } }),
  P('marsala', 12, 'L'),
  P('feuilles de nori, nori', 0.35, 'unit', { unitKg: 0.0025 }),
  P('dashi', 2, 'L'),
  P('kombu, wakame, copeaux de bonite', 60, 'kg'),
  P('pesto', 15, 'kg', { pack: { qty: 190, unit: 'g' } }),
  P('tahini', 12, 'kg'),
  P('choucroute', 3, 'kg'),
  P('tofu', 8, 'kg', { pack: { qty: 400, unit: 'g' } }),
  P('houmous', 10, 'kg', { pack: { qty: 200, unit: 'g' } }),
  P('surimi', 9, 'kg', { pack: { qty: 250, unit: 'g' } }),
  P('chips, crackers', 8, 'kg', { pack: { qty: 150, unit: 'g' } }),
  P('graines, fecule', 6, 'kg'),
  P('proteine', 30, 'kg'),

  // --- Épicerie sucrée ---
  P('sucre', 1.3, 'kg', { pack: { qty: 1, unit: 'kg' } }),
  P('chocolat', 12, 'kg', { unitKg: 0.005, pack: { qty: 200, unit: 'g' } }),
  P('miel', 12, 'kg', { pack: { qty: 500, unit: 'g' } }),
  P('confiture', 5, 'kg', { pack: { qty: 370, unit: 'g' } }),
  P('cafe expresso', 3, 'L'),
  P('cafe', 12, 'kg', { pack: { qty: 250, unit: 'g' } }),
  P('the', 0.08, 'unit', { unitKg: 0.002, pack: { qty: 25, unit: 'sachet' } }),
  P('flocons, cereales, granola', 4, 'kg', { pack: { qty: 500, unit: 'g' } }),
  P('levure boulangere, levure fraiche', 10, 'kg', { pack: { qty: 42, unit: 'g' } }),
  P('levure', 15, 'kg', { unitKg: 0.011, pack: { qty: 1, unit: 'sachet' } }),
  P('bicarbonate', 5, 'kg'),
  P('gousse de vanille', 2.5, 'unit', { unitKg: 0.004 }),
  P('extrait de vanille, vanille', 60, 'L'),
  P('sirop d erable', 25, 'L', { pack: { qty: 250, unit: 'ml' } }),
  P('biscuits, savoiardi', 6, 'kg', { pack: { qty: 200, unit: 'g' } }),
  P('compote', 3, 'kg', { pack: { qty: 4, unit: 'unité' }, unitKg: 0.1 }),
  P('amandes, noisettes', 15, 'kg', { pack: { qty: 200, unit: 'g' } }),
  P('noix', 14, 'kg', { pack: { qty: 200, unit: 'g' } }),
  P('pistaches', 30, 'kg'),
  P('pignons', 50, 'kg'),
  P('dattes, pruneaux', 8, 'kg'),
  P('fruits secs', 15, 'kg', { pack: { qty: 200, unit: 'g' } }),

  // --- Épices & condiments ---
  P('safran', 1, 'unit', { unitKg: 0.0005 }),
  P('gros sel, sel', 1, 'kg', { pack: { qty: 1, unit: 'kg' } }),
  P('poivre', 40, 'kg', { pack: { qty: 50, unit: 'g' } }),
  P('vanille, cardamome, badiane, clou de girofle, clous de girofle, genievre', 60, 'kg', { unitKg: 0.001 }),
  P('cumin, paprika, curry, curcuma, cannelle, garam masala, piment, origan, epices, coriandre moulue, graines de coriandre', 30, 'kg', { unitKg: 0.003, pack: { qty: 40, unit: 'g' } }),
  P('bouquet garni', 0.4, 'unit', { unitKg: 0.02 }),
  P('moutarde', 5, 'kg', { pack: { qty: 200, unit: 'g' } }),
  P('mayonnaise', 6, 'kg', { pack: { qty: 235, unit: 'g' } }),
  P('ketchup', 4, 'kg', { pack: { qty: 500, unit: 'g' } }),
  P('cornichon, capres', 8, 'kg', { unitKg: 0.01, pack: { qty: 200, unit: 'g' } }),
  P('sauce worcestershire, sauce piquante, wasabi, harissa, sauce', 15, 'L', { pack: { qty: 150, unit: 'ml' } }),

  // --- Boissons ---
  P('eau', 0.3, 'L', { pack: { qty: 1.5, unit: 'L' } }),
  P('sodas, soda, limonade', 1.6, 'L', { pack: { qty: 1.5, unit: 'L' } }),
  P('sirop', 4, 'L', { pack: { qty: 75, unit: 'cl' } }),
  P('prosecco', 10, 'L', { pack: { qty: 75, unit: 'cl' } }),
  P('aperol', 16, 'L', { pack: { qty: 70, unit: 'cl' } }),
  P('rhum, tequila, triple sec, cointreau', 25, 'L', { pack: { qty: 70, unit: 'cl' } }),
  P('brandy, cognac', 40, 'L', { pack: { qty: 70, unit: 'cl' } }),
  P('vin', 8, 'L', { pack: { qty: 75, unit: 'cl' } }),
  P('biere', 3, 'L', { pack: { qty: 6, unit: 'unité' }, unitKg: 0.25 }),

  // --- Surgelés ---
  P('frites', 2.5, 'kg', { pack: { qty: 1, unit: 'kg' } }),
  P('glace pilee, glacons', 2, 'kg', { unitKg: 0.02, pack: { qty: 2, unit: 'kg' } }),
  P('poisson pane', 10, 'kg', { pack: { qty: 400, unit: 'g' } }),
  P('pizza surgelee', 3, 'unit', { unitKg: 0.4 }),
  P('glaces, glace', 6, 'L', { pack: { qty: 1, unit: 'L' } }),

  // --- Hygiène & beauté ---
  P('papier toilette', 5, 'unit'),
  P('gel douche, shampoing, apres shampoing', 3.5, 'unit'),
  P('savon', 2, 'unit'),
  P('dentifrice', 2.5, 'unit'),
  P('brosses a dents', 3, 'unit'),
  P('deodorant, mousse a raser', 3, 'unit'),
  P('rasoirs', 6, 'unit'),
  P('coton tiges, cotons demaquillants, mouchoirs', 2, 'unit'),
  P('creme hydratante', 5, 'unit'),
  P('protections hygieniques', 4, 'unit'),
  P('pansements', 3, 'unit'),
  P('medicaments', 5, 'unit'),

  // --- Entretien & maison ---
  P('lessive', 10, 'unit'),
  P('adoucissant', 4, 'unit'),
  P('liquide vaisselle', 2, 'unit'),
  P('tablettes lave vaisselle', 8, 'unit'),
  P('eponges', 2, 'unit'),
  P('essuie tout, sacs poubelle, nettoyant multi usage, produit wc, nettoyant vitres', 3, 'unit'),
  P('javel', 1.5, 'unit'),
  P('papier aluminium, film alimentaire, papier cuisson, sacs congelation', 2.5, 'unit'),
  P('piles', 6, 'unit'),
  P('ampoules', 5, 'unit'),
  P('bougies', 4, 'unit'),
  P('allumettes', 1, 'unit'),

  // --- Bébé & animaux ---
  P('couches', 12, 'unit'),
  P('lingettes', 3, 'unit'),
  P('petits pots', 1.5, 'unit'),
  P('liniment', 5, 'unit'),
  P('croquettes chat', 10, 'unit'),
  P('croquettes chien', 12, 'unit'),
  P('patee', 1, 'unit'),
  P('litiere', 6, 'unit'),
  P('friandises', 3, 'unit'),
]

/** Prix moyen au kg (ou au litre) par rayon, quand aucun produit ne correspond. */
export const CATEGORY_FALLBACK_PRICE: Record<string, number> = {
  'Fruits & Légumes': 3,
  'Boucherie & Poissonnerie': 15,
  'Frais & Traiteur': 12,
  'Crèmerie & Œufs': 8,
  Boulangerie: 5,
  'Épicerie salée': 4,
  'Épicerie sucrée': 8,
  'Épices & Condiments': 30,
  Boissons: 3,
  Surgelés: 5,
}

/**
 * Coefficient appliqué selon l'enseigne choisie dans le profil (1 = moyenne).
 * Ordres de grandeur NON VÉRIFIÉS, inspirés des classements de prix publiés
 * régulièrement dans la presse ; ils ne reflètent pas un magasin précis.
 */
export const STORES = [
  { key: 'average', label: 'Moyenne des enseignes', factor: 1 },
  { key: 'leclerc', label: 'E.Leclerc', factor: 0.93 },
  { key: 'lidl', label: 'Lidl', factor: 0.9 },
  { key: 'aldi', label: 'Aldi', factor: 0.9 },
  { key: 'intermarche', label: 'Intermarché', factor: 0.97 },
  { key: 'auchan', label: 'Auchan', factor: 0.98 },
  { key: 'superu', label: 'Super U / Hyper U', factor: 0.99 },
  { key: 'carrefour', label: 'Carrefour', factor: 1 },
  { key: 'casino', label: 'Casino / Géant', factor: 1.08 },
  { key: 'franprix', label: 'Franprix', factor: 1.15 },
  { key: 'monoprix', label: 'Monoprix', factor: 1.18 },
] as const

export type StoreKey = (typeof STORES)[number]['key']

/** Seuil du filtre "Petit budget", en euros par portion. */
export const LOW_BUDGET_PER_SERVING = 2
