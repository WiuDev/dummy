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

// Grava no <head> a versão do build: o SHA do commit no GitHub Actions e
// "local" fora dele. O smoke pós-deploy espera o site publicado exibir o SHA
// do próprio workflow, para nunca testar a versão anterior.
function appVersionMeta(): Plugin {
  const version = process.env.GITHUB_SHA ?? 'local'

  return {
    name: 'app-version-meta',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { name: 'app-version', content: version },
          injectTo: 'head',
        },
      ]
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/dummy/',
  plugins: [react(), appVersionMeta(), githubPagesSpaFallback()],
  resolve: {
    // Usa o `paths` do tsconfig (alias `@/` → `src/`).
    tsconfigPaths: true,
  },
})
