import { getCollection, type CollectionEntry } from 'astro:content';
import { marked } from 'marked';

/* ------------------------------------------------------------------ */
/*  Fichiers des dossiers de formation (sons, vidéos, htmls, styles)   */
/*  Les images passent par le schéma (image()) : Astro les optimise.   */
/* ------------------------------------------------------------------ */
// (les options de import.meta.glob doivent être écrites en toutes lettres)
const sons = import.meta.glob<string>('/formations/*/sons/**/*.{mp3,ogg,oga,opus,wav,m4a}', { eager: true, import: 'default', query: '?url' });
const videos = import.meta.glob<string>('/formations/*/videos/**/*.{mp4,webm,ogv}', { eager: true, import: 'default', query: '?url' });
const htmls = import.meta.glob<string>('/formations/*/htmls/**/*.html', { eager: true, import: 'default', query: '?raw' });
const styles = import.meta.glob<string>('/formations/*/styles/**/*.css', { eager: true, import: 'default', query: '?raw' });

const medias: Record<string, string> = { ...sons, ...videos };

const estLien = (s: string) => /^(https?:)?\/\//.test(s) || s.startsWith('/');
const cle = (id: string, chemin: string) => `/formations/${id}/${chemin.replace(/^\.?\//, '')}`;

/** URL publique d'un son ou d'une vidéo locale (ou lien externe tel quel). */
export function media(id: string, chemin?: string): string | undefined {
  if (!chemin) return undefined;
  if (estLien(chemin)) return chemin;
  const url = medias[cle(id, chemin)];
  if (!url) throw new Error(`[formation ${id}] fichier introuvable : ${chemin}`);
  return url;
}

/** Contenu d'un fichier du dossier htmls/. */
export function fragmentHtml(id: string, chemin?: string): string | undefined {
  if (!chemin) return undefined;
  const html = htmls[cle(id, chemin)];
  if (html === undefined) throw new Error(`[formation ${id}] fichier HTML introuvable : ${chemin}`);
  return html;
}

/** Tous les CSS du dossier styles/ d'une formation (écrasent le style du site). */
export function stylesFormation(id: string): string {
  return Object.entries(styles)
    .filter(([chemin]) => chemin.startsWith(`/formations/${id}/styles/`))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, css]) => css)
    .join('\n');
}

export type Video = { type: 'iframe' | 'fichier'; src: string };

export function video(id: string, src?: string): Video | undefined {
  if (!src) return undefined;
  if (!estLien(src)) return { type: 'fichier', src: media(id, src)! };
  const yt = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (yt) return { type: 'iframe', src: `https://www.youtube-nocookie.com/embed/${yt[1]}` };
  if (/\/w\/[\w-]+/.test(src)) return { type: 'iframe', src: src.replace('/w/', '/videos/embed/') }; // PeerTube
  if (/\.(mp4|webm|ogv)(\?|$)/i.test(src)) return { type: 'fichier', src };
  return { type: 'iframe', src };
}

/* ------------------------------------------------------------------ */
/*  Libellés et utilitaires                                            */
/* ------------------------------------------------------------------ */
export const NIVEAUX = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  avance: 'Avancé',
} as const;

export const MODALITES = {
  terrain: { court: 'Avec terrain', long: 'Doit absolument être accompagnée d’une formation de terrain' },
  support: { court: 'Support physique', long: 'Support d’une formation physique' },
  maison: { court: 'À la maison', long: 'Peut entièrement être faite à la maison' },
} as const;

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

/* ------------------------------------------------------------------ */
/*  Chargement et vérification des formations                          */
/* ------------------------------------------------------------------ */
export async function toutesLesFormations() {
  const liste = await getCollection('formations');
  const ids = new Set(liste.map((f) => f.id));
  for (const f of liste) {
    for (const dep of f.data.dependances) {
      if (!ids.has(dep)) throw new Error(`[formation ${f.id}] dépendance inconnue : « ${dep} »`);
    }
  }
  return liste.sort((a, b) => a.data.nom.localeCompare(b.data.nom, 'fr'));
}

export const scorePopularite = (f: CollectionEntry<'formations'>) =>
  f.data.popularite ? f.data.popularite.suivis * (f.data.popularite.note / 5) : 0;

/** Nombre de jours pendant lesquels une formation est considérée « nouvelle ». */
export const JOURS_NOUVEAUTE = 45;

export const estNouvelle = (f: CollectionEntry<'formations'>, maintenant = new Date()) =>
  !!f.data.date_ajout && maintenant.getTime() - f.data.date_ajout.getTime() < JOURS_NOUVEAUTE * 864e5;
