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
recevraient rien. Il faut brancher un service d'envoi (SMTP) :

1. Créer un compte gratuit sur **Brevo** (brevo.com, 300 e-mails/jour gratuits).
2. Brevo → *Senders, Domains & Dedicated IPs* → ajouter et valider l'adresse
   d'expédition (par exemple ton adresse e-mail).
3. Brevo → *SMTP & API* → onglet SMTP : noter le serveur (`smtp-relay.brevo.com`),
   le port (`587`), l'identifiant, et générer une **clé SMTP**.
4. Supabase → *Authentication → Emails → SMTP Settings* : activer **Enable Custom SMTP**
   et renseigner :
   - Sender email : l'adresse validée à l'étape 2
   - Sender name : `MealsUp`
   - Host : `smtp-relay.brevo.com` — Port : `587`
   - Username : l'identifiant SMTP Brevo — Password : la clé SMTP
5. Toujours dans *Authentication → Rate Limits*, remonter **Rate limit for sending emails**
   (par exemple 30 par heure).

(Avec un nom de domaine à toi, Resend ou Brevo avec le domaine authentifié donnent une
meilleure délivrabilité : moins de risques de finir dans les spams.)

## 3. Durée de validité du lien

*Authentication → Sign In / Providers → Email* : **Email OTP Expiration** = `86400`
(24 heures, le maximum). Le texte de l'e-mail l'annonce. Si le lien a expiré,
l'utilisateur en redemande un depuis l'écran de connexion.

## 4. Adresses autorisées pour le retour dans l'app

*Authentication → URL Configuration* :
- **Site URL** : l'adresse de l'app sur Vercel (ex. `https://mealsup.vercel.app`)
- **Redirect URLs** : ajouter `https://<ton-app>.vercel.app/**` et
  `http://localhost:5173/**` (pour les tests en local).

## 5. Texte de l'e-mail

*Authentication → Emails → Templates → Confirm signup* :
- Subject : `Active ton compte MealsUp`
- Body : coller le contenu de `supabase/email-templates/confirm-signup.html`
  (sans le commentaire du début).

## Vérifier

1. S'inscrire avec une adresse de test : l'écran « Plus qu'une étape ! » s'affiche.
2. L'e-mail arrive (regarder aussi les spams) ; le bouton « Activer mon compte »
   ramène dans l'app, connecté.
3. Tant que le lien n'est pas cliqué, la connexion affiche « Ton compte n'est pas
   encore activé » avec un bouton pour renvoyer l'e-mail.
4. Nettoyage à 30 jours : `select * from cron.job;` doit lister
   `mealsup-delete-unconfirmed-accounts`.
