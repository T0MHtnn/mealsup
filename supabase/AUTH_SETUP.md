# Inscription avec e-mail de confirmation — réglages Supabase

Le code de l'app gère déjà tout (écran « Vérifie ta boîte mail », bouton « Renvoyer
l'e-mail », message clair si on essaie de se connecter sans avoir activé son compte).
`schema.sql` crée le profil MealsUp **seulement après** la confirmation et supprime
chaque nuit les comptes jamais confirmés au bout de 30 jours.

Il reste 5 réglages à faire dans le tableau de bord Supabase.

## 0. Activer les comptes déjà inscrits (une seule fois, avant tout le reste)

Les comptes créés avant la mise en place de la confirmation doivent rester utilisables.
Dans *SQL Editor*, lancer **une seule fois** (ne pas l'ajouter à `schema.sql`, sinon
les futurs inscrits seraient activés sans confirmer) :

```sql
-- Nombre de comptes pas encore confirmés (pour voir ce qui va changer)
SELECT count(*) FROM auth.users WHERE email_confirmed_at IS NULL;

-- Les considérer comme confirmés dès maintenant
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;
```

À faire avant de lancer `schema.sql` : la tâche de nettoyage (comptes non confirmés
depuis 30 jours) ne doit trouver aucun ancien compte à supprimer.

## 1. Activer la confirmation par e-mail

*Authentication → Sign In / Providers → Email* : activer **Confirm email**.

## 2. Envoyer les e-mails avec un vrai service (obligatoire)

Le service d'e-mail intégré à Supabase n'envoie qu'aux adresses des membres de
l'équipe du projet, et 2 e-mails par heure au maximum : les vrais utilisateurs ne
recevraient rien. Il faut brancher un service d'envoi (SMTP). Le plus simple : **Gmail**.

1. Sur le compte Google qui enverra les e-mails, activer la validation en 2 étapes,
   puis créer un **mot de passe d'application** (myaccount.google.com/apppasswords).
2. Supabase → *Authentication → Emails → SMTP Settings* : activer **Enable Custom SMTP**
   et renseigner :
   - Sender email : l'adresse Gmail — Sender name : `MealsUp`
   - Host : `smtp.gmail.com` — Port : `587`
   - Username : l'adresse Gmail — Password : le mot de passe d'application
3. *Authentication → Rate Limits* : remonter **Rate limit for sending emails**
   (par exemple 30 par heure).

Gmail suffit pour démarrer (environ 500 e-mails par jour), mais les premiers e-mails
peuvent arriver dans les spams. Avec un nom de domaine à toi, un service comme Resend
ou Brevo avec le domaine authentifié donne une meilleure délivrabilité.

## 3. Durée de validité du lien

Rien à régler : Supabase garde sa durée par défaut (le réglage « Email OTP Expiration »
n'apparaît pas sur tous les projets). L'e-mail ne promet pas de durée précise ; si le
lien a expiré, l'utilisateur en redemande un depuis l'écran de connexion.

## 4. Adresses autorisées pour le retour dans l'app

*Authentication → URL Configuration* :
- **Site URL** : l'adresse de l'app sur Vercel (ex. `https://mealsup.vercel.app`)
- **Redirect URLs** : ajouter `https://<ton-app>.vercel.app/**` et
  `http://localhost:5173/**` (pour les tests en local).

## 5. Texte de l'e-mail

*Authentication → Emails → Templates → Confirm signup* :
- Subject : `Active ton compte MealsUp`
- Body (onglet *Source*) : coller le contenu de `supabase/email-templates/confirm-signup.html`
  à partir de la ligne `<!DOCTYPE html>` (sans le commentaire du début).
- Le logo de l'e-mail est chargé depuis `{{ .SiteURL }}/brand/logo-email.png` : la
  **Site URL** (étape 4) doit être l'adresse Vercel, et le code doit être déployé.

## Vérifier

1. S'inscrire avec une adresse de test : l'écran « Plus qu'une étape ! » s'affiche.
2. L'e-mail arrive (regarder aussi les spams) ; le bouton « Activer mon compte »
   ramène dans l'app, connecté.
3. Tant que le lien n'est pas cliqué, la connexion affiche « Ton compte n'est pas
   encore activé » avec un bouton pour renvoyer l'e-mail.
4. Nettoyage à 30 jours : `select * from cron.job;` doit lister
   `mealsup-delete-unconfirmed-accounts`.
