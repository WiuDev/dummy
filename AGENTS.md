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
- Não crie, altere nem dependa de arquivos fora do repositório. Exceções autorizadas: o cache do Yarn e os navegadores do Playwright no cache padrão do usuário (D17).
- Fases: 0 Fundação · 1 CI + deploy esqueleto · 2 Núcleo de dados · 3 Layout + catálogo · 4 Carrinho · 5 Autenticação + checkout · 6 Admin · 7 Polimento e entrega.

## Stack e versões-chave

| Área      | Pacotes                                                                   | Versões                                         | Situação                              |
| --------- | ------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------- |
| Runtime   | Node.js · Yarn Classic                                                    | 22.19.0 · 1.22.22                               | `.nvmrc`, `engines`, `packageManager` |
| Base      | react + react-dom · typescript · vite · @vitejs/plugin-react              | 19.3.0 · 6.0.3 · 8.3.1 · 6.1.1                  | instalados                            |
| Qualidade | oxlint · oxlint-tsgolint · prettier                                       | 1.86.0 · 7.0.2003 · 3.9.9                       | instalados                            |
| UI        | @mantine/core · @mantine/hooks · @mantine/notifications                   | 9.6.3 · 9.6.3 · 9.6.3                           | instalados                            |
| UI        | @mantine/form · @tabler/icons-react · postcss-preset-mantine              | 9.6.3 · 3.48.0 · 1.18.0                         | planejados (D23)                      |
| Rotas     | react-router (modo declarativo)                                           | 7.18.4                                          | instalado                             |
| Dados     | axios · zod                                                               | 1.20.0 · 4.6.5                                  | instalados                            |
| Testes    | vitest · jsdom · @testing-library/react, dom, jest-dom · @playwright/test | 5.0.2 · 29.1.1 · 16.3.3, 10.4.2, 7.0.1 · 1.63.0 | instalados                            |
| Testes    | @vitest/coverage-v8 · msw                                                 | 5.0.2 · 2.15.0                                  | instalados                            |
| Testes    | @testing-library/user-event                                               | 14.6.7                                          | planejado (D23)                       |

As versões planejadas são alvos: confirme a data de publicação (A1) e o `engines` no momento da instalação.

## Política de versões

- **A1**: não adote versão publicada há menos de 7 dias, exceto correção de segurança. Registre a data de publicação de toda versão instalada. A regra vale para as versões escolhidas (dependências diretas); dependências transitivas com menos de 7 dias são listadas no relatório da fase, sem fixação via `resolutions` (D13).
- Antes de instalar, confira `yarn info <pacote>@<versão> engines` contra o Node 22.19.0. O Yarn 1 recusa `engines` incompatível em qualquer ponto da árvore, inclusive na raiz.
- Toda dependência direta entra com versão exata (`yarn add --exact`), e o `yarn.lock` resolve exatamente a versão escolhida (D21). A única faixa é `@types/node` em `~22.19.x`, nunca acima da minor do runtime.
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

| Camada                | Papel                                                                                                       | Pode importar                                                                                          | Não pode importar                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `app/`                | Composição: providers, rotas, tema, `HttpErrorNotifier`                                                     | todas as camadas, features só pelo `index.ts`                                                          | `axios`, `@/test`, internos de features                                                   |
| `layouts/`, `routes/` | AppShell, navegação persistente e guards                                                                    | components, hooks, lib, schemas, features pelo `index.ts`                                              | `@/app`, `@/services`, `axios`, `@/test`, internos de features                            |
| `features/<nome>/`    | Domínio, em `components/`, `pages/`, `hooks/`, `context/` e `index.ts` (API pública)                        | components, hooks, lib, schemas, outras features pelo `index.ts`; services só em `hooks/` e `context/` | `axios`, `@/app`, `@/layouts`, `@/routes`, `@/test`, internos de outra feature, `../../`  |
| `components/`         | UI apresentacional, com props tipadas e `children`                                                          | hooks, lib, schemas, React, Mantine, Tabler                                                            | features, services, app, layouts, routes, `axios`, `@/test`                               |
| `hooks/`              | Hooks genéricos, sem domínio e sem HTTP                                                                     | lib, schemas, React                                                                                    | features, components, services, app, layouts, routes, `axios`, `@/test`                   |
| `services/`           | HTTP (`api.ts` é a instância do Axios), validação Zod, `toAppError` e eventos HTTP                          | lib, schemas, `axios`, `zod`                                                                           | React, Mantine, Tabler, features, components, hooks, app, layouts, routes, `@/test`       |
| `schemas/`            | Schemas Zod e tipos via `z.infer`                                                                           | `zod` e outros schemas                                                                                 | qualquer outra camada, React, UI, `axios`                                                 |
| `lib/`                | TypeScript puro: `errors.ts` (`AppError`), eventos, storage, JWT e sessão, `paths.ts` (rotas), formatadores | `zod`, schemas e lib                                                                                   | React, UI, `axios`, features, components, hooks, services, app, layouts, routes, `@/test` |
| `test/`               | Utilitários de teste: MSW, fixtures, `renderWithProviders`, JWT e sessões de teste                          | tudo, exceto o que está ao lado                                                                        | `axios` (use MSW), internos de outras features                                            |

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

## Testes

- HTTP nos testes só pelo MSW (`src/test/msw`): o servidor roda com `onUnhandledRequest: 'error'`, os handlers padrão cobrem o caminho feliz de cada endpoint com as fixtures e cada teste sobrescreve o que precisar com `server.use(...)`. Para conferir a requisição enviada, use `recordRequests` e `summarizeRequest`.
- Fixtures em `src/test/fixtures`, capturadas da API e enxutas, com tokens sintéticos e sem dados sensíveis fictícios (D26). Sessões de teste em `src/test/session.ts` e JWTs em `src/test/jwt.ts`.
- Fake timers só onde não há rede (debounce, expiração).
- O interceptor XHR do MSW não dispara o `timeout` do jsdom enquanto o handler não responde; o tempo esgotado é testado com um adapter de teste que rejeita como o adapter XHR do axios (`code: 'ETIMEDOUT'`).
- As notificações do Mantine têm estado global: limpe com `notifications.clean()` dentro de `act` depois de cada teste que as exibe.
- Cobertura com thresholds (D27): o `yarn verify` e o CI falham se ela cair.

## Commits e branches

- Conventional Commits, com tipo em inglês e descrição em pt-BR. Ex.: `feat(catalogo): adiciona busca com debounce`.
- Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `build`, `ci`, `perf`, `chore`.
- Commits pequenos, um assunto por commit.
- Branches curtas a partir da `main` (`feat/…`, `fix/…`, `chore/…`, `ci/…`, `docs/…`), integradas por PR com squash.

## Scripts de verificação

| Comando                             | O que faz                                                          |
| ----------------------------------- | ------------------------------------------------------------------ |
| `yarn dev`                          | Servidor de desenvolvimento                                        |
| `yarn build` / `yarn preview`       | `tsc -b` + build de produção / serve o build na porta 4173         |
| `yarn typecheck`                    | `tsc -b`                                                           |
| `yarn lint` / `yarn lint:fix`       | Oxlint com type-aware; warnings também falham                      |
| `yarn format` / `yarn format:check` | Prettier                                                           |
| `yarn test` / `yarn test:watch`     | Vitest (jsdom)                                                     |
| `yarn test:coverage`                | Vitest com cobertura v8 e thresholds (relatório em `coverage/`)    |
| `yarn test:e2e`                     | Playwright headless contra `yarn build && yarn preview`            |
| `yarn verify`                       | lint + format:check + typecheck + test:coverage + build + test:e2e |

Convenção: nenhum script pode ter o nome de um comando interno do Yarn 1 (a lista sai em `yarn help`), porque `yarn <nome>` executaria o comando interno em vez do script.

Antes do primeiro `yarn test:e2e`, instale o navegador com `yarn playwright install chromium` (D17).

## CI/CD

- `ci.yml`: push em qualquer branch, pull request para a `main` e `workflow_call`. Checks exigidos pelo ruleset: **`verify`**, **`e2e`** e **`pr-title`** (este no `pr-title.yml`). Não renomeie esses jobs nem use filtros de caminho, porque um check exigido que não roda trava o merge. O `verify` roda `yarn test:coverage` e publica o relatório como artefato `coverage`.
- `deploy.yml`: push na `main` ou disparo manual. Reusa o CI como portão e roda build → deploy no Pages → espera a versão publicada (meta `app-version`, D34) → smoke `@smoke` em produção.
- `pr-title.yml`: o job **`pr-title`** valida o título do PR, que vira a mensagem do squash, no padrão Conventional Commits (D31). Também é check exigido.
- Só actions oficiais (`actions/*`), fixadas por SHA completo com o comentário da versão (D19). Novas versões entram via Dependabot, que respeita 7 dias de espera.
- Passos sempre separados e nomeados; a instalação é literalmente `yarn install --frozen-lockfile`.

## Definição de pronto

- `yarn install --frozen-lockfile` e `yarn verify` verdes no Windows e, a partir da Fase 1, no CI em Linux.
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
- **D11**: Ruleset da `main`: PR obrigatório com 0 aprovações, checks obrigatórios (`verify`, `e2e` e `pr-title`), merge só por squash, exclusão e force push bloqueados, modo loose, sem bypass.
- **D12**: Ícones aprovados. Dependabot só para GitHub Actions, com cooldown de 7 dias, na Fase 1. axe fica de fora por ora; o lint de título de PR entrou na Fase 2 (D31).
- **D13**: A A1 vale para as dependências diretas. Transitivas com menos de 7 dias são listadas no relatório de cada fase, sem fixação via `resolutions`.
- **D14**: Os caminhos das rotas ficam centralizados em `src/lib/paths.ts`.
- **D15**: Fora da pasta atual, importe pelo alias `@/`; assim, imports relativos não contornam as regras de camadas.
- **D16**: O nome da aplicação é Loja Dummy.
- **D17**: O Chromium do Playwright (versão completa, que permite depurar com o navegador visível) fica no cache padrão do usuário, via `yarn playwright install chromium`. É uma exceção autorizada, como o cache do Yarn. Local e CI usam o mesmo motor, sem `channel: 'msedge'`; no CI, só o headless shell.
- **D18**: `yarn verify` = lint → format:check → typecheck → test:coverage → build → test:e2e (com cobertura desde a Fase 2, D27).
- **D19**: Actions oficiais fixadas por SHA completo com comentário de versão; atualização via Dependabot com cooldown.
- **D20**: Smoke pós-deploy com Playwright contra https://wiudev.github.io/dummy/, em que o deep link deve responder 404 e renderizar a rota.
- **D21**: Dependências diretas com versão exata (o lockfile resolve a versão escolhida); `@types/node` segue em `~22.19.x`.
- **D22**: As versões auditadas são mantidas. Só se troca por correção relevante, com nova auditoria de data e `engines`.
- **D23**: Coverage, user-event, preset PostCSS do Mantine, notifications e ícones entram nas fases em que forem usados.
- **D24**: A página temporária "Em construção" fica em `src/routes/` e sai na Fase 3.
- **D25** (E1): O `HttpErrorNotifier` entra na Fase 2. Ele assina `httpErrorEvents` e mostra as falhas de rede, tempo esgotado, 5xx e 429 com `@mantine/notifications`, com um `id` por tipo de falha para não repetir a notificação.
- **D26** (E2): Fixtures capturadas da API e enxutas, com tokens JWT sintéticos (assinatura falsa e `exp` em 2100 e 2101) e sem os dados sensíveis fictícios da DummyJSON (senha, documentos, banco, cripto).
- **D27** (E3): Cobertura v8 com thresholds de 80/80/80/70 (linhas, statements, funções, branches) no geral e 90/90/90/85 em `lib`, `services`, `hooks` e `schemas`. O `yarn verify` e o CI rodam `test:coverage`.
- **D28** (E4): Os services de leitura de produtos aceitam `scope: 'public' | 'admin'`; com `admin`, leem pelas rotas `/auth/products`, com Bearer. As escritas sempre usam `/auth/products`.
- **D29** (E5): Sem locale global do Zod até a Fase 5. As mensagens de validação em pt-BR entram com os formulários.
- **D30** (E6): O job de contrato contra a API real fica para a Fase 7. Até lá, os testes de contrato usam as fixtures.
- **D31** (B1): `pr-title.yml` valida o título do PR no padrão Conventional Commits, com os tipos deste arquivo e escopo opcional. Só shell, sem actions de terceiros, título recebido por `env` (nunca interpolado no script) e `permissions: {}`.
- **D32** (B2): Numa rota `/auth/*` (exceto o login) sem sessão salva, o interceptor rejeita localmente com `unauthorized`, sem enviar a requisição e sem evento. Com a sessão expirada, também não envia, apaga a sessão e emite `expired`; um 401 da API emite `rejected`.
- **D33** (B3): No `useAsyncAction`, uma nova chamada de `run` aborta a anterior, que termina com `{ ok: false }` e erro `canceled`, sem mexer no estado. O `run` nunca rejeita.
- **D34**: O build grava a versão na meta `app-version` do `index.html` e do `404.html` (o `GITHUB_SHA`, ou `local`). Depois do deploy, o smoke espera essa versão ficar no ar, porque o CDN do Pages guarda o HTML por até 10 minutos, e confere a meta.
- **A1**: Não adotar versão publicada há menos de 7 dias, exceto correção de segurança, e registrar a data de publicação (escopo em D13).
- **A2**: `AppError` em `src/lib/errors.ts` (sem axios), `toAppError` em `services` e `HttpErrorNotifier` em `src/app/`. Única exceção de import: zodResolver → `@mantine/form`.
- **A3**: O carrinho pode usar `useReducer`. O overlay do admin usa `useState` com atualizações funcionais e spread (evidência do requisito 2.1 citada no README).
- **A4**: O logout limpa o overlay do admin.
- **A5**: Moeda com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' })`.
- **A6**: Formato do token validado com `z.jwt()` do Zod 4, se existir na versão instalada.
- **A7**: A Fase 0 não tem CI. O pronto dela é a verificação local, e o PR é mesclado sem checks obrigatórios.
