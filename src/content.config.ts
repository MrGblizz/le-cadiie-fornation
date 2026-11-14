import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/*
  Organisation :
    Parcours  (contenu/parcours/*.yaml)      regroupe des formations et/ou des cours
    Formation (formations/<f>/formation.yaml) regroupe plusieurs cours
    Cours     (formations/<f>/cours/<c>/cours.yaml) contenu + quiz
*/

/* ------------------------------------------------------------------ */
/*  Quiz (début et fin de cours)                                       */
/* ------------------------------------------------------------------ */
const question = z.object({
  question: z.string(),
  choix: z.array(z.string()).min(2),
  /** Index (à partir de 0) de la bonne réponse, ou liste d'index si plusieurs. */
  reponse: z.union([z.number().int(), z.array(z.number().int()).min(1)]),
  explication: z.string().optional(),
  /** Cours prérequis évalué par la question (ex. « mon-cours » ou « autre-formation/son-cours »). */
  dependance: z.string().optional(),
});

const quiz = z.object({
  /** Pourcentage de bonnes réponses nécessaire pour valider. */
  seuil: z.number().min(0).max(100).default(70),
  questions: z.array(question).min(1),
});

const niveau = z.enum(['debutant', 'intermediaire', 'avance']);

/* ------------------------------------------------------------------ */
/*  Formations : formations/<formation>/formation.yaml                 */
/* ------------------------------------------------------------------ */
const formations = defineCollection({
  loader: glob({
    base: './formations',
    pattern: '*/formation.{yaml,yml}',
    // identifiant = nom du dossier
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: ({ image }) =>
    z.object({
      nom: z.string(),
      resume: z.string(),
      image: image().optional(),
      niveau,
      themes: z.array(z.string()).default([]),
      /** Formations (noms de dossier) à suivre avant celle-ci. */
      dependances: z.array(z.string()).default([]),
      /** Ordre des cours (noms des dossiers dans cours/). Par défaut : ordre alphabétique. */
      cours: z.array(z.string()).optional(),
      date_ajout: z.coerce.date().optional(),
      /** Saisi à la main pour l'instant (pas de base de données). */
      popularite: z
        .object({
          suivis: z.number().int().nonnegative().default(0),
          note: z.number().min(0).max(5).default(0),
        })
        .optional(),
    }),
});

/* ------------------------------------------------------------------ */
/*  Cours : formations/<formation>/cours/<cours>/cours.yaml            */
/* ------------------------------------------------------------------ */
const cours = defineCollection({
  loader: glob({
    base: './formations',
    pattern: '*/cours/*/cours.{yaml,yml}',
    // identifiant = « formation/cours »
    generateId: ({ entry }) => {
      const [formation, , dossier] = entry.split('/');
      return `${formation}/${dossier}`;
    },
  }),
  schema: ({ image }) =>
    z.object({
      nom: z.string(),
      resume: z.string(),
      image: image().optional(),
      /** Par défaut : le niveau de la formation. */
      niveau: niveau.optional(),
      /** Cours à faire avant (« cours » de la même formation ou « formation/cours »). */
      dependances: z.array(z.string()).default([]),
      temps: z.object({
        /** Minutes pour simplement le lire. */
        lecture: z.number().positive(),
        /** Minutes pour le faire en le lisant (exercices compris). */
        pratique: z.number().positive(),
        /** Jours de pratique pour le maîtriser complètement. */
        maitrise: z.number().positive(),
      }),
      /**
       * terrain : doit absolument être accompagné d'une formation de terrain
       * support : est un support de formation physique
       * maison  : peut entièrement être fait à la maison
       */
      modalite: z.enum(['terrain', 'support', 'maison']),
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
/*  Parcours : contenu/parcours/*.yaml                                 */
/* ------------------------------------------------------------------ */
const parcours = defineCollection({
  loader: glob({ base: './contenu/parcours', pattern: '*.{yaml,yml}' }),
  schema: ({ image }) =>
    z.object({
      titre: z.string(),
      resume: z.string(),
      image: image().optional(),
      couleur: z.string().optional(),
      ordre: z.number().default(100),
      /** Étapes dans l'ordre : une formation entière ou un cours seul. */
      etapes: z
        .array(
          z.union([
            z.object({ formation: z.string(), note: z.string().optional() }),
            z.object({ cours: z.string(), note: z.string().optional() }),
          ]),
        )
        .min(1),
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

export const collections = { formations, cours, parcours, journal, ressources };
