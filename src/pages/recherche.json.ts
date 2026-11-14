import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { NIVEAUX, toutesLesFormations } from '../lib/formations';

/** Index de recherche généré au build, lu par la barre de recherche. */
export const GET: APIRoute = async () => {
  const formations = await toutesLesFormations();
  const journal = await getCollection('journal');
  const ressources = await getCollection('ressources');

  const index = [
    ...formations.map((f) => ({
      type: 'Formation',
      titre: f.data.nom,
      url: `/formations/${f.id}/`,
      texte: [f.data.resume, NIVEAUX[f.data.niveau], ...f.data.themes, ...f.data.contenu.map((s) => s.titre)].join(' '),
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
