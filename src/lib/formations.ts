import { getCollection, type CollectionEntry } from 'astro:content';
import { marked } from 'marked';

/* ================================================================== */
/*  Fichiers des dossiers (sons, vidéos, htmls, styles)                */
/*  Les images passent par le schéma (image()) : Astro les optimise.   */
/*  (les options de import.meta.glob doivent être écrites en entier)   */
/* ================================================================== */
const sons = import.meta.glob<string>('/formations/*/cours/*/sons/**/*.{mp3,ogg,oga,opus,wav,m4a}', { eager: true, import: 'default', query: '?url' });
const videos = import.meta.glob<string>('/formations/*/cours/*/videos/**/*.{mp4,webm,ogv}', { eager: true, import: 'default', query: '?url' });
const htmls = import.meta.glob<string>('/formations/*/cours/*/htmls/**/*.html', { eager: true, import: 'default', query: '?raw' });
const styles = import.meta.glob<string>('/formations/**/styles/**/*.css', { eager: true, import: 'default', query: '?raw' });

const medias: Record<string, string> = { ...sons, ...videos };

const estLien = (s: string) => /^(https?:)?\/\//.test(s) || s.startsWith('/');

/** Dossier d'une formation (« syndicalisme ») ou d'un cours (« syndicalisme/prise-de-parole »). */
const dossier = (id: string) => {
  const [formation, cours] = id.split('/');
  return cours ? `/formations/${formation}/cours/${cours}/` : `/formations/${formation}/`;
};
const cle = (id: string, chemin: string) => dossier(id) + chemin.replace(/^\.?\//, '');

/** URL publique d'un son ou d'une vidéo locale d'un cours (ou lien externe tel quel). */
export function media(coursId: string, chemin?: string): string | undefined {
  if (!chemin) return undefined;
  if (estLien(chemin)) return chemin;
  const url = medias[cle(coursId, chemin)];
  if (!url) throw new Error(`[cours ${coursId}] fichier introuvable : ${chemin}`);
  return url;
}

/** Contenu d'un fichier du dossier htmls/ d'un cours. */
export function fragmentHtml(coursId: string, chemin?: string): string | undefined {
  if (!chemin) return undefined;
  const html = htmls[cle(coursId, chemin)];
  if (html === undefined) throw new Error(`[cours ${coursId}] fichier HTML introuvable : ${chemin}`);
  return html;
}

/** CSS du dossier styles/ d'une formation ou d'un cours (écrase le style du site). */
export function stylesDe(id: string): string {
  const prefixe = dossier(id) + 'styles/';
  return Object.entries(styles)
    .filter(([chemin]) => chemin.startsWith(prefixe))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, css]) => css)
    .join('\n');
}

export type Video = { type: 'iframe' | 'fichier'; src: string };

export function video(coursId: string, src?: string): Video | undefined {
  if (!src) return undefined;
  if (!estLien(src)) return { type: 'fichier', src: media(coursId, src)! };
  const yt = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (yt) return { type: 'iframe', src: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
  if (/\/w\/[\w-]+/.test(src)) return { type: 'iframe', src: src.replace('/w/', '/videos/embed/') }; // PeerTube
  if (/\.(mp4|webm|ogv)(\?|$)/i.test(src)) return { type: 'fichier', src };
  return { type: 'iframe', src };
}

/* ================================================================== */
/*  Libellés et utilitaires                                            */
/* ================================================================== */
export const NIVEAUX = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
} as const;
export type Niveau = keyof typeof NIVEAUX;

export const MODALITES = {
  terrain: { court: 'Avec terrain', long: 'Doit absolument être accompagné d’une formation de terrain' },
  support: { court: 'Support physique', long: 'Support d’une formation physique' },
  maison: { court: 'À la maison', long: 'Peut entièrement être fait à la maison' },
} as const;
export type Modalite = keyof typeof MODALITES;

/** De la plus exigeante à la moins exigeante. */
const ORDRE_MODALITES: Modalite[] = ['terrain', 'support', 'maison'];

export function formatDuree(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
}

export const formatJours = (j: number) => `${j} jour${j > 1 ? 's' : ''}`;

export const markdown = (texte?: string) => (texte ? (marked.parse(texte, { async: false }) as string) : '');

/** Transforme « Prise de parole » en « prise-de-parole » (pour les filtres). */
export const slugifier = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const formatDate = (d: Date) =>
  d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

/* ================================================================== */
/*  Catalogue : formations, cours et parcours reliés entre eux         */
/* ================================================================== */
export type Temps = { lecture: number; pratique: number; maitrise: number };

export interface Cours {
  id: string; // « formation/cours »
  slug: string; // « cours »
  url: string;
  data: CollectionEntry<'cours'>['data'];
  niveau: Niveau;
  formation: Formation;
  dependances: Cours[];
  /** Position dans la formation (1, 2, 3…). */
  numero: number;
  precedent?: Cours;
  suivant?: Cours;
}

export interface Formation {
  id: string;
  url: string;
  data: CollectionEntry<'formations'>['data'];
  cours: Cours[];
  dependances: Formation[];
  temps: Temps;
  /** Modalité la plus exigeante parmi ses cours. */
  modalite?: Modalite;
}

export type Etape =
  | { type: 'formation'; formation: Formation; note?: string }
  | { type: 'cours'; cours: Cours; note?: string };

export interface Parcours {
  id: string;
  url: string;
  data: CollectionEntry<'parcours'>['data'];
  etapes: Etape[];
  temps: Temps;
  nbCours: number;
}

export interface Catalogue {
  formations: Formation[];
  cours: Cours[];
  parcours: Parcours[];
}

const somme = (liste: Temps[]): Temps =>
  liste.reduce(
    (t, x) => ({ lecture: t.lecture + x.lecture, pratique: t.pratique + x.pratique, maitrise: t.maitrise + x.maitrise }),
    { lecture: 0, pratique: 0, maitrise: 0 },
  );

/** « mon-cours » (même formation) ou « formation/cours » → identifiant complet. */
export const resoudreCours = (ref: string, formationId: string) => (ref.includes('/') ? ref : `${formationId}/${ref}`);

let cache: Promise<Catalogue> | undefined;

/** Charge tout le contenu pédagogique et vérifie les liens entre éléments. */
export function catalogue(): Promise<Catalogue> {
  if (import.meta.env.DEV) return construire(); // en dev : toujours relire (contenu modifié)
  return (cache ??= construire());
}

async function construire(): Promise<Catalogue> {
  const [entreesF, entreesC, entreesP] = await Promise.all([
    getCollection('formations'),
    getCollection('cours'),
    getCollection('parcours'),
  ]);
  const erreur = (msg: string) => {
    throw new Error(msg);
  };

  // 1. Formations (sans leurs cours pour l'instant)
  const formations = new Map<string, Formation>();
  for (const f of entreesF) {
    formations.set(f.id, {
      id: f.id,
      url: `/formations/${f.id}/`,
      data: f.data,
      cours: [],
      dependances: [],
      temps: { lecture: 0, pratique: 0, maitrise: 0 },
    });
  }

  // 2. Cours, rattachés à leur formation
  const cours = new Map<string, Cours>();
  for (const c of entreesC) {
    const [formationId, slug] = c.id.split('/');
    const formation =
      formations.get(formationId) ??
      erreur(`[cours ${c.id}] le dossier formations/${formationId}/ n'a pas de fichier formation.yaml`);
    const unCours: Cours = {
      id: c.id,
      slug,
      url: `/formations/${formationId}/${slug}/`,
      data: c.data,
      niveau: c.data.niveau ?? formation.data.niveau,
      formation,
      dependances: [],
      numero: 0,
    };
    cours.set(c.id, unCours);
    formation.cours.push(unCours);
  }

  // 3. Ordre des cours, temps et modalité de chaque formation
  for (const f of formations.values()) {
    const ordre = f.data.cours;
    if (ordre) {
      for (const slug of ordre) {
        if (!f.cours.some((c) => c.slug === slug))
          erreur(`[formation ${f.id}] cours inconnu dans « cours: » : ${slug} (dossier cours/${slug}/cours.yaml ?)`);
      }
    }
    const rang = (c: Cours) => {
      const i = ordre?.indexOf(c.slug) ?? -1;
      return i === -1 ? Infinity : i;
    };
    f.cours.sort((a, b) => rang(a) - rang(b) || a.slug.localeCompare(b.slug));
    f.cours.forEach((c, i) => {
      c.numero = i + 1;
      c.precedent = f.cours[i - 1];
      c.suivant = f.cours[i + 1];
    });
    f.temps = somme(f.cours.map((c) => c.data.temps));
    f.modalite = ORDRE_MODALITES.find((m) => f.cours.some((c) => c.data.modalite === m));
    f.dependances = f.data.dependances.map(
      (d) => formations.get(d) ?? erreur(`[formation ${f.id}] formation prérequise inconnue : ${d}`),
    );
  }

  // 4. Prérequis des cours (et questions de quiz qui les évaluent)
  for (const c of cours.values()) {
    const trouver = (ref: string, ou: string) =>
      cours.get(resoudreCours(ref, c.formation.id)) ?? erreur(`[cours ${c.id}] ${ou} : cours inconnu « ${ref} »`);
    c.dependances = c.data.dependances.map((d) => trouver(d, 'dépendance'));
    for (const q of [...(c.data.quiz_debut?.questions ?? []), ...(c.data.quiz_fin?.questions ?? [])]) {
      if (q.dependance) trouver(q.dependance, 'question de quiz');
    }
  }

  // 5. Parcours
  const parcours: Parcours[] = entreesP
    .map((p) => {
      const etapes: Etape[] = p.data.etapes.map((e) =>
        'formation' in e
          ? {
              type: 'formation' as const,
              note: e.note,
              formation: formations.get(e.formation) ?? erreur(`[parcours ${p.id}] formation inconnue : ${e.formation}`),
            }
          : {
              type: 'cours' as const,
              note: e.note,
              cours:
                cours.get(e.cours) ??
                erreur(`[parcours ${p.id}] cours inconnu : ${e.cours} (écrire « formation/cours »)`),
            },
      );
      const tousLesCours = etapes.flatMap((e) => (e.type === 'formation' ? e.formation.cours : [e.cours]));
      return {
        id: p.id,
        url: `/parcours/${p.id}/`,
        data: p.data,
        etapes,
        temps: somme(tousLesCours.map((c) => c.data.temps)),
        nbCours: tousLesCours.length,
      };
    })
    .sort((a, b) => a.data.ordre - b.data.ordre || a.data.titre.localeCompare(b.data.titre, 'fr'));

  return {
    formations: [...formations.values()].sort((a, b) => a.data.nom.localeCompare(b.data.nom, 'fr')),
    cours: [...cours.values()],
    parcours,
  };
}

/** Parcours qui contiennent une formation ou un cours donné. */
export const parcoursContenant = (tous: Parcours[], id: string) =>
  tous.filter((p) =>
    p.etapes.some((e) => (e.type === 'formation' ? e.formation.id === id : e.cours.id === id || e.cours.formation.id === id)),
  );

export const scorePopularite = (f: Formation) =>
  f.data.popularite ? f.data.popularite.suivis * (f.data.popularite.note / 5) : 0;

/** Nombre de jours pendant lesquels une formation est considérée « nouvelle ». */
export const JOURS_NOUVEAUTE = 45;

export const estNouvelle = (f: Formation, maintenant = new Date()) =>
  !!f.data.date_ajout && maintenant.getTime() - f.data.date_ajout.getTime() < JOURS_NOUVEAUTE * 864e5;
