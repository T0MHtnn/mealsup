export const GROCERY_CATEGORIES = [
  'Fruits & Légumes',
  'Viandes & Poissons',
  'Épicerie',
  'Produits laitiers',
  'Autre',
] as const

export type GroceryCategory = (typeof GROCERY_CATEGORIES)[number]

export const GROCERY_CATALOG: Record<GroceryCategory, string[]> = {
  'Fruits & Légumes': [
    'Pommes', 'Bananes', 'Oranges', 'Citrons', 'Fraises', 'Poires', 'Raisins',
    'Tomates', 'Carottes', 'Pommes de terre', 'Oignons', 'Ail', 'Courgettes',
    'Poivrons', 'Salade', 'Concombre', 'Brocoli', 'Champignons', 'Avocat', 'Épinards',
  ],
  'Viandes & Poissons': [
    'Poulet', 'Bœuf haché', 'Steak haché', 'Escalope de poulet', 'Saucisses',
    'Lardons', 'Jambon', 'Porc', 'Agneau', 'Saumon', 'Cabillaud', 'Thon',
    'Crevettes', 'Merguez', 'Bacon', 'Dinde',
  ],
  'Épicerie': [
    'Pâtes', 'Riz', 'Farine', 'Sucre', 'Sel', 'Poivre', "Huile d'olive",
    'Vinaigre', 'Conserve de tomates', 'Pois chiches', 'Haricots rouges',
    'Lentilles', 'Pain', 'Pain de mie', 'Brioche', 'Céréales', "Flocons d'avoine",
    'Café', 'Thé', 'Chocolat', 'Cacao en poudre', 'Miel', 'Confiture', 'Pâte à tartiner',
    'Levure chimique', 'Levure boulangère', 'Moutarde', 'Mayonnaise',
  ],
  'Produits laitiers': [
    'Lait', 'Beurre', 'Œufs', 'Yaourt nature', 'Crème fraîche', 'Fromage râpé',
    'Camembert', 'Emmental', 'Mozzarella', 'Parmesan', 'Fromage blanc',
    'Crème liquide', 'Lait de coco', 'Feta',
  ],
  Autre: [
    'Eau', 'Jus de fruits', 'Vin', 'Bière', 'Papier toilette', 'Essuie-tout',
    'Liquide vaisselle', 'Sacs poubelle', 'Bougies', 'Mouchoirs',
  ],
}
