import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* ------------------------------------------------------------------ */
/*  Quiz (début et fin de formation)                                   */
/* ------------------------------------------------------------------ */
const question = z.object({
  question: z.string(),
  choix: z.array(z.string()).min(2),
  /** Index (à partir de 0) de la bonne réponse, ou liste d'index si plusieurs. */
  reponse: z.union([z.number().int(), z.array(z.number().int()).min(1)]),
  explication: z.string().optional(),
  /** Identifiant (nom du dossier) de la formation prérequise que la question évalue. */
  dependance: z.string().optional(),
});

const quiz = z.object({
  /** Pourcentage de bonnes réponses nécessaire pour valider. */
  seuil: z.number().min(0).max(100).default(70),
  questions: z.array(question).min(1),
});

/* ------------------------------------------------------------------ */
/*  Formations : un dossier par formation, fichier formation.yaml      */
/* ------------------------------------------------------------------ */
const formations = defineCollection({
  loader: glob({
    base: './formations',
    pattern: '*/formation.{yaml,yml}',
    // l'identifiant d'une formation = le nom de son dossier
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: ({ image }) =>
    z.object({
      nom: z.string(),
      resume: z.string(),
      /** Chemin relatif au fichier formation.yaml, ex. images/couverture.svg */
      image: image().optional(),
      niveau: z.enum(['debutant', 'intermediaire', 'avance']),
      themes: z.array(z.string()).default([]),
      /** Identifiants (noms de dossier) des formations à suivre avant. */
      dependances: z.array(z.string()).default([]),
      temps: z.object({
        /** Minutes pour simplement la lire. */
        lecture: z.number().positive(),
        /** Minutes pour la faire en la lisant (exercices compris). */
        pratique: z.number().positive(),
        /** Jours de pratique pour la maîtriser complètement. */
        maitrise: z.number().positive(),
      }),
      /**
       * terrain : doit absolument être accompagnée d'une formation de terrain
       * support : est un support de formation physique
       * maison  : peut entièrement être faite à la maison
       */
      modalite: z.enum(['terrain', 'support', 'maison']),
      date_ajout: z.coerce.date().optional(),
      /** Saisi à la main pour l'instant (pas de base de données). */
      popularite: z
        .object({
          suivis: z.number().int().nonnegative().default(0),
          note: z.number().min(0).max(5).default(0),
        })
        .optional(),
      quiz_debut: quiz.optional(),
      contenu: z
        .array(
          z.object({
            titre: z.string(),
            /** Texte en Markdown. */
            texte: z.string().optional(),
            /** Fichier HTML du dossier htmls/, ex. htmls/grille.html */
            html: z.string().optional(),
            image: image().optional(),
            legende: z.string().optional(),
            /** Lien (YouTube, PeerTube, .mp4…) ou fichier local videos/xxx.mp4 */
            video: z.string().optional(),
            /** Fichier local sons/xxx.mp3 ou lien */
            son: z.string().optional(),
          }),
        )
        .min(1),
      quiz_fin: quiz.optional(),
    }),
});

/* ------------------------------------------------------------------ */
/*  Journal : un fichier Markdown par numéro                           */
/* ------------------------------------------------------------------ */
const journal = defineCollection({
  loader: glob({ base: './contenu/journal', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      titre: z.string(),
      numero: z.number().int().positive(),
      date: z.coerce.date(),
      sujets: z.array(z.string()).default([]),
      resume: z.string(),
      auteur: z.string().optional(),
      couverture: image().optional(),
      /** Couleur de la couverture générée quand il n'y a pas d'image. */
      couleur: z.string().optional(),
    }),
});

/* ------------------------------------------------------------------ */
/*  Ressources : un fichier YAML par catégorie                         */
/* ------------------------------------------------------------------ */
const ressources = defineCollection({
  loader: glob({ base: './contenu/ressources', pattern: '*.{yaml,yml}' }),
  schema: z.object({
    titre: z.string(),
    /** Sert au filtre de la barre latérale (graphisme, vidéo, stockage…). */
    type: z.string(),
    description: z.string(),
    icone: z.string().default('📁'),
    ordre: z.number().default(100),
    liens: z
      .array(
        z.object({
          nom: z.string(),
          url: z.string().url(),
          description: z.string().optional(),
          libre: z.boolean().default(false),
          plateformes: z.array(z.string()).default([]),
        }),
      )
      .default([]),
  }),
});

export const collections = { formations, journal, ressources };
