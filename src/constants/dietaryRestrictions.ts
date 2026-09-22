export const DIETARY_RESTRICTIONS = [
  {
    key: 'vegetarian',
    keywords: [
      'viande', 'bœuf', 'boeuf', 'porc', 'poulet', 'agneau', 'veau', 'lardons', 'bacon',
      'jambon', 'saucisse', 'merguez', 'canard', 'dinde', 'lapin', 'charcuterie', 'steak',
      'poisson', 'saumon', 'thon', 'crevette', 'cabillaud', 'moules', 'fruits de mer',
    ],
  },
  {
    key: 'vegan',
    keywords: [
      'viande', 'bœuf', 'boeuf', 'porc', 'poulet', 'agneau', 'veau', 'lardons', 'bacon',
      'jambon', 'saucisse', 'merguez', 'canard', 'dinde', 'lapin', 'charcuterie', 'steak',
      'poisson', 'saumon', 'thon', 'crevette', 'cabillaud', 'moules', 'fruits de mer',
      'lait', 'beurre', 'crème', 'fromage', 'yaourt', 'œuf', 'oeuf', 'miel', 'mascarpone', 'parmesan',
    ],
  },
  {
    key: 'glutenFree',
    keywords: [
      'farine', 'pâtes', 'pain', 'blé', 'orge', 'seigle', 'couscous', 'chapelure',
      'semoule', 'baguette', 'croissant', 'lasagne',
    ],
  },
  {
    key: 'lactoseFree',
    keywords: [
      'lait', 'beurre', 'crème', 'fromage', 'yaourt', 'mascarpone', 'parmesan', 'gruyère', 'emmental', 'reblochon', 'camembert',
    ],
  },
] as const

export type DietaryRestrictionKey = (typeof DIETARY_RESTRICTIONS)[number]['key']
