import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'foro/publicacion/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => {
      // Replace with actual logic to fetch post IDs
      return [
        { id: '1' },
        { id: '2' }
      ];
    }
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];