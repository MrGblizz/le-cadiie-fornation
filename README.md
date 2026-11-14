# Le Cadiie Formation

Site de formation pour jeunes militant·es et syndiqué·es, construit avec [Astro](https://astro.build).
Aucun contenu n'est codé en dur dans les pages : formations, numéros du journal et ressources sont de simples
fichiers YAML / Markdown.

## Lancer le site

Prérequis : Node.js 20 ou plus récent.

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # génère le site statique dans dist/
npm run preview   # prévisualise le build
```

## Où se trouve le contenu ?

Trois niveaux :

- **Parcours** : enchaîne des formations entières et/ou des cours seuls (ex. « La base du militantisme »).
- **Formation** : regroupe plusieurs cours sur un même sujet.
- **Cours** : le contenu lui-même, avec son quiz de début et de fin.

```
formations/
  nom_formation/                ← une formation
    formation.yaml              ← infos de la formation + ordre des cours
    images/                     ← image de présentation de la formation
    styles/                     ← CSS facultatif (s'applique à la formation et à tous ses cours)
    cours/
      nom_cours/                ← un cours
        cours.yaml              ← infos, quiz de début, contenu, quiz de fin
        styles/                 ← CSS facultatif propre au cours
        htmls/                  ← fragments HTML facultatifs (champ `html:`)
        sons/                   ← sons (champ `son:`)
        images/                 ← images (champs `image:`)
        videos/                 ← (facultatif) vidéos locales ; sinon un lien YouTube/PeerTube
contenu/
  parcours/*.yaml               ← un parcours par fichier
  journal/*.md                  ← un numéro du journal par fichier
  ressources/*.yaml             ← une catégorie de ressources par fichier
docs/modele-formation/          ← modèle commenté (formation + cours) à copier
```

Adresses : `/formations/<formation>/`, `/formations/<formation>/<cours>/`, `/parcours/<parcours>/`.

### Ajouter une formation et ses cours

1. Copier `docs/modele-formation/` dans `formations/` et renommer le dossier (`formations/ma-formation`).
2. Remplir `formation.yaml` (nom, résumé, niveau, thèmes, formations prérequises, ordre des cours…).
3. Pour chaque cours, copier `cours/modele-de-cours/` et le renommer, puis remplir `cours.yaml`.
4. Le site vérifie tout au lancement : champ manquant, cours ou dépendance inconnue, fichier introuvable
   → erreur explicite.

Le temps total d'une formation (lecture, pratique, maîtrise) et sa modalité (la plus exigeante de ses cours)
sont calculés automatiquement.

Pour désigner un cours (dépendances, quiz, parcours) : `nom-du-cours` s'il est dans la même formation,
sinon `formation/nom-du-cours`.

Le **quiz de début** d'un cours évalue les prérequis : chaque question peut indiquer la `dependance` qu'elle
teste. Sous le seuil, un message invite à réviser les cours correspondants (avec liens). Réussir le **quiz de
fin** marque le cours comme validé dans le programme de la formation (mémorisé dans le navigateur).

### Ajouter un parcours

Créer `contenu/parcours/mon-parcours.yaml` :

```yaml
titre: La base du militantisme
resume: Le parcours idéal pour débuter.
etapes:
  - formation: syndicalisme                  # une formation entière
  - cours: communication/creer-une-affiche   # un cours seul
    note: Commentaire facultatif affiché sur l'étape.
```

### Sections « plus suivies » et « nouvelles »

- **Plus suivies et appréciées** : calculé à partir du champ `popularite` (saisi à la main, le site étant statique).
- **Nouvelles formations** : formations dont `date_ajout` a moins de 45 jours au moment du build
  (réglable dans `src/lib/formations.ts`). La section n'apparaît que s'il y en a.

### Ajouter un numéro du journal

Créer `contenu/journal/AAAA-MM-sujet.md` avec l'en-tête : `titre`, `numero`, `date`, `sujets`, `resume`,
et facultativement `auteur`, `couleur`, `couverture` (image).

### Ajouter une catégorie de ressources

Créer `contenu/ressources/categorie.yaml` avec `titre`, `type` (sert au filtre), `description`, `icone`, `liens`.

## Code

- `src/content.config.ts` — schéma des contenus (validation des YAML)
- `src/layouts/Base.astro` — mise en page + filtres de la barre latérale
- `src/components/Sidebar.astro` — navigation et recherche
- `src/pages/recherche.json.ts` — index de recherche généré au build
- `src/components/Quiz.astro` — quiz de début et de fin
Voici un readme
