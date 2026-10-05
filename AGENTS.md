# AGENTS.md

Referência persistente para quem trabalha neste repositório, seja pessoa ou agente de IA. Quando uma decisão nova for aprovada, atualize este arquivo no mesmo PR.

## Projeto

- **Loja Dummy**: SPA de catálogo e compras em React + TypeScript sobre a API pública [DummyJSON](https://dummyjson.com).
- Área pública: `/produtos`, `/produtos/:id`, `/carrinho` e `/login`. Área administrativa protegida: `/admin` (gestão de produtos).
- Repositório: https://github.com/WiuDev/dummy · Deploy (GitHub Pages): https://wiudev.github.io/dummy/
- A checklist dos 10 requisitos técnicos, com o status de cada um, fica no `README.md`.

## Fluxo de trabalho

- Etapas: auditoria (quando já houver código) → planejamento → implementação → testes → publicação.
- **Nenhum código sem plano aprovado.** Implemente só a fase aprovada, sem antecipar dependências ou arquivos de outras fases.
- Se algo divergir do plano (ferramenta que falha, versão incompatível, regra que não fecha), pare e reporte as opções. Não troque ferramenta nem arquitetura por conta própria.
- Não faça push nem abra PR sem autorização explícita da etapa.
- Não crie, altere nem dependa de arquivos fora do repositório.
- Fases: 0 Fundação · 1 CI + deploy esqueleto · 2 Núcleo de dados · 3 Layout + catálogo · 4 Carrinho · 5 Autenticação + checkout · 6 Admin · 7 Polimento e entrega.

## Stack e versões-chave

| Área      | Pacotes                                                                                  | Versões                                   | Situação                              |
| --------- | ---------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------- |
| Runtime   | Node.js · Yarn Classic                                                                   | 22.19.0 · 1.22.22                         | `.nvmrc`, `engines`, `packageManager` |
| Base      | react + react-dom · typescript · vite · @vitejs/plugin-react                             | 19.3.0 · 6.0.3 · 8.3.1 · 6.1.1            | instalados                            |
| Qualidade | oxlint · oxlint-tsgolint · prettier                                                      | 1.86.0 · 7.0.2003 · 3.9.9                 | instalados                            |
| UI        | @mantine/core, hooks, form, notifications · @tabler/icons-react · postcss-preset-mantine | 9.6.3 · 3.48.0 · 1.18.0                   | planejados (Fase 1+)                  |
| Rotas     | react-router (modo declarativo)                                                          | 7.18.4                                    | planejado (Fase 1)                    |
| Dados     | axios · zod                                                                              | 1.20.0 · 4.6.5                            | planejados (Fase 2)                   |
| Testes    | vitest + @vitest/coverage-v8 · jsdom · @testing-library/\* · msw · @playwright/test      | 5.0.2 · 29.1.1 · 16.3.3 · 2.15.0 · 1.63.0 | planejados (Fase 1+)                  |

As versões planejadas são alvos: confirme a data de publicação (A1) e o `engines` no momento da instalação.

## Política de versões

- **A1**: não adote versão publicada há menos de 7 dias, exceto correção de segurança. Registre a data de publicação de toda versão instalada. A regra vale para as versões escolhidas (dependências diretas); dependências transitivas com menos de 7 dias são listadas no relatório da fase.
- Antes de instalar, confira `yarn info <pacote>@<versão> engines` contra o Node 22.19.0. O Yarn 1 recusa `engines` incompatível em qualquer ponto da árvore, inclusive na raiz.
- Versões exatas para oxlint, oxlint-tsgolint, prettier, vite e @vitejs/plugin-react; `@types/node` em `~22.19.x`, nunca acima da minor do runtime.
- Todos os pacotes `@mantine/*` sempre na mesma versão.
- O Yarn 1 não instala peer dependencies: declare-as explicitamente.
- Toda dependência fora da stack exigida precisa de justificativa no PR e nesta tabela.

## Proibições

- npm ou pnpm. Só Yarn 1, com `yarn.lock` versionado e `yarn install --frozen-lockfile` no CI.
- TanStack Query, SWR, Redux, Zustand, Tailwind, styled-components e Emotion.
- `any` explícito ou implícito, `@ts-ignore`/`@ts-nocheck` e non-null assertion (`!`).
- Desligar regra de lint sem justificativa no código e no PR.
- Chamada HTTP ou `axios` fora de `src/services`; componentes (inclusive páginas) importando services.
- Commits direto na `main`.

## Arquitetura e regras de import

O conjunto de pastas de `src/` é fechado: criar uma nova pasta de topo exige atualizar esta seção e o `.oxlintrc.json`.

| Camada                | Papel                                                                                | Pode importar                                                                                          | Não pode importar                                                                         |
| --------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `app/`                | Composição: providers, rotas, tema, `HttpErrorNotifier`                              | todas as camadas, features só pelo `index.ts`                                                          | `axios`, `@/test`, internos de features                                                   |
| `layouts/`, `routes/` | AppShell, navegação persistente e guards                                             | components, hooks, lib, schemas, features pelo `index.ts`                                              | `@/app`, `@/services`, `axios`, `@/test`, internos de features                            |
| `features/<nome>/`    | Domínio, em `components/`, `pages/`, `hooks/`, `context/` e `index.ts` (API pública) | components, hooks, lib, schemas, outras features pelo `index.ts`; services só em `hooks/` e `context/` | `axios`, `@/app`, `@/layouts`, `@/routes`, `@/test`, internos de outra feature, `../../`  |
| `components/`         | UI apresentacional, com props tipadas e `children`                                   | hooks, lib, schemas, React, Mantine, Tabler                                                            | features, services, app, layouts, routes, `axios`, `@/test`                               |
| `hooks/`              | Hooks genéricos, sem domínio e sem HTTP                                              | lib, schemas, React                                                                                    | features, components, services, app, layouts, routes, `axios`, `@/test`                   |
| `services/`           | HTTP (`api.ts` é a instância do Axios), validação Zod e `toAppError`                 | lib, schemas, `axios`, `zod`                                                                           | React, Mantine, Tabler, features, components, hooks, app, layouts, routes, `@/test`       |
| `schemas/`            | Schemas Zod e tipos via `z.infer`                                                    | `zod` e outros schemas                                                                                 | qualquer outra camada, React, UI, `axios`                                                 |
| `lib/`                | TypeScript puro: `errors.ts` (`AppError`), `paths.ts` (rotas), storage, formatadores | `zod`, schemas e lib                                                                                   | React, UI, `axios`, features, components, hooks, services, app, layouts, routes, `@/test` |
| `test/`               | Utilitários de teste                                                                 | tudo, exceto o que está ao lado                                                                        | `axios` (use MSW), internos de outras features                                            |

- Entre pastas, importe pelo alias `@/`. Imports relativos só dentro da própria pasta (`./`); dentro de uma feature, no máximo `../`. O `index.ts` de uma feature só reexporta `./`.
- **Única exceção explícita:** `src/lib/forms/zodResolver.ts` pode importar `@mantine/form` (A2).
- Arquivos de teste (`*.test.ts(x)` e `src/test/**`) podem importar `@/test`; `axios` e internos de outras features continuam proibidos.
- Tudo isso é imposto por `no-restricted-imports` e `import/no-cycle` no `.oxlintrc.json`.

## Convenções de código

- TypeScript estrito (`strict`, `noImplicitAny`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noImplicitReturns`). `erasableSyntaxOnly` proíbe `enum`/`namespace`: use uniões e `as const`. Com `verbatimModuleSyntax`, use `import type`.
- Dados externos (API, storage, URL, `location.state`) entram como `unknown` e são validados com Zod (`.safeParse`). Tipos de domínio vêm de `z.infer`.
- Componentes funcionais e exports nomeados; `export default` só onde a ferramenta exige (configs).
- Nomes de arquivo:
  - Módulos que exportam um componente, hook ou função principal levam o nome dela (`ProductCard.tsx`, `useCart.ts`, `zodResolver.ts`).
  - Os demais módulos ficam em kebab-case (`http-error.ts`, `products.service.ts`).
  - Estilos e testes ficam ao lado (`ProductCard.module.css`, `ProductCard.test.tsx`).
- Estilos com Mantine e CSS Modules; sem CSS-in-JS.
- Idioma: identificadores, arquivos e pastas em inglês. Interface, rotas, mensagens, comentários e documentação em pt-BR.
- Formatação com Prettier (sem ponto e vírgula, aspas simples, trailing comma, LF). `.gitattributes` e `.editorconfig` garantem LF.
- Moeda: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' })` (A5).

## Commits e branches

- Conventional Commits, com tipo em inglês e descrição em pt-BR. Ex.: `feat(catalogo): adiciona busca com debounce`.
- Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `build`, `ci`, `perf`, `chore`.
- Commits pequenos, um assunto por commit.
- Branches curtas a partir da `main` (`feat/…`, `fix/…`, `chore/…`, `ci/…`, `docs/…`), integradas por PR com squash.

## Scripts de verificação

| Comando                             | O que faz                                                  |
| ----------------------------------- | ---------------------------------------------------------- |
| `yarn dev`                          | Servidor de desenvolvimento                                |
| `yarn build` / `yarn preview`       | `tsc -b` + build de produção / serve o build na porta 4173 |
| `yarn typecheck`                    | `tsc -b`                                                   |
| `yarn lint` / `yarn lint:fix`       | Oxlint com type-aware; warnings também falham              |
| `yarn format` / `yarn format:check` | Prettier                                                   |
| `yarn run check`                    | lint + format:check + typecheck + build                    |

> Atenção: `yarn check` (sem `run`) é um comando interno do Yarn 1, que confere o lockfile, e **não** executa o script `check`.

## Definição de pronto

- `yarn install --frozen-lockfile` e `yarn run check` verdes no Windows e, a partir da Fase 1, no CI em Linux.
- A partir da Fase 1, testes (Vitest e Playwright) verdes e checks obrigatórios do PR aprovados.
- Nenhum `any`, nenhuma regra de lint desligada sem justificativa e nenhum CRLF (`git ls-files --eol`).
- README atualizado: checklist com status e evidência de cada item.
- Toda dependência nova com data de publicação registrada e `engines` compatível com o Node 22.19.0.

## Decisões vigentes

- **D1**: Node 22.19.0 no ambiente local e no CI, com React Router 7.18.4 e jsdom 29.1.1.
- **D2**: Admin e checkout usam as rotas autenticadas `/auth/*` da DummyJSON (Bearer obrigatório).
- **D3**: Oxlint com type-aware (spike aprovado com TypeScript 6.0.3) + Prettier.
- **D4**: `zodResolver` próprio em `src/lib/forms/zodResolver.ts`, sobre o `schemaResolver` nativo do `@mantine/form`.
- **D5**: Overlay de alterações simuladas só na área admin, com aviso explícito ao usuário.
- **D6**: Busca + categoria combinadas no cliente, porque a API não combina os dois filtros.
- **D7**: Sessão em `localStorage` com sincronização entre abas, sem refresh token (60 min).
- **D8**: MSW na linha 2.x (2.15.0).
- **D9**: `exactOptionalPropertyTypes` desligado.
- **D10**: O enunciado do curso não é versionado neste repositório.
- **D11**: Ruleset da `main`: PR obrigatório com 0 aprovações, checks obrigatórios, modo loose, sem bypass.
- **D12**: Ícones aprovados. Dependabot só para GitHub Actions, com cooldown de 7 dias, na Fase 1. axe e lint de título de PR ficam de fora por ora.
- **A1**: Não adotar versão publicada há menos de 7 dias, exceto correção de segurança, e registrar a data de publicação.
- **A2**: `AppError` em `src/lib/errors.ts` (sem axios), `toAppError` em `services` e `HttpErrorNotifier` em `src/app/`. Única exceção de import: zodResolver → `@mantine/form`.
- **A3**: O carrinho pode usar `useReducer`. O overlay do admin usa `useState` com atualizações funcionais e spread (evidência do requisito 2.1 citada no README).
- **A4**: O logout limpa o overlay do admin.
- **A5**: Moeda com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' })`.
- **A6**: Formato do token validado com `z.jwt()` do Zod 4, se existir na versão instalada.
- **A7**: A Fase 0 não tem CI. O pronto dela é a verificação local, e o PR é mesclado sem checks obrigatórios.
