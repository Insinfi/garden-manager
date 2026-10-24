# Jardinier — mon potager

Application web en français pour dessiner un plan schématique de potager et organiser les tâches. Le dépôt fournit une première application fonctionnelle, utilisable en local et connectable à un projet Supabase privé pour synchroniser les données.

## Démarrer en local

Prérequis : Node.js 20 ou plus récent et npm.

```sh
npm install
npm run dev
```

Sans configuration, le bandeau **Mode local** indique clairement que les données sont conservées uniquement dans le stockage local du navigateur. Elles ne sont pas synchronisées entre appareils. Effacer les données du navigateur peut les supprimer : téléchargez un export JSON avant de changer de navigateur ou d’appareil.

## Activer la synchronisation (Supabase)

Le fournisseur retenu pour l’intégration v1 est **Supabase Free**, sous les limites et réserves ci-dessous. Le dépôt ne contient aucun projet, compte, clé secrète, ni données réelles. Pour utiliser la synchronisation :

1. Créez un projet Supabase sous le plan Free, sans ajouter de module payant ni activer un plan payant. Choisissez une région européenne précise disponible (par exemple `eu-central-1`, Francfort) et vérifiez-la dans le tableau de bord avant d’y saisir des données.
2. Dans le SQL Editor, exécutez [`supabase/migrations/0001_private_gardens.sql`](supabase/migrations/0001_private_gardens.sql). Vérifiez que RLS est actif et que les quatre politiques propriétaire sont en place.
3. Dans les réglages d’authentification, configurez l’URL de l’application, le mode de confirmation e-mail souhaité et les paramètres de mot de passe. Le service d’e-mail par défaut peut être soumis aux limites Free. N’ajoutez pas de fournisseurs sociaux ou de module avancé payants.
4. Copiez l’URL du projet et sa clé **publishable** (ou ancienne clé `anon`) dans `.env.local` :

   ```dotenv
   VITE_SUPABASE_URL=https://votre-projet.supabase.co
   VITE_SUPABASE_ANON_KEY=votre-cle-publishable
   ```

   Cette clé de projet est publique dans une application front-end et n’est pas un secret : elle n’est sûre qu’avec l’authentification et RLS correctement configurés. **Ne mettez jamais une clé `service_role`/secret dans le navigateur, le dépôt ou les variables `VITE_*`.** Le fichier `.env.local` est ignoré par Git.
5. Redémarrez `npm run dev`, créez votre compte dans l’application, puis connectez-vous sur vos autres appareils avec le même compte. Les modifications ne sont confirmées qu’après la réponse de la base distante. Les changements simultanés sur plusieurs appareils ne font pas l’objet d’une fusion automatique ; utilisez un appareil à la fois.

Les données en ligne sont stockées dans une ligne par compte dans `public.gardens`. Le client ne lit ou ne modifie que la ligne dont `owner_id` correspond à `auth.uid()`. Il n’y a ni partage, ni URL publique, ni stockage photo.

Pour rendre l’application accessible depuis plusieurs appareils par Internet, il faut aussi publier le dossier de production `dist/` sur un hébergement statique HTTPS. Ce ticket n’a sélectionné ni configuré de fournisseur d’hébergement : choisissez-en un avant la mise en service et vérifiez séparément son coût et ses conditions. L’application lit le dernier potager enregistré à l’ouverture/au rechargement; les mises à jour ne sont pas poussées en temps réel et les modifications simultanées ne sont pas fusionnées.

### Coût, confidentialité et limites vérifiés

Vérification documentaire effectuée le **24 octobre 2026**. Les pages du fournisseur peuvent changer ; vérifiez les limites et le choix de région dans le tableau de bord avant toute utilisation réelle.

- Le plan **Free est annoncé à 0 USD/mois**. La page de tarification consultée annonçait notamment 500 MB de base de données, 50 000 utilisateurs actifs mensuels, 5 GB de transfert sortant, 1 GB de stockage fichier, et au plus 2 projets actifs Free. Cela suffit en principe pour un seul petit document de jardin sans photos, mais les limites ne sont pas garanties à vie.
- Supabase indique qu’un projet Free peut être mis en pause après une semaine d’inactivité et doit alors être restauré depuis le tableau de bord. Il ne s’agit pas d’une disponibilité garantie. Le Free n’inclut pas les sauvegardes quotidiennes téléchargeables : Supabase recommande des exports manuels réguliers par son CLI (`supabase db dump`). Aucun service gratuit ne garantit ici une récupération permanente.
- Export : l’application permet de télécharger le document de jardin JSON depuis **Exporter mes données**. Un export PostgreSQL peut également être créé avec le Supabase CLI. Vérifiez régulièrement qu’un export est lisible et stockez-en une copie privée hors du service.
- Suppression : les politiques autorisent le propriétaire connecté à supprimer sa ligne `gardens`; cette suppression via le tableau de bord SQL est immédiate. La suppression du compte Auth ou du projet se gère dans Supabase Dashboard. La suppression du projet supprime définitivement les données associées, y compris les sauvegardes hébergées.
- Confidentialité : la politique de confidentialité Supabase distingue les données client (traitées principalement comme sous-traitant selon les instructions du client) et les données de compte Supabase. Elle signale que des données personnelles peuvent être transférées, stockées et traitées dans d’autres pays; les divulgations EEE et l’addendum de traitement sont consultables publiquement. La documentation régionale indique que la région choisie détermine l’emplacement des données primaires et que le choix n’est pas une preuve de conformité réglementaire. Une région européenne choisie pour la base ne prouve donc pas à elle seule que toute donnée de service ou d’assistance reste dans l’EEE. N’y placez pas d’information sensible et lisez les documents contractuels/régionaux à jour. Le plan Free n’offre pas les SLA de disponibilité d’un plan payant.
- Le coût reste à 0 uniquement tant que le projet et l’application restent sur le plan Free et n’activent aucun service payant. Le fournisseur peut modifier ses quotas ou conditions ; cette application ne peut garantir l’absence de changement futur du fournisseur.

Sources officielles consultées :

- [Tarifs et limites Free](https://supabase.com/pricing)
- [Liste de contrôle de production — pause et sauvegardes Free](https://supabase.com/docs/guides/deployment/going-into-prod#free-plan)
- [Sauvegardes, export CLI et suppression de projet](https://supabase.com/docs/guides/platform/backups)
- [Données front-end, clés publishable et RLS](https://supabase.com/docs/guides/database/secure-data)
- [Authentification et politiques d’accès](https://supabase.com/docs/guides/auth)
- [Régions et résidence des données](https://supabase.com/docs/guides/platform/regions)
- [Politique de confidentialité et transferts internationaux](https://supabase.com/privacy)
- [Addendum de traitement des données](https://supabase.com/legal/customer-resources/data-processing-addendum)

**Décision utilisateur encore requise avant synchronisation réelle :** confirmer que le traitement Supabase et les transferts potentiellement hors EEE sont acceptables, choisir la région européenne souhaitée au moment de la création du projet, puis fournir uniquement l’URL du projet et la clé publishable à placer localement dans `.env.local`. Ne partagez jamais la clé `service_role`.

## Repères de jardinage

Les repères fournis sont limités à deux exemples explicitement décrits par Velt dans son calendrier régional des légumes et fruits de saison : fraises (avril à août) et asperges (printemps). Les suggestions sont des rappels d’observation, pas des instructions de semis ou des promesses de récolte pour une variété donnée. Les conseils n’apparaissent qu’après l’action **Conseils : [nom de plante]**. Pour un nom sans repère local vérifié, l’application explique qu’elle ne va pas inventer une recommandation.

Source consultée le 24 octobre 2026 : [Velt — calendrier des saisons](https://velt.nu/seizoenskalender). Velt décrit sa région et les cultures de plein air ou de serres non chauffées; la page ne constitue pas un calendrier de plantation propre au microclimat de Tournai.

## Vérifications

```sh
npm run typecheck
npm test
npm run build
```

Le projet ne contient pas de navigateur automatisé ni d’environnement de test avec un vrai projet Supabase. Les tests couvrent les règles métier locales; le build/typecheck vérifient l’intégrité TypeScript et la compilation. L’authentification, RLS et la synchronisation inter-appareils doivent encore être validées après création d’un projet configuré par l’utilisateur.