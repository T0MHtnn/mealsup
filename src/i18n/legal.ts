// Politique de confidentialité et mentions légales (FR / EN).
// À relire si l'app change : nouvelles données collectées, nouveau prestataire...

export type LegalDoc = 'privacy' | 'notice'

export interface LegalSection {
  title: string
  paragraphs: string[]
}

export interface LegalContent {
  title: string
  updated: string
  intro: string
  sections: LegalSection[]
}

const CONTACT = 'tomhatonlcsm@gmail.com'
const PUBLISHER = 'Tom Haton'

export const LEGAL: Record<'fr' | 'en', Record<LegalDoc, LegalContent>> = {
  fr: {
    privacy: {
      title: 'Politique de confidentialité',
      updated: 'Dernière mise à jour : 24 septembre 2026',
      intro:
        "Cette page explique quelles données MealsUp utilise, pourquoi, avec qui elles sont partagées et comment exercer tes droits, conformément au Règlement général sur la protection des données (RGPD).",
      sections: [
        {
          title: 'Responsable du traitement',
          paragraphs: [`${PUBLISHER}, éditeur de MealsUp. Contact : ${CONTACT}.`],
        },
        {
          title: 'Données utilisées',
          paragraphs: [
            "Compte : adresse e-mail, pseudo, photo de profil (facultative) et, si tu te connectes avec Google, l'identifiant de ton compte Google. Ton mot de passe est géré par notre prestataire d'authentification et n'est jamais visible par nous.",
            "Utilisation de l'app : aliments exclus, régimes, équipement, magasin préféré, contenu du frigo, planning des repas, listes de courses et historique d'achats, recettes favorites, notes, recettes perso (et leurs photos), messages envoyés via le formulaire de contact.",
            "Notifications (seulement si tu les actives) : l'adresse technique d'envoi fournie par ton navigateur.",
            "Import d'une recette depuis un lien : l'adresse de la page est envoyée à notre serveur, qui la lit pour en extraire la recette. La page n'est pas conservée.",
            "Aucune donnée de santé n'est demandée. Les calories affichées sont des estimations calculées à partir des recettes, pas des mesures te concernant.",
          ],
        },
        {
          title: 'Pourquoi et sur quelle base',
          paragraphs: [
            "Ces données servent uniquement à faire fonctionner l'app : planning, suggestions, liste de courses, frigo, alertes de péremption. Base légale : l'exécution du service que tu utilises (article 6.1.b du RGPD).",
            "Les notifications reposent sur ton consentement (article 6.1.a), que tu peux retirer à tout moment dans le Profil ou les réglages de ton téléphone.",
            "Pas de publicité, pas de revente de données, pas de profilage commercial.",
          ],
        },
        {
          title: 'Qui y a accès',
          paragraphs: [
            "Tes données ne sont visibles que par toi. L'administrateur de l'app peut voir la liste des comptes (e-mail, pseudo, date d'inscription) et les messages du formulaire de contact, pour la gestion et le support.",
            "Prestataires techniques (sous-traitants) : Supabase (base de données, authentification, stockage des photos), Vercel (hébergement du site), Google (seulement si tu utilises « Continuer avec Google »), et le service de notifications de ton navigateur (Google, Apple ou Mozilla) pour acheminer les alertes. Certains de ces prestataires peuvent traiter des données hors de l'Union européenne ; ils s'engagent alors par des clauses contractuelles types de la Commission européenne.",
          ],
        },
        {
          title: 'Durée de conservation',
          paragraphs: [
            "Tes données sont conservées tant que ton compte existe. Quand tu supprimes ton compte, elles sont effacées immédiatement, sauf les messages envoyés via le formulaire de contact, conservés sans ton adresse e-mail.",
          ],
        },
        {
          title: 'Stockage sur ton appareil',
          paragraphs: [
            "MealsUp n'utilise aucun cookie publicitaire ni outil de mesure d'audience. L'app garde sur ton appareil (stockage local du navigateur) ta session de connexion, tes réglages (langue, thème) et une copie des recettes pour aller plus vite. Ces éléments sont strictement nécessaires au fonctionnement et ne nécessitent pas de consentement.",
          ],
        },
        {
          title: 'Tes droits',
          paragraphs: [
            "Tu peux accéder à tes données, les corriger, les effacer, t'opposer à leur traitement, en limiter l'usage et les récupérer (portabilité).",
            "Directement dans l'app : Profil → « Télécharger mes données » (fichier complet) et « Supprimer mon compte ». Pour toute autre demande : " + CONTACT + '.',
            "Si tu estimes que tes droits ne sont pas respectés, tu peux adresser une réclamation à la CNIL (www.cnil.fr).",
          ],
        },
        {
          title: 'Sécurité',
          paragraphs: [
            "Les échanges sont chiffrés (HTTPS) et chaque compte n'a accès qu'à ses propres données, grâce à des règles appliquées directement par la base de données.",
          ],
        },
        {
          title: 'Modifications',
          paragraphs: [
            "Cette politique peut évoluer avec l'app. La date de dernière mise à jour est indiquée en haut de la page.",
          ],
        },
      ],
    },
    notice: {
      title: 'Mentions légales',
      updated: 'Dernière mise à jour : 24 septembre 2026',
      intro: "Informations prévues par la loi pour la confiance dans l'économie numérique (LCEN).",
      sections: [
        {
          title: 'Éditeur',
          paragraphs: [
            `MealsUp est une application éditée à titre non professionnel par ${PUBLISHER}.`,
            `Contact : ${CONTACT}`,
            `Directeur de la publication : ${PUBLISHER}.`,
          ],
        },
        {
          title: 'Hébergement',
          paragraphs: [
            'Site : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com',
            'Données : Supabase Inc., 970 Toa Payoh North #07-04, Singapour 318992 — supabase.com',
          ],
        },
        {
          title: 'Contenus',
          paragraphs: [
            "28 recettes sont adaptées du jeu de données ouvert UniTools Recipes (theunitools.com, licence CC BY-SA 4.0), traduites et complétées. Les autres recettes ont été rédigées pour MealsUp.",
            "Les photos des recettes de base proviennent de Wikimedia Commons ; l'auteur et la licence de chaque photo sont indiqués sous la photo, sur la page de la recette.",
            "Les prix, valeurs nutritionnelles et calories sont des estimations indicatives calculées à partir de moyennes : elles ne constituent ni un conseil médical ou nutritionnel, ni un prix garanti.",
          ],
        },
        {
          title: 'Contenus des utilisateurs',
          paragraphs: [
            "Les recettes perso et leurs photos restent privées et sous la responsabilité de leur auteur, qui doit disposer des droits sur les photos qu'il ajoute.",
          ],
        },
      ],
    },
  },
  en: {
    privacy: {
      title: 'Privacy policy',
      updated: 'Last updated: September 24, 2026',
      intro:
        'This page explains which data MealsUp uses, why, who it is shared with and how to exercise your rights, in line with the General Data Protection Regulation (GDPR).',
      sections: [
        {
          title: 'Data controller',
          paragraphs: [`${PUBLISHER}, publisher of MealsUp. Contact: ${CONTACT}.`],
        },
        {
          title: 'Data used',
          paragraphs: [
            'Account: email address, username, profile photo (optional) and, if you sign in with Google, your Google account ID. Your password is handled by our authentication provider and is never visible to us.',
            'App use: excluded foods, diets, equipment, preferred store, fridge content, meal plan, shopping lists and purchase history, favorite recipes, ratings, own recipes (and their photos), messages sent through the contact form.',
            'Notifications (only if you turn them on): the technical delivery address provided by your browser.',
            'Importing a recipe from a link: the page address is sent to our server, which reads it to extract the recipe. The page is not kept.',
            'No health data is requested. The calories shown are estimates computed from the recipes, not measurements about you.',
          ],
        },
        {
          title: 'Why, and on what basis',
          paragraphs: [
            'This data is only used to run the app: meal plan, suggestions, shopping list, fridge, expiry alerts. Legal basis: performance of the service you use (GDPR article 6.1.b).',
            'Notifications rely on your consent (article 6.1.a), which you can withdraw at any time in the Profile or your phone settings.',
            'No advertising, no data resale, no commercial profiling.',
          ],
        },
        {
          title: 'Who can access it',
          paragraphs: [
            "Your data is only visible to you. The app administrator can see the list of accounts (email, username, sign-up date) and the contact form messages, for management and support.",
            "Technical providers (processors): Supabase (database, authentication, photo storage), Vercel (website hosting), Google (only if you use \"Continue with Google\"), and your browser's push service (Google, Apple or Mozilla) to deliver alerts. Some of them may process data outside the European Union; they are then bound by the European Commission's standard contractual clauses.",
          ],
        },
        {
          title: 'Retention',
          paragraphs: [
            'Your data is kept as long as your account exists. When you delete your account, it is erased immediately, except the messages sent through the contact form, which are kept without your email address.',
          ],
        },
        {
          title: 'Storage on your device',
          paragraphs: [
            "MealsUp uses no advertising cookies or analytics tools. The app keeps on your device (browser local storage) your sign-in session, your settings (language, theme) and a copy of the recipes to load faster. These are strictly necessary for the app to work and don't require consent.",
          ],
        },
        {
          title: 'Your rights',
          paragraphs: [
            'You can access, correct and erase your data, object to or restrict its processing, and get a copy of it (portability).',
            'Directly in the app: Profile → "Download my data" (full file) and "Delete my account". For any other request: ' + CONTACT + '.',
            'If you believe your rights are not respected, you can file a complaint with the CNIL (www.cnil.fr) or your local data protection authority.',
          ],
        },
        {
          title: 'Security',
          paragraphs: [
            'Traffic is encrypted (HTTPS) and each account can only access its own data, through rules enforced by the database itself.',
          ],
        },
        {
          title: 'Changes',
          paragraphs: ['This policy may change with the app. The last update date is shown at the top of the page.'],
        },
      ],
    },
    notice: {
      title: 'Legal notice',
      updated: 'Last updated: September 24, 2026',
      intro: 'Information required by French law (LCEN).',
      sections: [
        {
          title: 'Publisher',
          paragraphs: [
            `MealsUp is published on a non-professional basis by ${PUBLISHER}.`,
            `Contact: ${CONTACT}`,
            `Publication director: ${PUBLISHER}.`,
          ],
        },
        {
          title: 'Hosting',
          paragraphs: [
            'Website: Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA — vercel.com',
            'Data: Supabase Inc., 970 Toa Payoh North #07-04, Singapore 318992 — supabase.com',
          ],
        },
        {
          title: 'Content',
          paragraphs: [
            '28 recipes are adapted from the open UniTools Recipes dataset (theunitools.com, CC BY-SA 4.0 license), translated and completed. The other recipes were written for MealsUp.',
            'The photos of the built-in recipes come from Wikimedia Commons; the author and license of each photo are shown under it, on the recipe page.',
            'Prices, nutrition values and calories are indicative estimates based on averages: they are neither medical or nutrition advice nor guaranteed prices.',
          ],
        },
        {
          title: 'User content',
          paragraphs: [
            'Own recipes and their photos stay private and are the responsibility of their author, who must hold the rights to the photos they add.',
          ],
        },
      ],
    },
  },
}
