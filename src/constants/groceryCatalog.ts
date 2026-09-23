// Rayons de supermarché, dans l'ordre où on les parcourt en magasin
export const GROCERY_CATEGORIES = [
  'Fruits & Légumes',
  'Boucherie & Poissonnerie',
  'Frais & Traiteur',
  'Crèmerie & Œufs',
  'Boulangerie',
  'Épicerie salée',
  'Épicerie sucrée',
  'Épices & Condiments',
  'Boissons',
  'Surgelés',
  'Hygiène & Beauté',
  'Entretien & Maison',
  'Bébé',
  'Animaux',
] as const

export type GroceryCategory = (typeof GROCERY_CATEGORIES)[number]

/** Rayons alimentaires (les autres ne contiennent pas d'aliments). */
export const FOOD_CATEGORIES: GroceryCategory[] = [
  'Fruits & Légumes',
  'Boucherie & Poissonnerie',
  'Frais & Traiteur',
  'Crèmerie & Œufs',
  'Boulangerie',
  'Épicerie salée',
  'Épicerie sucrée',
  'Épices & Condiments',
  'Boissons',
  'Surgelés',
]

export const GROCERY_CATALOG: Record<GroceryCategory, string[]> = {
  'Fruits & Légumes': [
    'Pommes', 'Bananes', 'Oranges', 'Citrons', 'Citrons verts', 'Fraises', 'Poires', 'Raisins', 'Kiwis',
    'Tomates', 'Carottes', 'Pommes de terre', 'Oignons', 'Ail', 'Échalotes', 'Courgettes',
    'Poivrons', 'Salade', 'Concombre', 'Brocoli', 'Champignons', 'Avocat', 'Épinards',
    'Poireaux', 'Aubergines', 'Patate douce', 'Persil', 'Basilic', 'Coriandre', 'Menthe', 'Gingembre',
  ],
  'Boucherie & Poissonnerie': [
    'Poulet', 'Blancs de poulet', 'Bœuf haché', 'Steak haché', 'Escalope de poulet', 'Saucisses',
    'Porc', 'Agneau', 'Veau', 'Dinde', 'Merguez', 'Saumon', 'Cabillaud', 'Thon frais', 'Crevettes', 'Moules',
  ],
  'Frais & Traiteur': [
    'Jambon', 'Lardons', 'Bacon', 'Chorizo', 'Pâte feuilletée', 'Pâte brisée', 'Pâte à pizza',
    'Pâtes fraîches', 'Gnocchis', 'Tofu', 'Houmous', 'Surimi',
  ],
  'Crèmerie & Œufs': [
    'Lait', 'Beurre', 'Œufs', 'Yaourt nature', 'Crème fraîche', 'Crème liquide', 'Fromage râpé',
    'Camembert', 'Emmental', 'Comté', 'Mozzarella', 'Parmesan', 'Feta', 'Fromage blanc', 'Fromage frais',
    'Mascarpone', 'Desserts lactés',
  ],
  'Boulangerie': [
    'Baguette', 'Pain de campagne', 'Pain de mie', 'Brioche', 'Croissants', 'Pains au chocolat',
    'Pains au lait', 'Tortillas', 'Pains à burger', 'Pain pita',
  ],
  'Épicerie salée': [
    'Pâtes', 'Riz', 'Farine', 'Semoule', 'Quinoa', "Huile d'olive", 'Huile neutre', 'Vinaigre',
    'Conserve de tomates', 'Concentré de tomate', 'Pois chiches', 'Haricots rouges', 'Lentilles',
    'Lait de coco', 'Thon en boîte', 'Olives', 'Bouillon cube', 'Chapelure', 'Sauce soja', 'Chips', 'Crackers',
  ],
  'Épicerie sucrée': [
    'Sucre', 'Céréales', "Flocons d'avoine", 'Café', 'Thé', 'Chocolat', 'Cacao en poudre', 'Miel',
    'Confiture', 'Pâte à tartiner', 'Biscuits', 'Compote', 'Levure chimique', 'Levure boulangère',
    'Fruits secs', 'Amandes',
  ],
  'Épices & Condiments': [
    'Sel', 'Poivre', 'Épices', 'Herbes de Provence', 'Moutarde', 'Mayonnaise', 'Ketchup',
    'Cornichons', 'Câpres', 'Sauce piquante',
  ],
  'Boissons': [
    'Eau', 'Eau gazeuse', 'Jus de fruits', "Jus d'orange", 'Sodas', 'Sirop', 'Lait végétal', 'Vin', 'Bière',
  ],
  'Surgelés': [
    'Légumes surgelés', 'Frites surgelées', 'Poisson pané', 'Pizza surgelée', 'Glaces',
    'Fruits rouges surgelés', 'Glaçons',
  ],
  'Hygiène & Beauté': [
    'Papier toilette', 'Gel douche', 'Savon', 'Shampoing', 'Après-shampoing', 'Dentifrice',
    'Brosses à dents', 'Déodorant', 'Rasoirs', 'Mousse à raser', 'Coton-tiges',
    'Cotons démaquillants', 'Crème hydratante', 'Protections hygiéniques', 'Mouchoirs',
    'Pansements', 'Médicaments',
  ],
  'Entretien & Maison': [
    'Lessive', 'Adoucissant', 'Liquide vaisselle', 'Tablettes lave-vaisselle', 'Éponges',
    'Essuie-tout', 'Sacs poubelle', 'Nettoyant multi-usage', 'Javel', 'Produit WC',
    'Nettoyant vitres', 'Papier aluminium', 'Film alimentaire', 'Papier cuisson', 'Sacs congélation',
    'Piles', 'Ampoules', 'Bougies', 'Allumettes',
  ],
  'Bébé': [
    'Couches', 'Lingettes', 'Lait infantile', 'Petits pots', 'Liniment',
  ],
  'Animaux': [
    'Croquettes chat', 'Croquettes chien', 'Pâtée', 'Litière', 'Friandises pour animaux',
  ],
}
