# Loja Dummy

> **Aplicação no ar:** https://wiudev.github.io/dummy/

[![CI](https://github.com/WiuDev/dummy/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/WiuDev/dummy/actions/workflows/ci.yml)
[![Deploy](https://github.com/WiuDev/dummy/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/WiuDev/dummy/actions/workflows/deploy.yml)

Catálogo e compras em React + TypeScript que consome a API pública [DummyJSON](https://dummyjson.com). Tem uma área pública de navegação e uma área administrativa protegida por login.

> Projeto em desenvolvimento. Fase atual: **2 (núcleo de dados)**: a camada de dados (HTTP, validação, sessão e hooks) está pronta e testada, mas a aplicação publicada ainda mostra uma página "Em construção".

## Sumário

1. [Tema e visão geral](#tema-e-visão-geral)
2. [Funcionalidades](#funcionalidades)
3. [Stack](#stack)
4. [Como executar localmente](#como-executar-localmente)
5. [Scripts](#scripts)
6. [Arquitetura](#arquitetura)
7. [Decisões e limitações da API](#decisões-e-limitações-da-api)
8. [Checklist dos 10 requisitos](#checklist-dos-10-requisitos)
9. [Testes](#testes)
10. [CI/CD, deploy e proteção da main](#cicd-deploy-e-proteção-da-main)
11. [Convenções](#convenções)
12. [Uso de IA](#uso-de-ia)
13. [Créditos](#créditos)

## Tema e visão geral

Tema escolhido: **catálogo e compras**, com os recursos `/products`, `/auth` e `/carts` da DummyJSON.

- **Área pública:** catálogo com busca, filtro por categoria e paginação; detalhes do produto; carrinho salvo no navegador.
- **Área administrativa:** login via `POST /auth/login` e gestão de produtos (listagem paginada, cadastro, edição e exclusão).

## Funcionalidades

| Área    | Rota            | Funcionalidade                                                                                | Status   |
| ------- | --------------- | --------------------------------------------------------------------------------------------- | -------- |
| Pública | `/produtos`     | Grid responsivo com busca (debounce), filtro por categoria e paginação, tudo refletido na URL | pendente |
| Pública | `/produtos/:id` | Imagens, preço e desconto, avaliação, estoque, avaliações de clientes e adicionar ao carrinho | pendente |
| Pública | `/carrinho`     | Quantidades, remoção, totais e persistência; "Finalizar compra" exige login                   | pendente |
| Pública | `/login`        | Autenticação com retorno à página de origem                                                   | pendente |
| Admin   | `/admin`        | Tabela paginada com busca, cadastro, edição e exclusão de produtos                            | pendente |

Credenciais de teste da DummyJSON: `emilys` / `emilyspass` (há outras em https://dummyjson.com/users).

## Stack

React 19 · TypeScript 6 (estrito) · Vite 8 · Mantine 9 + CSS Modules · React Router 7 · Axios + Zod · Context API · Vitest + React Testing Library + MSW · Playwright · GitHub Actions + GitHub Pages.

As versões exatas, a política de versões e as regras do projeto estão em [AGENTS.md](AGENTS.md).

## Como executar localmente

Pré-requisitos:

- **Node.js 22.19.0**, a versão do `.nvmrc`. Exemplo com nvm: `nvm install 22.19.0` e depois `nvm use 22.19.0`.
- **Yarn Classic 1.22.22**, por exemplo com `corepack enable`, que usa a versão do campo `packageManager`.

O Yarn recusa a instalação se as versões de Node ou Yarn não atenderem ao campo `engines` do `package.json`.

```bash
git clone https://github.com/WiuDev/dummy.git
cd dummy
yarn install --frozen-lockfile
yarn dev
```

Depois acesse http://localhost:5173/dummy/. A aplicação é servida sob `/dummy/`, o mesmo caminho do GitHub Pages.

Para os testes E2E, instale uma vez o Chromium do Playwright (vai para o cache do usuário, fora do projeto):

```bash
yarn playwright install chromium
```

## Scripts

| Comando                             | O que faz                                                                   |
| ----------------------------------- | --------------------------------------------------------------------------- |
| `yarn dev`                          | Servidor de desenvolvimento em http://localhost:5173/dummy/                 |
| `yarn build`                        | Checagem de tipos (`tsc -b`) + build de produção (gera também o 404.html)   |
| `yarn preview`                      | Serve o build em http://localhost:4173/dummy/                               |
| `yarn typecheck`                    | Checagem de tipos                                                           |
| `yarn lint` / `yarn lint:fix`       | Oxlint com regras type-aware (warnings também falham)                       |
| `yarn format` / `yarn format:check` | Prettier                                                                    |
| `yarn test` / `yarn test:watch`     | Testes unitários e de componentes (Vitest)                                  |
| `yarn test:coverage`                | Testes unitários com cobertura e thresholds (relatório em `coverage/`)      |
| `yarn test:e2e`                     | Testes E2E (Playwright, headless) contra o build de produção                |
| `yarn verify`                       | lint + format:check + typecheck + testes com cobertura + build + testes E2E |

## Arquitetura

Organização em camadas (`app`, `layouts`, `routes`, `features`, `components`, `hooks`, `services`, `schemas`, `lib`), com regras de import validadas pelo lint. O detalhe está em [AGENTS.md](AGENTS.md#arquitetura-e-regras-de-import).

Estado atual:

```text
src/
├─ main.tsx                      # ponto de entrada: StrictMode + BrowserRouter (basename /dummy/)
├─ app/
│  ├─ App.tsx                    # MantineProvider + tema + notificações + rotas
│  ├─ AppRoutes.tsx              # rotas declarativas
│  ├─ HttpErrorNotifier.tsx      # notifica falhas de rede, tempo esgotado, 5xx e 429
│  └─ theme.ts                   # tema do Mantine
├─ hooks/
│  ├─ useAsync.ts                # leitura assíncrona cancelável (abort no cleanup)
│  ├─ useAsyncAction.ts          # mutações com estado explícito
│  └─ useDebouncedValue.ts       # debounce com setTimeout e clearTimeout
├─ lib/
│  ├─ errors.ts                  # AppError e mensagens em pt-BR
│  ├─ events.ts                  # canais de eventos tipados
│  ├─ storage.ts                 # localStorage versionado e validado com Zod
│  ├─ jwt.ts                     # leitura do payload do JWT
│  └─ auth-session.ts            # sessão de autenticação (dummy:auth:v1)
├─ routes/
│  └─ UnderConstructionPage.tsx  # página temporária (sai na Fase 3)
├─ schemas/                      # schemas Zod do contrato (produtos, auth, carrinho, erro)
├─ services/
│  ├─ api.ts                     # instância do Axios e interceptors
│  ├─ http-error.ts              # toAppError: falha HTTP → AppError
│  ├─ http-events.ts             # eventos de falha global e de sessão
│  ├─ parse-response.ts          # validação das respostas com Zod
│  └─ *.service.ts               # produtos, autenticação e carrinho
└─ test/
   ├─ setup.ts                   # setup do Vitest (jest-dom, MSW, polyfills do Mantine)
   ├─ render.tsx                 # renderWithProviders
   ├─ msw/                       # servidor, handlers padrão e registro de requisições
   └─ fixtures/                  # respostas da API capturadas e enxutas
e2e/
└─ smoke.spec.ts                 # smoke do Playwright (também roda em produção)
```

## Decisões e limitações da API

- A DummyJSON **simula** as escritas (POST, PUT, PATCH e DELETE) e não persiste nada. No admin, as alterações valerão só na sessão e serão sinalizadas como simuladas.
- A API não combina a busca textual com o filtro por categoria; com os dois ativos, a combinação será feita no cliente.
- O token (`accessToken`) expira em 60 minutos por padrão e não haverá refresh token; ao expirar, a sessão é encerrada.
- O carrinho da API descarta sem aviso os produtos que ela não conhece; o checkout confere a quantidade de itens aceitos e falha com uma mensagem amigável se ela divergir.
- Os preços vêm em dólar (USD) e serão exibidos no formato pt-BR.

## Checklist dos 10 requisitos

| #   | Requisito                                             | Status    | Como foi resolvido                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | ----------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Estrutura de componentes e tipagem com TypeScript     | parcial   | Projeto criado com Vite (template react-ts) e TypeScript estrito; componentes de domínio a partir da Fase 3.                                                                                                                                                                                                                                                                                                                   |
| 2   | Estado reativo, imutabilidade e ciclo de vida         | parcial   | Hooks com cleanup no ciclo de vida: `useAsync` aborta a requisição com `AbortController` e descarta respostas atrasadas, e `useDebouncedValue` cancela o timer (`src/hooks/`). Estado e imutabilidade nas telas a partir da Fase 3.                                                                                                                                                                                            |
| 3   | Estado global com Context API e Custom Hooks          | pendente  | —                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 4   | Roteamento e layouts com React Router                 | parcial   | Rotas declarativas (`src/app/AppRoutes.tsx`) com `BrowserRouter` e `basename` (`src/main.tsx`); layouts, `NavLink`, `useNavigate` e `useParams` nas próximas fases.                                                                                                                                                                                                                                                            |
| 5   | Interface gráfica e formulários com Mantine UI        | parcial   | `MantineProvider` com tema e notificações (`src/app/App.tsx`, `src/app/theme.ts`); layouts responsivos, formulários e tabelas nas próximas fases.                                                                                                                                                                                                                                                                              |
| 6   | Fluxo de autenticação JWT e rotas protegidas          | parcial   | Sessão salva e validada com Zod, com expiração lida do `exp` do JWT (`src/lib/auth-session.ts`); o interceptor envia o Bearer nas rotas `/auth/*` e trata sessão ausente, sessão expirada e 401 (`src/services/api.ts`). Tela de login e bloqueio de rotas na Fase 5.                                                                                                                                                          |
| 7   | Consumo de API REST, interceptors e validação com Zod | parcial   | Instância do Axios com `baseURL`, timeout e interceptors de request (Bearer) e de response (`AppError`), em `src/services/api.ts`; toda resposta validada com Zod (`src/services/parse-response.ts`, `src/schemas/`); falhas de rede, tempo esgotado, 5xx e 429 viram notificação global (`src/app/HttpErrorNotifier.tsx`). Falta a validação dos formulários com Zod (Fases 5 e 6).                                           |
| 8   | Testes automatizados com Vitest e RTL                 | parcial   | Vitest + jsdom + React Testing Library + jest-dom, com HTTP simulado pelo MSW (`src/test/msw/`) e `renderWithProviders` (`src/test/render.tsx`); testes de contrato dos schemas com fixtures da API e testes de services, hooks e componentes; cobertura com thresholds (`vitest.config.ts`) no `yarn verify` e no CI.                                                                                                         |
| 9   | Testes ponta a ponta com Playwright                   | parcial   | Playwright headless contra o build de produção (`playwright.config.ts`), com smoke de home, deep link e 404.html (`e2e/smoke.spec.ts`); os fluxos completos vêm com as funcionalidades.                                                                                                                                                                                                                                        |
| 10  | Pipeline de CI/CD e deploy em produção                | concluído | CI (`.github/workflows/ci.yml`), deploy no GitHub Pages com smoke pós-deploy que espera a versão publicada (`.github/workflows/deploy.yml`), `base`, 404.html e meta `app-version` (`vite.config.ts`) e validação do título do PR (`.github/workflows/pr-title.yml`). Ruleset da `main` (configuração no GitHub): PR obrigatório, checks `verify`, `e2e` e `pr-title`, merge só por squash e exclusão e force push bloqueados. |

## Testes

- **Unitários e de componentes:** Vitest 5 com jsdom, React Testing Library e jest-dom. Os testes ficam ao lado do código (`*.test.ts(x)`) e usam consultas acessíveis (`getByRole`, `getByText`). Rode com `yarn test`.
- **HTTP simulado:** o MSW 2 intercepta as requisições do Axios. Os handlers padrão respondem com fixtures capturadas da API (tokens sintéticos, sem dados sensíveis) e uma requisição sem handler falha o teste. Os schemas têm testes de contrato contra essas fixtures.
- **Cobertura:** `yarn test:coverage` (v8) com thresholds de 80/80/80/70 (linhas, statements, funções, branches) no geral e 90/90/90/85 em `lib`, `services`, `hooks` e `schemas`. O relatório HTML fica em `coverage/` e o CI o publica como artefato.
- **Ponta a ponta:** Playwright em modo headless contra o build de produção servido em `/dummy/`. O smoke cobre a home (inclusive a meta `app-version`), um deep link com recarregamento e o 404.html gerado no build. Rode com `yarn test:e2e`.
- Depois de cada deploy, o mesmo smoke roda contra o site publicado, assim que a meta `app-version` mostra o commit do deploy (o CDN do Pages guarda o HTML por até 10 minutos). Lá o deep link responde HTTP 404 (o GitHub Pages serve o 404.html) e a aplicação abre a rota pedida.

## CI/CD, deploy e proteção da main

- **CI** (`.github/workflows/ci.yml`): a cada push e pull request para a `main`. O job `verify` roda instalação com `yarn install --frozen-lockfile`, lint, formatação, typecheck, testes unitários com cobertura (o relatório vira o artefato `coverage`), build e checagem do 404.html. O job `e2e` roda o Playwright. O Node vem do `.nvmrc`.
- **Deploy** (`.github/workflows/deploy.yml`): a cada push na `main`, roda o CI completo, faz o build, publica no GitHub Pages, espera a nova versão ficar no ar e executa o smoke em produção.
- **Título do PR** (`.github/workflows/pr-title.yml`): o job `pr-title` confere se o título do PR, que vira a mensagem do squash, segue o Conventional Commits.
- **Proteção da `main`:** ruleset com pull request obrigatório, os checks `verify`, `e2e` e `pr-title` exigidos antes do merge, merge só por squash e exclusão e force push bloqueados.
- **Dependabot:** atualiza semanalmente as GitHub Actions (fixadas por SHA), respeitando 7 dias de espera após cada versão.

## Convenções

- Conventional Commits, com tipo em inglês e descrição em pt-BR; branches curtas integradas por PR com squash.
- Oxlint (type-aware) para lint, Prettier para formatação e finais de linha LF em todos os arquivos de texto.
- Código (identificadores, arquivos e pastas) em inglês; interface, rotas e documentação em pt-BR.

## Uso de IA

O projeto é desenvolvido com apoio de IA (Claude Code) em etapas com aprovação humana: planejamento, implementação por fases, testes e publicação. Cada fase só começa depois que o plano é aprovado, e cada entrega passa por revisão antes do merge. Esta seção será detalhada ao final, com o que foi gerado, o que foi revisado e ajustado manualmente e os limites encontrados.

## Créditos

- Dados: [DummyJSON](https://dummyjson.com).
