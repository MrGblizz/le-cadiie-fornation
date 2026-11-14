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

```
formations/                     ← une formation = un dossier
  nom_formation/
    formation.yaml              ← toute la formation (infos, quiz, contenu)
    styles/                     ← CSS facultatif qui écrase le style du site sur cette formation
    htmls/                      ← fragments HTML intégrés au contenu (champ `html:`)
    sons/                       ← sons (champ `son:`)
    images/                     ← images (champs `image:`)
    videos/                     ← (facultatif) vidéos locales ; sinon un lien YouTube/PeerTube
contenu/
  journal/*.md                  ← un fichier Markdown par numéro
  ressources/*.yaml             ← une catégorie de ressources par fichier
docs/modele-formation/          ← modèle commenté à copier pour créer une formation
```

### Ajouter une formation

1. Copier `docs/modele-formation/` dans `formations/` et renommer le dossier (`formations/ma-formation`).
2. Remplir `formation.yaml` (tous les champs sont expliqués dans le modèle).
3. Le site vérifie le fichier au lancement : un champ manquant, une dépendance inconnue ou un fichier introuvable
   provoque une erreur explicite.

Champs principaux : `nom`, `resume`, `image`, `niveau` (debutant/intermediaire/avance), `dependances`,
`temps` (lecture, pratique, maitrise), `modalite` (terrain/support/maison), `quiz_debut`, `contenu`, `quiz_fin`.

Le **quiz de début** évalue les prérequis : chaque question peut indiquer la `dependance` qu'elle teste.
Sous le seuil, un message invite à réviser les formations correspondantes (avec liens).

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
