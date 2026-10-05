import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// O GitHub Pages responde com o 404.html a qualquer caminho que não existe.
// Como ele é uma cópia do index.html, deep links (ex.: /dummy/produtos/1)
// carregam a SPA, e o React Router resolve a rota.
function githubPagesSpaFallback(): Plugin {
  return {
    name: 'github-pages-spa-fallback',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const indexHtml = bundle['index.html']

      if (indexHtml?.type !== 'asset') {
        throw new Error(
          'index.html não encontrado no bundle; não foi possível gerar o 404.html.',
        )
      }

      this.emitFile({
        type: 'asset',
        fileName: '404.html',
        source: indexHtml.source,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/dummy/',
  plugins: [react(), githubPagesSpaFallback()],
  resolve: {
    // Usa o `paths` do tsconfig (alias `@/` → `src/`).
    tsconfigPaths: true,
  },
})
