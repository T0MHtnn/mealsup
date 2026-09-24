// Contenu de la page Aide (guide d'utilisation pour les membres).
// Une section par partie de l'app ; des points courts, un geste ou une info par ligne.

export type HelpSectionId = 'week' | 'recipes' | 'recipe' | 'create' | 'fridge' | 'shopping' | 'profile' | 'good'

export interface HelpSection {
  id: HelpSectionId
  title: string
  items: string[]
}

export interface HelpContent {
  title: string
  intro: string
  contactTitle: string
  contactText: string
  contactLink: string
  sections: HelpSection[]
}

export const HELP: Record<'fr' | 'en', HelpContent> = {
  fr: {
    title: 'Aide',
    intro: "MealsUp t'accompagne du menu de la semaine jusqu'aux courses. Touche une rubrique pour la déplier.",
    contactTitle: 'Une question, une idée ?',
    contactText: 'Écris-nous depuis le Profil : chaque message est lu.',
    contactLink: 'Nous écrire',
    sections: [
      {
        id: 'week',
        title: 'Planifier ta semaine (Accueil)',
        items: [
          'Choisis un jour en haut, puis touche un créneau (petit-déjeuner, déjeuner, collation, dîner) pour y mettre une recette.',
          '« Me proposer la semaine » remplit les créneaux vides selon tes favoris, tes notes, ton équipement et tes exclusions.',
          '« Autre idée » remplace un repas par une autre suggestion ; la croix le retire.',
          'Les boutons − / + règlent le nombre de portions de chaque repas.',
          '« Générer ma liste de courses » ajoute tous les ingrédients de la semaine à ta liste, quantités additionnées.',
          'Le bloc Anti-gaspi propose des recettes pour finir les produits frais achetés pour un seul repas.',
          '« Ton récap de la semaine » résume ta semaine planifiée : calories estimées par jour, plat et ingrédient n° 1, répartition des apports, budget. Les flèches permettent de revoir les semaines passées.',
        ],
      },
      {
        id: 'recipes',
        title: 'Trouver une recette (Recettes)',
        items: [
          'Cherche par nom ou par ingrédient : « poulet » trouve aussi les plats qui en contiennent.',
          'Filtre par moment de la journée : Petit-déj, Plats, Goûter, Apéro.',
          '« Mon frigo » montre en premier ce que tu peux cuisiner avec ce que tu as déjà.',
          '« Petit budget », « Favoris » et « Filtres » (tri, riche en protéines, léger) affinent la liste.',
          'Un triangle rouge signale un aliment que tu as exclu ; une clé orange, un appareil que tu n\'as pas.',
          'Le cœur ajoute une recette à tes favoris.',
        ],
      },
      {
        id: 'recipe',
        title: 'Sur une fiche recette',
        items: [
          'Change le nombre de portions : les quantités se recalculent.',
          '« Mode cuisine » affiche une étape à la fois en grand, garde l\'écran allumé et propose des minuteurs (« 12 min » → un appui).',
          '« Ajouter au plan de la semaine » la place dans un créneau, avec les portions choisies.',
          'Le coût et les valeurs nutritionnelles par portion sont affichés.',
          'Donne une note et une note perso (visibles par toi seul) : les recettes bien notées reviennent plus souvent dans les suggestions.',
        ],
      },
      {
        id: 'create',
        title: 'Créer tes propres recettes',
        items: [
          'Bouton + à côté de la recherche, dans Recettes.',
          '« Importer depuis un lien » remplit tout seul le formulaire à partir d\'une page de recette (Marmiton, 750g…). Vérifie ensuite les quantités.',
          'Choisis au moins une catégorie : elle décide dans quel créneau la recette est proposée.',
          'Tes recettes sont privées. Tu peux les modifier ou les supprimer depuis leur fiche.',
        ],
      },
      {
        id: 'fridge',
        title: 'Gérer ton frigo (Frigo)',
        items: [
          'Tape le début d\'un nom : des suggestions t\'évitent les fautes et les doublons.',
          'Une date de péremption est proposée selon le produit : ajuste-la si l\'emballage dit autre chose.',
          'Un même produit avec une autre date est gardé comme un lot à part (ex. des steaks achetés à deux jours d\'écart).',
          'Les aliments qui périment dans 3 jours ou moins sont signalés en rouge.',
          '« Que cuisiner avec mon frigo ? » ouvre les recettes qui utilisent tes aliments.',
        ],
      },
      {
        id: 'shopping',
        title: 'Faire tes courses (Courses)',
        items: [
          'Onglet Ingrédients : ajoute des produits par rayon ; touche le nombre pour saisir une quantité.',
          'Onglet Liste : coche les articles au fur et à mesure. Ça marche aussi sans réseau, tout se synchronise ensuite.',
          'Le badge « Frigo » indique ce que tu as déjà chez toi.',
          '« Terminer mes courses » archive la liste dans l\'historique et range les produits achetés dans ton frigo.',
          '« Vider la liste » efface tout d\'un coup ; l\'icône horloge ouvre l\'historique.',
        ],
      },
      {
        id: 'profile',
        title: 'Tes préférences (Profil)',
        items: [
          'Aliments exclus et restrictions (végétarien, sans gluten…) : les recettes concernées sont signalées partout.',
          'Mon équipement : indique tes appareils pour repérer les recettes que tu ne peux pas faire.',
          'Mon supermarché habituel ajuste les prix estimés.',
          'Alertes de péremption : une notification la veille, avec une idée de recette.',
          'Thème clair ou sombre, langue, photo et pseudo se changent ici aussi.',
        ],
      },
      {
        id: 'good',
        title: 'Bon à savoir',
        items: [
          'Les prix et les valeurs nutritionnelles sont des estimations indicatives, non vérifiées.',
          'Installe l\'app sur ton téléphone : sur iPhone, Safari → Partager → Sur l\'écran d\'accueil (indispensable pour les notifications).',
          'L\'app se met à jour toute seule à chaque ouverture.',
          'Tes données (frigo, listes, avis, recettes perso) ne sont visibles que par toi.',
        ],
      },
    ],
  },
  en: {
    title: 'Help',
    intro: 'MealsUp takes you from the weekly menu to the groceries. Tap a topic to open it.',
    contactTitle: 'A question, an idea?',
    contactText: 'Write to us from your Profile: every message is read.',
    contactLink: 'Contact us',
    sections: [
      {
        id: 'week',
        title: 'Plan your week (Home)',
        items: [
          'Pick a day at the top, then tap a slot (breakfast, lunch, snack, dinner) to add a recipe.',
          '"Suggest my week" fills the empty slots based on your favorites, ratings, equipment and exclusions.',
          '"Another idea" swaps a meal for another suggestion; the cross removes it.',
          'The − / + buttons set the number of servings of each meal.',
          '"Generate my shopping list" adds all the week\'s ingredients to your list, quantities added up.',
          'The Zero waste block suggests recipes to finish fresh products bought for a single meal.',
          '"Your weekly recap" sums up your planned week: estimated calories per day, top dish and ingredient, nutrient breakdown, budget. The arrows let you look back at past weeks.',
        ],
      },
      {
        id: 'recipes',
        title: 'Find a recipe (Recipes)',
        items: [
          'Search by name or ingredient: "chicken" also finds dishes that contain it.',
          'Filter by time of day: Breakfast, Mains, Snacks, Aperitif.',
          '"My fridge" shows first what you can cook with what you already have.',
          '"Low budget", "Favorites" and "Filters" (sorting, high protein, light) narrow the list.',
          'A red triangle flags a food you excluded; an orange wrench, an appliance you don\'t have.',
          'The heart adds a recipe to your favorites.',
        ],
      },
      {
        id: 'recipe',
        title: 'On a recipe page',
        items: [
          'Change the number of servings: quantities are recalculated.',
          '"Cooking mode" shows one big step at a time, keeps the screen on and offers timers ("12 min" → one tap).',
          '"Add to weekly plan" puts it in a slot, with the chosen servings.',
          'Cost and nutrition per serving are shown.',
          'Rate it and add a private note: well-rated recipes come up more often in suggestions.',
        ],
      },
      {
        id: 'create',
        title: 'Create your own recipes',
        items: [
          '+ button next to the search bar, in Recipes.',
          '"Import from a link" fills the form from a recipe page. Then check the quantities.',
          'Pick at least one category: it decides which slot offers the recipe.',
          'Your recipes are private. Edit or delete them from their page.',
        ],
      },
      {
        id: 'fridge',
        title: 'Manage your fridge (Fridge)',
        items: [
          'Type the start of a name: suggestions prevent typos and duplicates.',
          'An expiry date is suggested for the product: adjust it if the package says otherwise.',
          'The same product with another date is kept as a separate batch.',
          'Food expiring within 3 days is flagged in red.',
          '"What can I cook with my fridge?" opens the recipes using your food.',
        ],
      },
      {
        id: 'shopping',
        title: 'Do your shopping (Shopping)',
        items: [
          'Ingredients tab: add products by aisle; tap the number to type a quantity.',
          'List tab: tick items as you go. It also works offline and syncs afterwards.',
          'The "Fridge" badge shows what you already have at home.',
          '"Finish shopping" archives the list and puts the bought food in your fridge.',
          '"Clear the list" removes everything at once; the clock icon opens the history.',
        ],
      },
      {
        id: 'profile',
        title: 'Your preferences (Profile)',
        items: [
          'Excluded food and dietary restrictions: matching recipes are flagged everywhere.',
          'My equipment: list your appliances to spot recipes you can\'t make.',
          'My usual supermarket adjusts the estimated prices.',
          'Expiry alerts: a notification the day before, with a recipe idea.',
          'Light or dark theme, language, photo and username are changed here too.',
        ],
      },
      {
        id: 'good',
        title: 'Good to know',
        items: [
          'Prices and nutrition values are indicative, unverified estimates.',
          'Install the app on your phone: on iPhone, Safari → Share → Add to Home Screen (required for notifications).',
          'The app updates itself every time you open it.',
          'Your data (fridge, lists, ratings, own recipes) is only visible to you.',
        ],
      },
    ],
  },
}
