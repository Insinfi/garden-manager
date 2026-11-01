# Jardinier — mon potager

Application web en français pour dessiner un plan schématique de potager et organiser les tâches. Les conseils s’ouvrent uniquement à la demande et les tâches suggérées restent modifiables.

## Démarrer en local

Prérequis : Node.js 20 ou plus récent et npm.

```sh
npm ci
npm run dev
```

Sans configuration, le bandeau **Mode local** indique que les données sont conservées dans le stockage local de ce navigateur seulement. Elles ne sont pas synchronisées entre appareils. Effacer les données du navigateur peut les supprimer : utilisez **Exporter mes données** avant de changer de navigateur ou d’appareil.

## Activer une synchronisation privée

La persistance en ligne utilise **Supabase Free**; l’app web statique est prévue pour **Cloudflare Pages Free**. Ces choix ont été vérifiés le **24 octobre 2026**. Aucun compte, projet, secret ni jardin réel n’est fourni dans ce dépôt. Le service en ligne n’est pas actif tant que vous n’avez pas réalisé les étapes utilisateur ci-dessous.

**Avant tout usage avec des données réelles :** l’utilisateur doit consulter et accepter les conditions actuelles des deux fournisseurs, notamment le traitement potentiellement international des données de compte/logs Supabase et des métadonnées d’accès Cloudflare. Si cette circulation n’est pas acceptable, ne créez pas le projet avec des données personnelles; demandez une autre décision fournisseur à l’Analyste.

### 1. Créer le stockage Supabase

1. Créez un projet Supabase en restant sur **Free**, sans module payant ni passage automatique à un forfait payant. Choisissez la région AWS précise **Central EU (Frankfurt), `eu-central-1`** dans la liste des régions disponibles, puis vérifiez la région indiquée par le projet avant d’y saisir des données. Ne choisissez pas seulement le groupe générique « Europe ».
2. Dans le SQL Editor du projet, exécutez [`supabase/migrations/0001_private_gardens.sql`](supabase/migrations/0001_private_gardens.sql). Vérifiez que RLS est activé sur `public.gardens`, que le rôle `anon` n’a aucun privilège et que les politiques du rôle authentifié limitent lecture, création, modification et suppression à `auth.uid() = owner_id`.
3. Configurez une authentification e-mail/mot de passe. Pour ne pas dépendre du service e-mail de test ou d’un SMTP payant, désactivez la confirmation par e-mail avant de créer votre compte dans l’app. Après la création et la connexion au compte personnel, désactivez les nouvelles inscriptions dans les réglages Auth. Utilisez un mot de passe unique et protégez le compte d’administration du projet avec MFA. La récupération de mot de passe par e-mail n’est pas configurée; gardez l’export JSON à jour.
4. Copiez l’URL du projet et la clé **publishable** (ou ancienne clé `anon`) dans les variables d’environnement de production décrites plus bas. Ces clés de client sont visibles dans le JavaScript livré. Elles n’autorisent aucune lecture de jardin sans session et les règles RLS correctes. **Ne copiez jamais une clé `service_role`, une clé `secret`, un jeton d’accès ou un mot de passe dans le client, dans Git, ni dans une variable `VITE_*`.**

Le schéma conserve un seul document JSON par compte dans `public.gardens`. L’API exige une session authentifiée et RLS vérifie le propriétaire sur chaque opération. Aucun lien public ni partage n’est proposé. Chaque enregistrement cloud confirmé est écrit au service; un autre appareil connecté au même compte récupère la dernière version à l’ouverture/rechargement. Il n’y a ni synchronisation poussée en temps réel ni fusion des modifications simultanées : utilisez un seul appareil à la fois.

### 2. Publier l’app sur Cloudflare Pages

1. Créez un compte Cloudflare, puis un projet **Workers & Pages → Pages → Connect to Git** pour `Insinfi/garden-manager`. Gardez le domaine fourni `*.pages.dev`; un domaine personnalisé n’est pas nécessaire.
2. Utilisez le répertoire racine `/`, le build `npm run build`, la version Node 20 ou plus récente, et le dossier de sortie `dist`.
3. Définissez uniquement dans l’environnement **Production** de Pages les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`, avec les deux valeurs publiques copiées à l’étape Supabase. Ne définissez pas ces variables pour les prévisualisations de branches. Les prévisualisations sans configuration restent en mode navigateur local.
4. Après le premier déploiement, copiez l’URL HTTPS `https://<projet>.pages.dev` dans **Supabase → Authentication → URL Configuration** comme Site URL et URL de redirection autorisée. Autorisez aussi `http://localhost:5173/**` uniquement si vous utilisez l’app en local. Redéployez l’app après un changement de variable d’environnement.
5. Ouvrez l’URL Pages, créez le compte personnel puis connectez-vous. Connectez le second appareil au même URL et au même compte. Testez les accès et exports ci-dessous avant de saisir les données de jardin réelles.

`public/_headers` pose des en-têtes de sécurité de base et demande de ne pas mettre `index.html` en cache. Pages ne reçoit pas les requêtes de base de données : le navigateur communique directement avec le domaine Supabase en HTTPS. Le domaine Pages et le shell applicatif sont publics; les données, les identifiants de compte et les réponses d’API ne doivent jamais être ajoutés à des fichiers statiques, à une prévisualisation, à un dépôt ou à une télémétrie.

### 3. Vérifier l’installation de votre projet

- Sur l’appareil A, enregistrez une zone/plante ou une tâche, puis attendez le retour de sauvegarde confirmée.
- Sur l’appareil B, connectez-vous au même compte et rechargez l’app : vérifiez que la modification est visible.
- Déconnectez-vous et vérifiez que l’app ne peut pas lire le jardin; si vous avez un second compte de test, vérifiez qu’il ne voit pas la ligne du propriétaire.
- Dans **Exporter mes données**, téléchargez et ouvrez le JSON. Pour supprimer le document de jardin, utilisez le **Table Editor** du bon projet Supabase et supprimez la ligne correspondante dans `public.gardens`. Pour supprimer aussi le compte Auth, supprimez l’utilisateur dans le tableau de bord Auth. Pour effacer le projet et ses données, utilisez la suppression de projet dans le tableau de bord et confirmez son nom. L’export JSON est la sauvegarde portable; les sauvegardes hébergées associées disparaissent lorsque le projet est supprimé.

Ne considérez pas la synchronisation comme validée tant que vous n’avez pas effectué un véritable test entre deux appareils/navigateurs après déploiement et vérifié les refus d’accès. Aucune de ces opérations n’a été exécutée par le développeur dans ce dépôt.

### Conditions de stockage vérifiées

Vérification documentaire : **24 octobre 2026**. Sources officielles; les conditions peuvent changer.

- **Offre/coût :** la page officielle affiche Free à **0 USD/mois**, 500 MB de base de données, 50 000 utilisateurs actifs mensuels, 5 GB d’egress, 5 GB d’egress mis en cache, 1 GB de stockage et deux projets Free actifs. Un seul petit document JSON de jardin sans photos est très inférieur aux quotas indiqués. Aucun achat de stockage/fonction additionnel n’est requis par cette app. Ne passez pas à un forfait payant; les prix, quotas et disponibilité ne sont pas garantis à vie.
- **Disponibilité et reprise :** Supabase signale que les projets Free sont mis en pause après une semaine d’inactivité. Le plan Free ne propose pas les sauvegardes quotidiennes téléchargeables des plans payants; il recommande des exports réguliers via son CLI. Une pause peut interrompre la synchronisation jusqu’à reprise manuelle. Le JSON exporté par l’app reste la sauvegarde portable. Supabase indique que la suppression du projet efface définitivement ses données et ses sauvegardes gérées.
- **Région :** Supabase répertorie l’option précise `eu-central-1` (Francfort). Elle place les données primaires du projet dans la région choisie; la région choisie seule ne prouve pas que tous les processus de support, compte, sous-traitants, journaux ou sauvegardes éventuels restent dans l’EEE, ni qu’un usage particulier est conforme à une loi.
- **Confidentialité/contrat :** la politique Supabase distingue les données client traitées pour le compte du client et les données personnelles de compte; elle indique que des données personnelles peuvent être transférées, stockées et traitées hors du pays de collecte. Le DPA Supabase décrit le traitement et les transferts. Il faut lire et accepter les conditions, la politique, le DPA et les sous-traitants actuels lors de la création du projet. Aucun avis juridique ni garantie de conformité n’est fourni.
- **Contrôle d’accès :** le client utilise une clé publishable et la session Auth; RLS applique les quatre politiques propriétaire de la migration. Les secrets/service-role contournent RLS et ne sont jamais nécessaires dans le navigateur. Il faut contrôler le projet réel après migration; le fichier SQL et les tests locaux ne prouvent pas que le tableau de bord a appliqué la migration.
- **Export/suppression :** export JSON lisible depuis l’app; export SQL possible avec Supabase CLI. La suppression du document/du compte/du projet se fait dans le tableau de bord Supabase; la suppression du projet est irréversible. Les sauvegardes Free non téléchargeables ne remplacent pas un export privé conservé hors du fournisseur.

### Conditions d’hébergement vérifiées

**Cloudflare Pages Free** est retenu comme hébergement statique HTTPS conditionnel, vérifié le **24 octobre 2026**. Les pages `pages.dev` sont servies par le réseau mondial de Cloudflare; un domaine `pages.dev` reçoit HTTPS. Les limites Pages Free publiées comprennent 500 builds/mois (un build à la fois), 20 000 fichiers par site et 25 MiB par fichier. Cloudflare précise que les requêtes d’assets statiques sont gratuites et illimitées, tandis que Pages Functions sont facturées selon le plan Workers; cette application n’utilise aucune Function. L’application Vite reste très en dessous des limites de fichiers. Aucun Worker/Function, stockage Pages, domaine payant ou add-on n’est requis; gardez le compte sur Free et n’activez aucune option payante. Cloudflare peut modifier les limites/conditions et ne garantit pas une disponibilité permanente gratuite.

L’hôte ne sert que les ressources statiques publiques. Le trafic jardin/API passe entre le navigateur et Supabase, sans proxy Worker Pages. Cloudflare peut néanmoins traiter les métadonnées de requête nécessaires à la distribution (p. ex. adresse réseau et journaux) sur son réseau global; sa politique et son DPA ne constituent pas une promesse de traitement exclusivement EEE. L’hébergement de l’app ne place donc pas le document du jardin dans Pages, mais l’utilisateur doit examiner/accepter les conditions et le traitement des métadonnées par Cloudflare. La période de rétention des journaux de requêtes Pages Free n’a pas pu être confirmée dans les pages officielles consultées. La suppression du projet Pages se fait dans le tableau de bord Cloudflare; supprimer Pages ne supprime pas le projet Supabase, et inversement.

Le compte Cloudflare/GitHub, la création des projets, l’acceptation contractuelle, la sélection de la région, la migration SQL, la saisie des variables de production, la désactivation des nouvelles inscriptions et le test sur appareils restent des étapes à effectuer par l’utilisateur. Pas de credentials ni de projet de production dans le dépôt.

Sources officielles consultées le 24 octobre 2026 :

- Supabase : [tarifs Free](https://supabase.com/pricing), [régions et résidence des données](https://supabase.com/docs/guides/platform/regions), [sécuriser les données/RLS et clés de client](https://supabase.com/docs/guides/database/secure-data), [authentification](https://supabase.com/docs/guides/auth), [sauvegardes/export et suppression](https://supabase.com/docs/guides/platform/backups), [politique de confidentialité](https://supabase.com/privacy), [DPA](https://supabase.com/legal/customer-resources/data-processing-addendum), [liste de contrôle de production](https://supabase.com/docs/guides/deployment/going-into-prod#free-plan).
- Cloudflare : [limites Pages](https://developers.cloudflare.com/pages/platform/limits/), [tarification Pages Functions/actifs statiques](https://developers.cloudflare.com/pages/functions/pricing/), [Free plan](https://www.cloudflare.com/plans/free/), [déploiement Pages direct](https://developers.cloudflare.com/pages/get-started/direct-upload/), [accord self-serve](https://www.cloudflare.com/terms/), [politique de confidentialité](https://www.cloudflare.com/privacypolicy/), [DPA](https://www.cloudflare.com/cloudflare-customer-dpa/), [sous-traitants](https://www.cloudflare.com/gdpr/subprocessors/), [informations GDPR/transferts](https://www.cloudflare.com/trust-hub/gdpr/), [HTTPS Pages](https://developers.cloudflare.com/pages/configuration/preview-deployments/).

## Catalogue horticole — couverture et limites

Le catalogue version `potager-be-v2`, revu le **24 octobre 2026**, est un petit ensemble déterministe de repères de semis/récolte issus du calendrier publié sur **Intratuin Belgique**, complété par le calendrier alimentaire régional Velt pour fraises/asperges et une fiche culturale belge COMPO pour deux types de framboisiers. La liste machine-readable et ses lacunes sont dans [`src/domain/cropCatalog.ts`](src/domain/cropCatalog.ts); les conseils ne s’affichent qu’après demande explicite. Les noms sont rapprochés par égalité exacte après normalisation d’accents/espaces; un nom inconnu ou ambigu (p. ex. « framboisier » sans type) ne reçoit pas de conseil deviné.

Couverture actuelle : tomate, carotte, laitue pommée, radis, épinard, concombre, betterave, haricot, poireau, fraisier, asperge, framboisier d’été et framboisier d’automne. Le calendrier Intratuin permet de proposer des rappels mensuels de semis et de vérification de récolte; COMPO étaye les actions de taille pour les deux types de framboisiers avec leurs périodes et préconditions. Les règles sont liées à la plante enregistrée, aux mois et à la source correspondante. Le mot « récolte » est présenté comme vérification de maturité, pas promesse de récolte. Pour l’asperge, le calendrier Velt ne suffit pas à créer une tâche de culture : aucune action automatique n’est générée.

**Limite à ne pas masquer :** le calendrier belge est un repère général régional et non une observation/validation pour Tournai, une variété, un microclimat ou une parcelle. La plupart des entrées n’ont pas de source pour la taille, l’arrosage, les maladies, les caractéristiques du cultivar ou l’installation de plants. Elles ne constituent donc pas un catalogue exhaustif de conseils robustes de culture; les cultures non listées et ces catégories restent sans conseil automatique. Pour améliorer cette couverture sans inventer de faits, il faut une source horticole examinée pour Tournai/Hainaut ou une décision Analyste/utilisateur acceptant explicitement ce calendrier régional comme référence de départ.

Sources horticoles :

- [Intratuin Belgique — calendrier de semis du potager](https://www.intratuin.be/inspiratie/zaaikalender-moestuin): mois de semis sous abri/pleine terre et récolte dans son tableau; région de publication belge, mais aucune calibration communale.
- [Velt — calendrier des légumes et fruits de saison](https://velt.nu/seizoenskalender): fraises avril–août et asperges au printemps; il s’agit de saisonnalité de produits régionaux, pas d’un guide de culture d’un plant du jardin.
- [COMPO Belgique — framboises : planter, soigner et tailler](https://www.compo.be/nl/advies/planten/kruiden-groenten-fruit/framboos): différences été/automne, plantation des racines nues et taille après récolte. Les conseils ne s’appliquent qu’après identification du type.

## Vérifications

```sh
npm run typecheck
npm test
npm run build
npm audit
git diff --check
```

Ces commandes vérifient l’application locale et le catalogue livré. Elles ne remplacent pas une configuration réelle Supabase/Cloudflare, l’inspection des politiques RLS déployées, un test de compte non authentifié/différent, le test HTTPS en production, ou le test de synchronisation entre deux appareils. Aucun projet cloud ni hébergement n’est configuré ici.
