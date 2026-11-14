import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { NIVEAUX, catalogue } from '../lib/formations';

/** Index de recherche généré au build, lu par la barre de recherche. */
export const GET: APIRoute = async () => {
  const { formations, cours, parcours } = await catalogue();
  const journal = await getCollection('journal');
  const ressources = await getCollection('ressources');

  const index = [
    ...parcours.map((p) => ({
      type: 'Parcours',
      titre: p.data.titre,
      url: p.url,
      texte: p.data.resume,
    })),
    ...formations.map((f) => ({
      type: 'Formation',
      titre: f.data.nom,
      url: f.url,
      texte: [f.data.resume, NIVEAUX[f.data.niveau], ...f.data.themes].join(' '),
    })),
    ...cours.map((c) => ({
      type: `Cours · ${c.formation.data.nom}`,
      titre: c.data.nom,
      url: c.url,
      texte: [c.data.resume, ...c.data.contenu.map((s) => s.titre)].join(' '),
    })),
    ...journal.map((j) => ({
      type: `Journal n°${j.data.numero}`,
      titre: j.data.titre,
      url: `/journal/${j.id}/`,
      texte: [j.data.resume, ...j.data.sujets].join(' '),
    })),
    ...ressources.flatMap((r) => [
      { type: 'Ressources', titre: r.data.titre, url: `/ressources/${r.id}/`, texte: `${r.data.type} ${r.data.description}` },
      ...r.data.liens.map((l) => ({
        type: r.data.titre,
        titre: l.nom,
        url: `/ressources/${r.id}/`,
        texte: l.description ?? '',
      })),
    ]),
  ];

  return new Response(JSON.stringify(index), { headers: { 'Content-Type': 'application/json' } });
};
