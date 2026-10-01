// Rayons de supermarché, dans l'ordre où on les parcourt en magasin.
// FICHIER GÉNÉRÉ par le script du catalogue produits (build_catalog.py) :
// modifier la liste des produits là-bas plutôt qu'ici.
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

export interface CatalogSection {
  title: string
  items: string[]
}

/** Produits de chaque rayon, regroupés par famille (affichage de l'onglet Ingrédients). */
export const GROCERY_SECTIONS: Record<GroceryCategory, CatalogSection[]> = {
  'Fruits & Légumes': [
    {
      title: 'Fruits',
      items: [
        'Pommes Golden', 'Pommes Gala', 'Pommes Granny Smith', 'Pommes Pink Lady', 'Pommes Royal Gala', 'Pommes Fuji',
        'Pommes Reinette', 'Pommes Chantecler', 'Pommes Braeburn', 'Pommes Jazz', 'Pommes Elstar',
        'Poires Conférence', 'Poires Williams', 'Poires Comice', 'Poires Guyot', 'Bananes', 'Bananes plantain',
        'Oranges', 'Oranges à jus', 'Oranges sanguines', 'Clémentines', 'Mandarines', 'Pamplemousses', 'Citrons',
        'Citrons verts', 'Kumquats', 'Bergamotes', 'Fraises', 'Fraises gariguettes', 'Framboises', 'Myrtilles',
        'Mûres', 'Groseilles', 'Cassis frais', 'Cerises', 'Abricots', 'Pêches', 'Pêches plates', 'Nectarines',
        'Prunes', 'Reines-claudes', 'Mirabelles', 'Quetsches', 'Raisin blanc', 'Raisin noir', 'Raisin muscat',
        'Kiwis', 'Kiwis gold', 'Ananas', 'Mangues', 'Papayes', 'Fruits de la passion', 'Litchis', 'Grenades',
        'Figues fraîches', 'Kakis', 'Melon', 'Pastèque', 'Noix de coco', 'Avocats', 'Pitaya', 'Physalis', 'Goyaves',
        'Dattes fraîches', 'Coings', 'Rhubarbe', 'Caramboles', 'Nashis',
      ],
    },
    {
      title: 'Légumes',
      items: [
        'Tomates', 'Tomates grappe', 'Tomates cerises', 'Tomates cœur de bœuf', 'Tomates allongées',
        'Tomates anciennes', 'Carottes', 'Carottes fanes', 'Pommes de terre', 'Pommes de terre grenaille',
        'Pommes de terre à purée', 'Pommes de terre à frites', 'Pommes de terre Charlotte',
        'Pommes de terre nouvelles', 'Patate douce', 'Oignons jaunes', 'Oignons rouges', 'Oignons blancs',
        'Oignons nouveaux', 'Échalotes', 'Échalotes grises', 'Ail', 'Ail rose', 'Ail des ours', 'Poireaux',
        'Courgettes', 'Courgettes rondes', 'Aubergines', 'Poivrons rouges', 'Poivrons jaunes', 'Poivrons verts',
        'Poivrons tricolores', 'Concombre', 'Mini concombres', 'Salade laitue', 'Salade batavia',
        'Salade feuille de chêne', 'Laitue iceberg', 'Laitue romaine', 'Mâche', 'Roquette', 'Jeunes pousses',
        'Mesclun', 'Endives', 'Frisée', 'Scarole', 'Cresson', 'Épinards frais', 'Pousses d\'épinards', 'Blettes',
        'Brocoli', 'Chou-fleur', 'Chou romanesco', 'Chou vert', 'Chou frisé', 'Chou rouge', 'Chou blanc',
        'Chou chinois', 'Chou kale', 'Choux de Bruxelles', 'Pak choï', 'Chou-rave', 'Haricots verts',
        'Haricots plats', 'Haricots beurre', 'Petits pois frais', 'Pois gourmands', 'Fèves fraîches',
        'Asperges vertes', 'Asperges blanches', 'Artichauts', 'Artichauts poivrade', 'Champignons de Paris',
        'Champignons bruns', 'Pleurotes', 'Shiitakés', 'Girolles', 'Cèpes', 'Champignons mélangés', 'Céleri branche',
        'Céleri-rave', 'Fenouil', 'Navets', 'Navets nouveaux', 'Radis roses', 'Radis noir', 'Daikon',
        'Betteraves crues', 'Betteraves cuites', 'Panais', 'Topinambours', 'Rutabagas', 'Salsifis', 'Potiron',
        'Potimarron', 'Butternut', 'Courge spaghetti', 'Maïs doux en épi', 'Gingembre', 'Curcuma frais',
        'Piments rouges', 'Piments verts', 'Piments jalapeños', 'Citronnelle', 'Galanga', 'Pousses de soja',
        'Edamame', 'Okra', 'Manioc', 'Igname', 'Chayotte', 'Cardons', 'Crosnes', 'Légumes pour pot-au-feu',
        'Légumes pour soupe', 'Salade composée prête à consommer', 'Carottes râpées', 'Céleri rémoulade frais',
      ],
    },
    {
      title: 'Herbes fraîches & aromates',
      items: [
        'Persil plat', 'Persil frisé', 'Basilic', 'Basilic en pot', 'Coriandre', 'Menthe', 'Ciboulette', 'Aneth',
        'Estragon', 'Cerfeuil', 'Thym frais', 'Romarin frais', 'Sauge', 'Laurier frais', 'Origan frais', 'Marjolaine',
        'Sarriette', 'Verveine fraîche', 'Feuilles de citronnier kaffir', 'Mélange d\'herbes fraîches',
      ],
    },
  ],
  'Boucherie & Poissonnerie': [
    {
      title: 'Bœuf',
      items: [
        'Bœuf haché 5 %', 'Bœuf haché 15 %', 'Steaks hachés 5 %', 'Steaks hachés 15 %', 'Steak', 'Entrecôte',
        'Faux-filet', 'Rumsteck', 'Bavette', 'Onglet', 'Hampe', 'Filet de bœuf', 'Tournedos', 'Côte de bœuf',
        'Rôti de bœuf', 'Paleron', 'Macreuse', 'Joue de bœuf', 'Gîte de bœuf', 'Plat de côtes', 'Poitrine de bœuf',
        'Jarret de bœuf', 'Queue de bœuf', 'Bœuf à bourguignon', 'Bœuf pour pot-au-feu', 'Bœuf pour fondue',
        'Carpaccio de bœuf', 'Tartare de bœuf', 'Bœuf émincé', 'Boulettes de bœuf', 'Os à moelle',
        'Côtes de bœuf marinées',
      ],
    },
    {
      title: 'Veau',
      items: [
        'Escalopes de veau', 'Côtes de veau', 'Rôti de veau', 'Blanquette de veau (morceaux)', 'Tendron de veau',
        'Jarret de veau', 'Osso buco de veau', 'Veau haché', 'Paupiettes de veau', 'Sauté de veau',
        'Filet mignon de veau', 'Épaule de veau',
      ],
    },
    {
      title: 'Porc',
      items: [
        'Côtes de porc', 'Côtes de porc échine', 'Filet mignon de porc', 'Rôti de porc', 'Échine de porc',
        'Épaule de porc', 'Poitrine de porc', 'Poitrine de porc fumée', 'Petit salé (poitrine demi-sel)',
        'Travers de porc', 'Jarret de porc', 'Palette de porc', 'Sauté de porc', 'Escalopes de porc', 'Porc haché',
        'Chair à saucisse', 'Pieds de porc', 'Joue de porc', 'Saucisses de Toulouse', 'Saucisses de Strasbourg',
        'Saucisses de Francfort', 'Saucisses de Montbéliard', 'Saucisses de Morteau', 'Chipolatas', 'Merguez',
        'Saucisses aux herbes', 'Boudin noir', 'Boudin blanc', 'Andouillette',
      ],
    },
    {
      title: 'Agneau & mouton',
      items: [
        'Gigot d\'agneau', 'Épaule d\'agneau', 'Côtelettes d\'agneau', 'Carré d\'agneau', 'Souris d\'agneau',
        'Collier d\'agneau', 'Sauté d\'agneau', 'Selle d\'agneau', 'Agneau haché', 'Brochettes d\'agneau',
        'Épaule de mouton',
      ],
    },
    {
      title: 'Volaille',
      items: [
        'Poulet entier', 'Poulet fermier Label Rouge', 'Poulet jaune', 'Blancs de poulet', 'Aiguillettes de poulet',
        'Cuisses de poulet', 'Hauts de cuisse de poulet', 'Pilons de poulet', 'Ailes de poulet', 'Manchons de poulet',
        'Émincés de poulet', 'Poulet haché', 'Foies de volaille', 'Gésiers de volaille', 'Carcasses de poulet',
        'Escalopes de dinde', 'Filet de dinde', 'Cuisse de dinde', 'Rôti de dinde', 'Dinde entière', 'Sauté de dinde',
        'Canard entier', 'Magret de canard', 'Cuisses de canard', 'Aiguillettes de canard', 'Confit de canard',
        'Pintade', 'Coquelet', 'Chapon', 'Caille', 'Oie', 'Poule',
      ],
    },
    {
      title: 'Lapin & gibier',
      items: [
        'Lapin entier', 'Cuisses de lapin', 'Lapin en morceaux', 'Râble de lapin', 'Civet de lapin (morceaux)',
        'Chevreuil (civet)', 'Filet de chevreuil', 'Sanglier (civet)', 'Faisan', 'Pigeon', 'Cerf (rôti)', 'Lièvre',
        'Autruche (steak)',
      ],
    },
    {
      title: 'Abats',
      items: [
        'Foie de veau', 'Foie de génisse', 'Rognons de veau', 'Rognons de porc', 'Ris de veau', 'Cœur de bœuf',
        'Langue de bœuf', 'Tête de veau', 'Tripes',
      ],
    },
    {
      title: 'Poissons',
      items: [
        'Pavés de saumon', 'Filet de saumon', 'Saumon entier', 'Dos de cabillaud', 'Filets de colin',
        'Filets de lieu noir', 'Merlan', 'Filets de sole', 'Sole', 'Filets de limande', 'Dorade royale', 'Bar',
        'Truite', 'Filets de truite', 'Lotte', 'Thon frais', 'Espadon', 'Maquereau', 'Filets de maquereau frais',
        'Sardines fraîches', 'Rouget', 'Raie', 'Turbot', 'Saint-Pierre', 'Églefin', 'Haddock fumé', 'Tilapia',
        'Pangasius', 'Flétan', 'Anchois frais', 'Éperlans', 'Poissons pour soupe',
      ],
    },
    {
      title: 'Fruits de mer',
      items: [
        'Crevettes cuites', 'Crevettes crues', 'Gambas', 'Langoustines', 'Moules', 'Moules de bouchot', 'Huîtres',
        'Coquilles Saint-Jacques', 'Noix de Saint-Jacques', 'Pétoncles', 'Palourdes', 'Coques', 'Bulots',
        'Bigorneaux', 'Calamars', 'Seiche', 'Poulpe', 'Crabe tourteau', 'Araignée de mer', 'Homard', 'Langouste',
        'Écrevisses', 'Plateau de fruits de mer',
      ],
    },
  ],
  'Frais & Traiteur': [
    {
      title: 'Charcuterie',
      items: [
        'Jambon blanc', 'Jambon blanc découenné dégraissé', 'Jambon cru', 'Jambon de Bayonne', 'Jambon de Parme',
        'Jambon Serrano', 'Speck', 'Jambon fumé', 'Blanc de poulet (tranches)', 'Blanc de dinde (tranches)',
        'Lardons fumés', 'Lardons nature', 'Allumettes de bacon', 'Bacon', 'Poitrine fumée en tranches', 'Pancetta',
        'Guanciale', 'Chorizo', 'Chorizo doux en tranches', 'Chorizo fort', 'Saucisson sec', 'Rosette', 'Salami',
        'Coppa', 'Bresaola', 'Viande des Grisons', 'Mortadelle', 'Pâté de campagne', 'Pâté en croûte',
        'Terrine de campagne', 'Rillettes de porc', 'Rillettes de canard', 'Rillettes de poulet', 'Mousse de canard',
        'Foie gras de canard', 'Knacks', 'Cervelas', 'Andouille de Guéméné', 'Tête de veau cuite',
        'Museau vinaigrette',
      ],
    },
    {
      title: 'Traiteur',
      items: [
        'Pâte feuilletée', 'Pâte brisée', 'Pâte sablée', 'Pâte à pizza', 'Pâte filo', 'Feuilles de brick',
        'Pâte à crêpes prête', 'Pâtes fraîches', 'Tagliatelles fraîches', 'Ravioles du Dauphiné', 'Ravioli frais',
        'Tortellini frais', 'Gnocchis', 'Lasagnes fraîches (feuilles)', 'Quenelles de brochet', 'Quenelles nature',
        'Taboulé', 'Salade de pâtes', 'Salade piémontaise', 'Houmous', 'Tzatziki', 'Guacamole frais',
        'Caviar d\'aubergine', 'Tapenade', 'Tofu nature', 'Tofu fumé', 'Tempeh', 'Seitan', 'Steaks végétaux',
        'Falafels', 'Surimi', 'Saumon fumé', 'Truite fumée', 'Harengs marinés', 'Tarama', 'Blinis', 'Œufs de lump',
        'Quiche lorraine', 'Pizza fraîche', 'Croque-monsieur', 'Nems', 'Samoussas', 'Sushis (plateau)', 'Sandwich',
        'Wraps garnis', 'Soupe fraîche', 'Gaspacho', 'Choucroute cuite', 'Choucroute crue', 'Hachis parmentier',
        'Lasagnes bolognaise (plat cuisiné)', 'Plat cuisiné individuel',
      ],
    },
  ],
  'Crèmerie & Œufs': [
    {
      title: 'Œufs',
      items: [
        'Œufs x6', 'Œufs x12', 'Œufs bio x6', 'Œufs plein air x6', 'Œufs de caille', 'Blancs d\'œufs liquides',
      ],
    },
    {
      title: 'Lait & boissons lactées',
      items: [
        'Lait demi-écrémé', 'Lait entier', 'Lait écrémé', 'Lait sans lactose', 'Lait bio', 'Lait frais entier',
        'Lait fermenté', 'Lait concentré sucré', 'Lait concentré non sucré', 'Lait en poudre', 'Lait chocolaté',
        'Kéfir',
      ],
    },
    {
      title: 'Beurre & matières grasses',
      items: [
        'Beurre doux', 'Beurre demi-sel', 'Beurre salé', 'Beurre de baratte', 'Beurre clarifié', 'Margarine',
        'Beurre allégé', 'Beurre tendre',
      ],
    },
    {
      title: 'Crèmes',
      items: [
        'Crème fraîche épaisse', 'Crème fraîche légère', 'Crème liquide entière', 'Crème liquide légère',
        'Crème chantilly en bombe', 'Crème de soja', 'Crème d\'avoine',
      ],
    },
    {
      title: 'Yaourts & desserts',
      items: [
        'Yaourts nature', 'Yaourts à la grecque', 'Yaourts aux fruits', 'Yaourts brassés', 'Yaourts à boire', 'Skyr',
        'Fromage blanc', 'Fromage blanc 0 %', 'Faisselle', 'Petits-suisses', 'Crème dessert chocolat',
        'Crème dessert vanille', 'Mousse au chocolat (pots)', 'Riz au lait (pots)', 'Semoule au lait',
        'Flan nappé caramel', 'Liégeois', 'Panna cotta', 'Tiramisu (pots)', 'Yaourts végétaux soja',
        'Yaourts végétaux coco', 'Compote en gourde',
      ],
    },
    {
      title: 'Fromages',
      items: [
        'Emmental râpé', 'Gruyère râpé', 'Mozzarella râpée', 'Parmesan râpé', 'Emmental', 'Comté', 'Comté 18 mois',
        'Gruyère', 'Beaufort', 'Abondance', 'Tomme de Savoie', 'Reblochon', 'Raclette (tranches)',
        'Fromage à raclette fumé', 'Mont d\'Or', 'Morbier', 'Cantal', 'Salers', 'Saint-Nectaire', 'Tomme de montagne',
        'Ossau-Iraty', 'Mimolette', 'Edam', 'Gouda', 'Cheddar', 'Maasdam', 'Camembert', 'Camembert de Normandie AOP',
        'Brie', 'Brie de Meaux', 'Coulommiers', 'Carré de l\'Est', 'Munster', 'Maroilles', 'Livarot',
        'Pont-l\'Évêque', 'Époisses', 'Vacherin', 'Chaource', 'Saint-Marcellin', 'Saint-Félicien', 'Roquefort',
        'Bleu d\'Auvergne', 'Fourme d\'Ambert', 'Gorgonzola', 'Chèvre bûche', 'Crottin de chèvre', 'Chèvre frais',
        'Sainte-Maure', 'Valençay', 'Feta', 'Mozzarella', 'Mozzarella di bufala', 'Burrata', 'Billes de mozzarella',
        'Ricotta', 'Mascarpone', 'Parmesan', 'Grana Padano', 'Pecorino romano', 'Halloumi', 'Manchego',
        'Scamorza fumée', 'Provolone', 'Fromage frais ail et fines herbes', 'Fromage frais nature',
        'Fromage fondu en portions', 'Cancoillotte', 'Fromage frais en portions', 'Mini fromages',
        'Fromage râpé spécial gratin', 'Fromage végétal',
      ],
    },
  ],
  'Boulangerie': [
    {
      title: 'Pains',
      items: [
        'Baguette', 'Baguette tradition', 'Pain de campagne', 'Pain complet', 'Pain aux céréales', 'Pain de seigle',
        'Pain au levain', 'Pain de mie', 'Pain de mie complet', 'Pain de mie sans croûte', 'Pains à burger',
        'Pains à hot-dog', 'Pain pita', 'Pain naan', 'Tortillas de blé', 'Tortillas de maïs', 'Pain polaire',
        'Pain suédois', 'Biscottes', 'Gressins', 'Pain d\'épices', 'Ciabatta', 'Fougasse', 'Focaccia',
        'Pain sans gluten',
      ],
    },
    {
      title: 'Viennoiseries & pâtisseries',
      items: [
        'Croissants', 'Pains au chocolat', 'Pains aux raisins', 'Chaussons aux pommes', 'Brioche', 'Brioche tranchée',
        'Brioche tressée', 'Pains au lait', 'Pains au chocolat au lait (goûter)', 'Chouquettes', 'Madeleines',
        'Crêpes prêtes', 'Gaufres', 'Muffins', 'Donuts', 'Éclairs', 'Tarte aux pommes', 'Flan pâtissier',
        'Galette des rois', 'Kouign-amann',
      ],
    },
  ],
  'Épicerie salée': [
    {
      title: 'Pâtes',
      items: [
        'Spaghetti', 'Spaghettini', 'Spaghetti complets', 'Linguine', 'Bucatini', 'Capellini', 'Tagliatelles',
        'Tagliatelles aux œufs', 'Fettuccine', 'Pappardelle', 'Penne', 'Penne rigate', 'Rigatoni', 'Macaroni',
        'Coquillettes', 'Fusilli', 'Farfalle', 'Conchiglie', 'Orecchiette', 'Trofie', 'Cavatappi', 'Paccheri', 'Ziti',
        'Tortiglioni', 'Gnocchetti sardi', 'Casarecce', 'Radiatori', 'Lasagnes', 'Cannelloni', 'Conchiglioni',
        'Vermicelles', 'Cheveux d\'ange', 'Alphabet (pâtes)', 'Plombs (pâtes à soupe)', 'Risoni', 'Ditalini',
        'Crozets au sarrasin', 'Crozets au froment', 'Pâtes sans gluten', 'Pâtes aux lentilles corail',
        'Nouilles de riz', 'Vermicelles de riz', 'Nouilles aux œufs', 'Nouilles udon', 'Nouilles soba',
        'Nouilles ramen', 'Nouilles instantanées', 'Vermicelles de soja',
      ],
    },
    {
      title: 'Riz, céréales & légumineuses',
      items: [
        'Riz long', 'Riz basmati', 'Riz thaï', 'Riz complet', 'Riz rond', 'Riz arborio', 'Riz carnaroli',
        'Riz à sushi', 'Riz sauvage', 'Riz rouge', 'Riz noir', 'Riz précuit', 'Semoule fine', 'Semoule moyenne',
        'Couscous complet', 'Boulgour', 'Quinoa', 'Quinoa rouge', 'Blé précuit', 'Épeautre', 'Orge perlé', 'Polenta',
        'Sarrasin', 'Millet', 'Lentilles vertes', 'Lentilles corail', 'Lentilles blondes', 'Lentilles beluga',
        'Pois chiches secs', 'Pois cassés', 'Haricots blancs secs', 'Haricots rouges secs', 'Haricots noirs secs',
        'Flageolets secs', 'Fèves sèches', 'Soja texturé', 'Flocons de purée',
      ],
    },
    {
      title: 'Conserves & bocaux',
      items: [
        'Tomates concassées', 'Tomates pelées', 'Passata', 'Concentré de tomate', 'Sauce tomate cuisinée',
        'Sauce bolognaise', 'Sauce arrabbiata', 'Pesto alla genovese', 'Pesto rosso', 'Sauce carbonara',
        'Pois chiches', 'Haricots rouges', 'Haricots blancs', 'Haricots blancs à la tomate', 'Lentilles cuisinées',
        'Flageolets', 'Petits pois en conserve', 'Petits pois carottes', 'Haricots verts en conserve',
        'Maïs en conserve', 'Champignons en conserve', 'Cœurs d\'artichaut', 'Cœurs de palmier', 'Asperges en bocal',
        'Poivrons grillés', 'Tomates séchées', 'Olives vertes', 'Olives noires', 'Olives Kalamata', 'Thon au naturel',
        'Thon à l\'huile', 'Sardines à l\'huile', 'Maquereaux au vin blanc', 'Filets d\'anchois', 'Miettes de crabe',
        'Saumon en conserve', 'Foie de morue', 'Rillettes de thon en boîte', 'Cassoulet en conserve',
        'Choucroute garnie en conserve', 'Raviolis en boîte', 'Chili con carne en conserve', 'Couscous en conserve',
        'Lait de coco', 'Crème de coco', 'Soupe déshydratée', 'Soupe en brique', 'Bouillon cube de volaille',
        'Bouillon cube de bœuf', 'Bouillon cube de légumes', 'Fond de veau', 'Fumet de poisson', 'Purée de piment',
      ],
    },
    {
      title: 'Huiles & vinaigres',
      items: [
        'Huile d\'olive', 'Huile de tournesol', 'Huile de colza', 'Huile d\'arachide', 'Huile de pépins de raisin',
        'Huile de sésame', 'Huile de noix', 'Huile de coco', 'Huile de friture', 'Huile pour wok',
        'Vinaigre de vin rouge', 'Vinaigre de vin blanc', 'Vinaigre de cidre', 'Vinaigre balsamique',
        'Crème de vinaigre balsamique', 'Vinaigre de Xérès', 'Vinaigre de riz', 'Vinaigre blanc', 'Vinaigrette',
      ],
    },
    {
      title: 'Farines & aides culinaires',
      items: [
        'Farine de blé T45', 'Farine de blé T55', 'Farine complète T150', 'Farine de sarrasin', 'Farine de maïs',
        'Farine de riz', 'Farine de pois chiche', 'Farine de seigle', 'Fécule de maïs', 'Fécule de pomme de terre',
        'Chapelure', 'Panko',
      ],
    },
    {
      title: 'Apéritif',
      items: [
        'Chips nature', 'Chips à l\'ancienne', 'Chips au paprika', 'Tortilla chips', 'Crackers', 'Biscuits apéritif',
        'Bretzels', 'Pop-corn salé', 'Olives apéritif marinées', 'Cacahuètes enrobées', 'Mélange apéritif (graines)',
        'Crème d\'artichaut',
      ],
    },
    {
      title: 'Cuisine du monde',
      items: [
        'Sauce soja salée', 'Sauce soja sucrée', 'Sauce nuoc-mâm', 'Sauce d\'huître', 'Sauce hoisin',
        'Sauce teriyaki', 'Sauce sriracha', 'Sauce aigre-douce', 'Pâte de curry rouge', 'Pâte de curry vert',
        'Pâte de curry jaune', 'Pâte miso', 'Gochujang', 'Pâte de tamarin', 'Mirin', 'Saké de cuisine',
        'Feuilles de nori', 'Algues wakame séchées', 'Kombu', 'Dashi en poudre', 'Copeaux de bonite séchée',
        'Galettes de riz', 'Wasabi', 'Gingembre mariné', 'Lait de coco allégé', 'Harissa', 'Tahini', 'Taco kit',
        'Coques à tacos', 'Haricots refrits', 'Sauce salsa', 'Piments chipotle en conserve',
      ],
    },
  ],
  'Épicerie sucrée': [
    {
      title: 'Petit-déjeuner',
      items: [
        'Corn flakes', 'Céréales au chocolat', 'Muesli', 'Granola', 'Flocons d\'avoine', 'Son d\'avoine',
        'Pâte à tartiner', 'Pâte à tartiner sans huile de palme', 'Confiture de fraises', 'Confiture d\'abricots',
        'Confiture de framboises', 'Confiture de cerises', 'Marmelade d\'oranges', 'Gelée de groseilles',
        'Crème de marrons', 'Miel', 'Miel liquide', 'Sirop d\'érable', 'Sirop d\'agave', 'Beurre de cacahuète',
        'Purée d\'amandes', 'Purée de noisettes', 'Speculoos à tartiner',
      ],
    },
    {
      title: 'Café, thé & chocolat en poudre',
      items: [
        'Café moulu', 'Café en grains', 'Café soluble', 'Café décaféiné', 'Capsules de café',
        'Dosettes de café souples', 'Thé noir', 'Thé vert', 'Thé Earl Grey', 'Thé à la menthe', 'Infusions',
        'Chicorée soluble', 'Chocolat en poudre', 'Cacao en poudre non sucré',
      ],
    },
    {
      title: 'Sucres & pâtisserie',
      items: [
        'Levure boulangère sèche', 'Levure chimique', 'Bicarbonate alimentaire', 'Gélatine en feuilles', 'Agar-agar',
        'Sucre en poudre', 'Sucre en morceaux', 'Cassonade', 'Sucre glace', 'Sucre vanillé', 'Sucre de canne',
        'Sucre de coco', 'Édulcorant', 'Chocolat noir pâtissier', 'Chocolat noir 70 %', 'Chocolat au lait',
        'Chocolat blanc', 'Pépites de chocolat', 'Chocolat au lait noisettes', 'Extrait de vanille',
        'Gousses de vanille', 'Arôme fleur d\'oranger', 'Arôme amande amère', 'Colorants alimentaires',
        'Vermicelles colorés', 'Pralin', 'Noix de coco râpée', 'Fruits confits', 'Caramel liquide',
        'Préparation pour gâteau', 'Préparation pour crêpes', 'Pâte d\'amande', 'Nappage chocolat',
        'Levure pour brioche',
      ],
    },
    {
      title: 'Biscuits & gâteaux',
      items: [
        'Petits-beurre', 'Biscuits sablés', 'Galettes bretonnes', 'Cookies', 'Biscuits au chocolat',
        'Biscuits fourrés', 'Palets bretons', 'Speculoos', 'Biscuits à la cuillère', 'Gâteaux moelleux individuels',
        'Barres de céréales', 'Biscuits petit-déjeuner', 'Gaufrettes', 'Tuiles aux amandes', 'Macarons',
        'Brownies emballés',
      ],
    },
    {
      title: 'Confiserie',
      items: [
        'Bonbons gélifiés', 'Réglisse', 'Chewing-gums', 'Sucettes', 'Marshmallows', 'Caramels', 'Nougat', 'Calissons',
        'Pâtes de fruits', 'Dragées', 'Barres chocolatées', 'Chocolats pralinés', 'Truffes au chocolat',
        'Œufs en chocolat',
      ],
    },
    {
      title: 'Compotes & desserts',
      items: [
        'Compote de pommes', 'Compote pomme-poire', 'Compote sans sucres ajoutés', 'Pêches au sirop',
        'Ananas au sirop', 'Salade de fruits en conserve', 'Purée de fruits',
      ],
    },
    {
      title: 'Fruits secs & à coque',
      items: [
        'Noix', 'Cerneaux de noix', 'Noisettes', 'Amandes', 'Amandes effilées', 'Amandes en poudre', 'Noix de cajou',
        'Pistaches', 'Noix de pécan', 'Noix du Brésil', 'Noix de macadamia', 'Pignons de pin', 'Châtaignes',
        'Marrons cuits', 'Dattes', 'Dattes Medjool', 'Figues séchées', 'Abricots secs', 'Pruneaux', 'Raisins secs',
        'Canneberges séchées', 'Mangue séchée', 'Bananes séchées', 'Mélange de fruits secs', 'Cacahuètes',
        'Cacahuètes grillées salées', 'Graines de courge', 'Graines de tournesol', 'Graines de sésame',
        'Graines de chia',
      ],
    },
  ],
  'Épices & Condiments': [
    {
      title: 'Sel & poivre',
      items: [
        'Sel fin', 'Gros sel', 'Fleur de sel', 'Sel de Guérande', 'Sel iodé', 'Poivre noir moulu',
        'Poivre noir en grains', 'Poivre blanc', 'Baies roses', 'Mélange 5 baies',
      ],
    },
    {
      title: 'Épices',
      items: [
        'Paprika', 'Paprika fumé', 'Piment d\'Espelette', 'Piment de Cayenne', 'Piment en flocons',
        'Piments séchés (ancho, guajillo)', 'Cumin moulu', 'Graines de cumin', 'Curry en poudre', 'Curcuma',
        'Gingembre en poudre', 'Cannelle moulue', 'Bâtons de cannelle', 'Noix de muscade', 'Muscade moulue',
        'Clous de girofle', 'Cardamome', 'Badiane', 'Coriandre moulue', 'Graines de coriandre', 'Graines de fenouil',
        'Graines de moutarde', 'Garam masala', 'Ras el hanout', 'Mélange 4 épices', 'Cinq-épices chinois',
        'Épices à couscous', 'Épices à tajine', 'Épices à chili', 'Épices cajun', 'Épices pour pain d\'épices',
        'Safran', 'Sumac', 'Zaatar', 'Fenugrec', 'Ail en poudre', 'Oignon en poudre', 'Genièvre', 'Vanille en poudre',
      ],
    },
    {
      title: 'Herbes séchées',
      items: [
        'Herbes de Provence', 'Thym séché', 'Origan séché', 'Basilic séché', 'Persil séché', 'Romarin séché',
        'Laurier (feuilles)', 'Estragon séché', 'Ciboulette séchée', 'Aneth séché', 'Bouquet garni',
      ],
    },
    {
      title: 'Condiments & sauces',
      items: [
        'Câpres', 'Cornichons', 'Oignons grelots', 'Moutarde de Dijon', 'Moutarde à l\'ancienne', 'Moutarde au miel',
        'Mayonnaise', 'Ketchup', 'Sauce barbecue', 'Sauce burger', 'Sauce blanche', 'Sauce samouraï',
        'Sauce algérienne', 'Sauce béarnaise', 'Sauce hollandaise', 'Sauce tartare', 'Aïoli', 'Rouille',
        'Sauce piquante', 'Sauce Worcestershire', 'Vinaigre balsamique blanc', 'Cornichons aigres-doux', 'Pickles',
        'Citrons confits', 'Chutney de mangue', 'Confit d\'oignons', 'Raifort', 'Jus de citron (bouteille)',
      ],
    },
  ],
  'Boissons': [
    {
      title: 'Eaux',
      items: [
        'Eau de source', 'Eau gazeuse', 'Eau pétillante légère', 'Eau aromatisée',
      ],
    },
    {
      title: 'Jus & sirops',
      items: [
        'Jus d\'orange', 'Jus d\'orange pressé réfrigéré', 'Jus de pomme', 'Jus de raisin', 'Jus d\'ananas',
        'Jus multifruits', 'Jus de pamplemousse', 'Jus de tomate', 'Nectar d\'abricot', 'Nectar de mangue',
        'Jus de citron vert', 'Smoothie', 'Sirop de grenadine', 'Sirop de menthe', 'Sirop de citron',
        'Sirop de fraise', 'Sirop de sucre de canne',
      ],
    },
    {
      title: 'Sodas & boissons fraîches',
      items: [
        'Cola', 'Cola sans sucres', 'Limonade', 'Soda à l\'orange', 'Tonic', 'Ginger beer', 'Thé glacé',
        'Boisson énergisante', 'Eau de coco', 'Kombucha',
      ],
    },
    {
      title: 'Laits végétaux',
      items: [
        'Boisson au soja', 'Boisson à l\'avoine', 'Boisson à l\'amande', 'Boisson au riz', 'Boisson à la noisette',
        'Boisson coco',
      ],
    },
    {
      title: 'Bières, vins & spiritueux',
      items: [
        'Bière blonde', 'Bière blanche', 'Bière ambrée', 'Bière brune', 'Bière IPA', 'Bière sans alcool',
        'Cidre brut', 'Cidre doux', 'Vin rouge', 'Vin blanc sec', 'Vin rosé', 'Vin blanc moelleux', 'Champagne',
        'Crémant', 'Prosecco', 'Vin cuit (Porto)', 'Muscat', 'Crème de cassis', 'Bitter apéritif (pour spritz)',
        'Pastis', 'Vermouth blanc', 'Rhum blanc', 'Rhum ambré', 'Vodka', 'Gin', 'Whisky', 'Tequila', 'Cognac',
        'Marsala', 'Calvados', 'Triple sec', 'Liqueur de café',
      ],
    },
  ],
  'Surgelés': [
    {
      title: 'Légumes & fruits surgelés',
      items: [
        'Petits pois surgelés', 'Haricots verts surgelés', 'Épinards hachés surgelés',
        'Épinards en branches surgelés', 'Brocolis surgelés', 'Chou-fleur surgelé', 'Poêlée de légumes surgelée',
        'Légumes pour wok surgelés', 'Ratatouille surgelée', 'Légumes à potage surgelés',
        'Poivrons en lanières surgelés', 'Oignons émincés surgelés', 'Champignons surgelés', 'Maïs surgelé',
        'Edamame surgelés', 'Fèves surgelées', 'Frites surgelées', 'Pommes de terre sautées surgelées',
        'Pommes noisettes surgelées', 'Galettes de pommes de terre surgelées', 'Purée surgelée',
        'Fruits rouges surgelés', 'Framboises surgelées', 'Myrtilles surgelées', 'Mangue surgelée',
        'Herbes surgelées', 'Ail haché surgelé',
      ],
    },
    {
      title: 'Viandes & poissons surgelés',
      items: [
        'Steaks hachés surgelés', 'Nuggets de poulet surgelés', 'Cordons bleus surgelés',
        'Aiguillettes de poulet surgelées', 'Poisson pané', 'Filets de colin surgelés',
        'Filets de cabillaud surgelés', 'Pavés de saumon surgelés', 'Crevettes surgelées', 'Moules surgelées',
        'Cocktail de fruits de mer surgelé', 'Noix de Saint-Jacques surgelées', 'Calamars surgelés',
      ],
    },
    {
      title: 'Plats & snacks surgelés',
      items: [
        'Pizza surgelée', 'Quiche surgelée', 'Lasagnes surgelées', 'Hachis parmentier surgelé',
        'Gratin dauphinois surgelé', 'Paëlla surgelée', 'Riz cantonais surgelé', 'Nems surgelés',
        'Samoussas surgelés', 'Friands surgelés', 'Croissants à cuire surgelés', 'Pains au chocolat à cuire surgelés',
        'Baguettes précuites surgelées', 'Pâte feuilletée surgelée',
      ],
    },
    {
      title: 'Glaces & desserts glacés',
      items: [
        'Glaçons', 'Glace à la vanille', 'Glace au chocolat', 'Sorbet citron', 'Sorbet fraise', 'Cônes glacés',
        'Bâtonnets glacés', 'Bûche glacée', 'Vacherin glacé', 'Profiteroles surgelées', 'Mochis glacés',
      ],
    },
  ],
  'Hygiène & Beauté': [
    {
      title: 'Douche & bain',
      items: [
        'Gel douche', 'Gel douche surgras', 'Savon', 'Savon liquide', 'Recharge savon liquide', 'Bain moussant',
        'Gant de toilette', 'Éponge de bain',
      ],
    },
    {
      title: 'Cheveux',
      items: [
        'Shampoing', 'Shampoing antipelliculaire', 'Shampoing sec', 'Après-shampoing', 'Masque capillaire',
        'Gel coiffant', 'Cire coiffante', 'Laque', 'Coloration cheveux', 'Brosse à cheveux', 'Élastiques à cheveux',
      ],
    },
    {
      title: 'Dents & bouche',
      items: [
        'Dentifrice', 'Dentifrice blancheur', 'Dentifrice enfant', 'Brosses à dents',
        'Brossettes pour brosse à dents électrique', 'Bain de bouche', 'Fil dentaire', 'Brossettes interdentaires',
      ],
    },
    {
      title: 'Soins visage & corps',
      items: [
        'Déodorant', 'Déodorant bille', 'Crème hydratante visage', 'Crème hydratante corps', 'Crème pour les mains',
        'Baume à lèvres', 'Démaquillant', 'Eau micellaire', 'Nettoyant visage', 'Crème solaire', 'Après-soleil',
        'Autobronzant', 'Huile pour le corps',
      ],
    },
    {
      title: 'Rasage & épilation',
      items: [
        'Rasoirs jetables', 'Rasoir rechargeable', 'Lames de rasoir', 'Mousse à raser', 'Gel à raser', 'Après-rasage',
        'Bandes de cire', 'Crème dépilatoire',
      ],
    },
    {
      title: 'Maquillage',
      items: [
        'Mascara', 'Rouge à lèvres', 'Fond de teint', 'Poudre', 'Crayon pour les yeux', 'Vernis à ongles',
        'Dissolvant', 'Cotons démaquillants',
      ],
    },
    {
      title: 'Hygiène intime & papier',
      items: [
        'Papier toilette', 'Papier toilette humide', 'Mouchoirs en boîte', 'Paquets de mouchoirs', 'Coton-tiges',
        'Coton hydrophile', 'Serviettes hygiéniques', 'Tampons', 'Protège-slips', 'Culottes menstruelles',
        'Gel intime', 'Préservatifs',
      ],
    },
    {
      title: 'Parapharmacie',
      items: [
        'Pansements', 'Compresses', 'Désinfectant', 'Sérum physiologique', 'Thermomètre', 'Vitamines',
        'Répulsif anti-moustiques', 'Gel hydroalcoolique', 'Masques jetables', 'Bouchons d\'oreilles',
        'Lingettes démaquillantes',
      ],
    },
  ],
  'Entretien & Maison': [
    {
      title: 'Linge',
      items: [
        'Lessive liquide', 'Lessive en capsules', 'Lessive en poudre', 'Lessive linge délicat', 'Adoucissant',
        'Détachant', 'Lingettes anti-décoloration', 'Vinaigre ménager', 'Bicarbonate de soude ménager',
        'Percarbonate de soude', 'Anticalcaire lave-linge',
      ],
    },
    {
      title: 'Vaisselle',
      items: [
        'Liquide vaisselle', 'Tablettes lave-vaisselle', 'Liquide de rinçage', 'Sel lave-vaisselle',
        'Nettoyant lave-vaisselle', 'Éponges', 'Éponges grattantes', 'Tampons à récurer', 'Brosse vaisselle',
        'Torchons',
      ],
    },
    {
      title: 'Ménage',
      items: [
        'Nettoyant multi-usage', 'Nettoyant vitres', 'Nettoyant sol', 'Nettoyant salle de bain',
        'Nettoyant cuisine dégraissant', 'Crème à récurer', 'Javel', 'Gel WC', 'Blocs WC', 'Désodorisant',
        'Bougie parfumée', 'Désinfectant surfaces', 'Lingettes ménagères', 'Détartrant', 'Déboucheur canalisations',
        'Savon noir', 'Cire pour meubles', 'Nettoyant inox', 'Nettoyant four', 'Anti-moustiques diffuseur',
        'Insecticide', 'Microfibres', 'Gants de ménage', 'Balai', 'Serpillière', 'Seau', 'Recharges balai',
        'Pelle et balayette', 'Sacs aspirateur',
      ],
    },
    {
      title: 'Papier & emballages cuisine',
      items: [
        'Essuie-tout', 'Serviettes en papier', 'Nappe en papier', 'Papier aluminium', 'Film alimentaire',
        'Papier cuisson', 'Sacs congélation', 'Sacs zip', 'Boîtes de conservation', 'Sacs poubelle 30 L',
        'Sacs poubelle 50 L', 'Sacs poubelle 100 L', 'Filtres à café', 'Moules en papier', 'Pailles',
        'Assiettes jetables', 'Gobelets jetables', 'Couverts jetables', 'Piques apéritif',
      ],
    },
    {
      title: 'Maison & bricolage',
      items: [
        'Piles AA', 'Piles AAA', 'Piles bouton', 'Ampoules LED', 'Allumettes', 'Briquet', 'Bougies',
        'Bougies chauffe-plat', 'Ruban adhésif', 'Colle', 'Rallonge électrique', 'Multiprise', 'Chargeur USB',
        'Câble USB', 'Cintres', 'Pinces à linge', 'Charbon de bois', 'Allume-barbecue',
      ],
    },
    {
      title: 'Papeterie',
      items: [
        'Stylos', 'Crayons à papier', 'Feutres', 'Cahier', 'Bloc-notes', 'Ramette de papier', 'Enveloppes',
        'Notes adhésives', 'Ciseaux', 'Gomme', 'Taille-crayon', 'Papier cadeau', 'Cartes de vœux',
      ],
    },
    {
      title: 'Jardin & plantes',
      items: [
        'Terreau', 'Engrais', 'Graines à semer', 'Plante aromatique en pot', 'Bouquet de fleurs',
      ],
    },
  ],
  'Bébé': [
    {
      title: 'Change',
      items: [
        'Couches', 'Couches culottes', 'Lingettes bébé', 'Liniment', 'Crème pour le change',
      ],
    },
    {
      title: 'Repas bébé',
      items: [
        'Lait infantile 1er âge', 'Lait infantile 2e âge', 'Lait de croissance', 'Petits pots légumes',
        'Petits pots fruits', 'Petits pots viande-légumes', 'Gourdes de compote bébé', 'Céréales bébé',
        'Biscuits bébé', 'Biberons', 'Tétines',
      ],
    },
    {
      title: 'Soins bébé',
      items: [
        'Gel lavant bébé', 'Shampoing bébé', 'Lait de toilette bébé', 'Mouche-bébé',
      ],
    },
  ],
  'Animaux': [
    {
      title: 'Chats',
      items: [
        'Croquettes chat', 'Croquettes chat stérilisé', 'Pâtée chat', 'Sachets fraîcheur chat', 'Friandises chat',
        'Litière', 'Litière agglomérante', 'Herbe à chat',
      ],
    },
    {
      title: 'Chiens',
      items: [
        'Croquettes chien', 'Croquettes chiot', 'Pâtée chien', 'Friandises chien', 'Os à mâcher', 'Sacs à déjections',
      ],
    },
    {
      title: 'Autres animaux',
      items: [
        'Graines pour oiseaux', 'Nourriture pour poissons', 'Nourriture pour rongeurs', 'Foin',
        'Litière pour rongeurs', 'Antiparasitaire', 'Jouet pour animal', 'Shampoing pour animaux',
      ],
    },
  ],
}

/** Tous les produits d'un rayon, dans l'ordre. */
export const GROCERY_CATALOG = Object.fromEntries(
  GROCERY_CATEGORIES.map((category) => [category, GROCERY_SECTIONS[category].flatMap((section) => section.items)])
) as Record<GroceryCategory, string[]>

/**
 * Noms génériques d'aliments (« Œufs », « Lait », « Poisson »...) par rayon : ce ne sont pas
 * des produits du catalogue, mais ce qu'on exclut dans son profil ou ce qu'on range au frigo.
 */
export const GENERIC_FOODS: Partial<Record<GroceryCategory, string[]>> = {
  'Fruits & Légumes': ['Pommes', 'Bananes', 'Oranges', 'Citrons', 'Citrons verts', 'Fraises', 'Poires', 'Raisins', 'Kiwis', 'Tomates', 'Carottes', 'Pommes de terre', 'Oignons', 'Ail', 'Échalotes', 'Courgettes', 'Poivrons', 'Salade', 'Concombre', 'Brocoli', 'Champignons', 'Avocat', 'Épinards', 'Poireaux', 'Aubergines', 'Patate douce', 'Persil', 'Basilic', 'Coriandre', 'Menthe', 'Gingembre'],
  'Boucherie & Poissonnerie': ['Poulet', 'Blancs de poulet', 'Bœuf haché', 'Steak haché', 'Escalope de poulet', 'Saucisses', 'Porc', 'Agneau', 'Veau', 'Dinde', 'Merguez', 'Saumon', 'Cabillaud', 'Thon frais', 'Crevettes', 'Moules'],
  'Frais & Traiteur': ['Jambon', 'Lardons', 'Bacon', 'Chorizo', 'Pâte feuilletée', 'Pâte brisée', 'Pâte à pizza', 'Pâtes fraîches', 'Gnocchis', 'Tofu', 'Houmous', 'Surimi'],
  'Crèmerie & Œufs': ['Lait', 'Beurre', 'Œufs', 'Yaourt nature', 'Crème fraîche', 'Crème liquide', 'Fromage râpé', 'Camembert', 'Emmental', 'Comté', 'Mozzarella', 'Parmesan', 'Feta', 'Fromage blanc', 'Fromage frais', 'Mascarpone', 'Desserts lactés'],
  'Boulangerie': ['Baguette', 'Pain de campagne', 'Pain de mie', 'Brioche', 'Croissants', 'Pains au chocolat', 'Pains au lait', 'Tortillas', 'Pains à burger', 'Pain pita'],
  'Épicerie salée': ['Pâtes', 'Riz', 'Farine', 'Semoule', 'Quinoa', 'Huile d\'olive', 'Huile neutre', 'Vinaigre', 'Conserve de tomates', 'Concentré de tomate', 'Pois chiches', 'Haricots rouges', 'Lentilles', 'Lait de coco', 'Thon en boîte', 'Olives', 'Bouillon cube', 'Chapelure', 'Sauce soja', 'Chips', 'Crackers'],
  'Épicerie sucrée': ['Sucre', 'Céréales', 'Flocons d\'avoine', 'Café', 'Thé', 'Chocolat', 'Cacao en poudre', 'Miel', 'Confiture', 'Pâte à tartiner', 'Biscuits', 'Compote', 'Levure chimique', 'Levure boulangère', 'Fruits secs', 'Amandes'],
  'Épices & Condiments': ['Sel', 'Poivre', 'Épices', 'Herbes de Provence', 'Moutarde', 'Mayonnaise', 'Ketchup', 'Cornichons', 'Câpres', 'Sauce piquante'],
  'Boissons': ['Eau', 'Eau gazeuse', 'Jus de fruits', 'Jus d\'orange', 'Sodas', 'Sirop', 'Lait végétal', 'Vin', 'Bière'],
  'Surgelés': ['Légumes surgelés', 'Frites surgelées', 'Poisson pané', 'Pizza surgelée', 'Glaces', 'Fruits rouges surgelés', 'Glaçons'],
  'Hygiène & Beauté': ['Papier toilette', 'Gel douche', 'Savon', 'Shampoing', 'Après-shampoing', 'Dentifrice', 'Brosses à dents', 'Déodorant', 'Rasoirs', 'Mousse à raser', 'Coton-tiges', 'Cotons démaquillants', 'Crème hydratante', 'Protections hygiéniques', 'Mouchoirs', 'Pansements'],
  'Entretien & Maison': ['Lessive', 'Adoucissant', 'Liquide vaisselle', 'Tablettes lave-vaisselle', 'Éponges', 'Essuie-tout', 'Sacs poubelle', 'Nettoyant multi-usage', 'Javel', 'Produit WC', 'Nettoyant vitres', 'Papier aluminium', 'Film alimentaire', 'Papier cuisson', 'Sacs congélation', 'Piles', 'Ampoules', 'Bougies', 'Allumettes'],
  'Bébé': ['Couches', 'Lingettes', 'Lait infantile', 'Petits pots', 'Liniment'],
  'Animaux': ['Croquettes chat', 'Croquettes chien', 'Pâtée', 'Litière', 'Friandises pour animaux'],
}
