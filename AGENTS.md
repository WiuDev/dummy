# AGENTS.md

Referência persistente para quem trabalha neste repositório, seja pessoa ou agente de IA. Quando uma decisão nova for aprovada, atualize este arquivo no mesmo PR.

## Projeto

- **Loja Dummy**: SPA de catálogo e compras em React + TypeScript sobre a API pública [DummyJSON](https://dummyjson.com).
- Área pública: `/produtos`, `/produtos/:id`, `/carrinho` e `/login`. Área administrativa protegida: `/admin` (gestão de produtos).
- Repositório: https://github.com/WiuDev/dummy · Deploy (GitHub Pages): https://wiudev.github.io/dummy/
- A checklist dos 10 requisitos técnicos, com o status de cada um, fica no `README.md`.

## Fluxo de trabalho

- Etapas: auditoria (quando já houver código) → planejamento → implementação → testes → publicação.
- **Nenhum código sem plano aprovado**, exceto nas fases aceleradas. Implemente só a fase aprovada, sem antecipar dependências ou arquivos de outras fases.
- Fases aceleradas (D51): nas Fases 4 e 7, plano e implementação acontecem na mesma etapa. O plano abre o relatório e a implementação segue em seguida, desde que fique dentro das decisões vigentes. Se surgir decisão nova (dependência fora das previstas, mudança nas regras de camadas, spike que contrarie o plano), pare depois do plano e reporte. Nas Fases 5 e 6, o plano continua sendo revisado antes da implementação.
- Se algo divergir do plano (ferramenta que falha, versão incompatível, regra que não fecha), pare e reporte as opções. Não troque ferramenta nem arquitetura por conta própria.
- Relatórios curtos (D52): sem código nem saídas completas, a menos que sejam pedidos. Se um comando falhar, traga só o trecho do erro.
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
| UI        | @tabler/icons-react                                                       | 3.48.0                                          | instalado                             |
| UI        | @mantine/form                                                             | 9.6.3                                           | instalado                             |
| Estilos   | postcss · postcss-preset-mantine · postcss-simple-vars                    | 8.5.29 · 1.18.0 · 7.0.1                         | instalados (D35)                      |
| Rotas     | react-router (modo declarativo)                                           | 7.18.4                                          | instalado                             |
| Dados     | axios · zod                                                               | 1.20.0 · 4.6.5                                  | instalados                            |
| Testes    | vitest · jsdom · @testing-library/react, dom, jest-dom · @playwright/test | 5.0.2 · 29.1.1 · 16.3.3, 10.4.2, 7.0.1 · 1.63.0 | instalados                            |
| Testes    | @vitest/coverage-v8 · msw                                                 | 5.0.2 · 2.15.0                                  | instalados                            |
| Testes    | @testing-library/user-event                                               | 14.6.7                                          | instalado                             |

As versões planejadas são alvos: confirme a data de publicação (A1) e o `engines` no momento da instalação.

## Política de versões

- **A1**: não adote versão publicada há menos de 7 dias, exceto correção de segurança. Registre a data de publicação de toda versão instalada. A regra vale para as versões escolhidas (dependências diretas); dependências transitivas com menos de 7 dias são listadas no relatório da fase, sem fixação via `resolutions` (D13). Esclarecimento (D35): uma versão que já está no `yarn.lock` como transitiva pode ser declarada como dependência direta mesmo com menos de 7 dias, porque não introduz código novo; versões que ainda não estão no lockfile continuam sujeitas à regra.
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

| Camada                | Papel                                                                                                                                                  | Pode importar                                                                                          | Não pode importar                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `app/`                | Composição: providers, rotas, tema, `HttpErrorNotifier`, `ScrollToTop`                                                                                 | todas as camadas, features só pelo `index.ts`                                                          | `axios`, `@/test`, internos de features                                                   |
| `layouts/`, `routes/` | AppShell, navegação persistente e guards                                                                                                               | components, hooks, lib, schemas, features pelo `index.ts`                                              | `@/app`, `@/services`, `axios`, `@/test`, internos de features                            |
| `features/<nome>/`    | Domínio, em `components/`, `pages/`, `hooks/`, `context/` e `index.ts` (API pública)                                                                   | components, hooks, lib, schemas, outras features pelo `index.ts`; services só em `hooks/` e `context/` | `axios`, `@/app`, `@/layouts`, `@/routes`, `@/test`, internos de outra feature, `../../`  |
| `components/`         | UI apresentacional, com props tipadas e `children`                                                                                                     | hooks, lib, schemas, React, Mantine, Tabler                                                            | features, services, app, layouts, routes, `axios`, `@/test`                               |
| `hooks/`              | Hooks genéricos, sem domínio e sem HTTP                                                                                                                | lib, schemas, React                                                                                    | features, components, services, app, layouts, routes, `axios`, `@/test`                   |
| `services/`           | HTTP (`api.ts` é a instância do Axios), validação Zod, `toAppError` e eventos HTTP                                                                     | lib, schemas, `axios`, `zod`                                                                           | React, Mantine, Tabler, features, components, hooks, app, layouts, routes, `@/test`       |
| `schemas/`            | Schemas Zod e tipos via `z.infer`                                                                                                                      | `zod` e outros schemas                                                                                 | qualquer outra camada, React, UI, `axios`                                                 |
| `lib/`                | TypeScript puro: `errors.ts` (`AppError`), eventos, storage, JWT e sessão, carrinho salvo, `paths.ts` (rotas), retorno do login, preços e formatadores | `zod`, schemas e lib                                                                                   | React, UI, `axios`, features, components, hooks, services, app, layouts, routes, `@/test` |
| `test/`               | Utilitários de teste: MSW, fixtures, `renderWithProviders`, `LocationDisplay`, JWT, sessões e itens de carrinho de teste                               | tudo, exceto o que está ao lado                                                                        | `axios` (use MSW), internos de outras features                                            |

- Entre pastas, importe pelo alias `@/`. Imports relativos só dentro da própria pasta (`./`); dentro de uma feature, no máximo `../`. O `index.ts` de uma feature só reexporta `./`.
- **Única exceção explícita:** `src/lib/forms/zodResolver.ts` pode importar `@mantine/form` (A2).
- Arquivos de teste (`*.test.ts(x)` e `src/test/**`) podem importar `@/test`; `axios` e internos de outras features continuam proibidos.
- Tudo isso é imposto por `no-restricted-imports` e `import/no-cycle` no `.oxlintrc.json`.
- O E2E (`e2e/`) fica fora das camadas: de `src/` ele só importa os schemas, por caminho relativo com extensão `.ts` (o `tsconfig.node.json` usa `nodenext`), e lê as fixtures do disco (D45). Por isso, um schema importado pelo E2E que importa outro schema usa a extensão no import relativo (ex.: `cart.ts` importa `./product.ts`).

## Convenções de código

- TypeScript estrito (`strict`, `noImplicitAny`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noImplicitReturns`). `erasableSyntaxOnly` proíbe `enum`/`namespace`: use uniões e `as const`. Com `verbatimModuleSyntax`, use `import type`.
- Dados externos (API, storage, URL, `location.state`) entram como `unknown` e são validados com Zod: `.safeParse` quando a falha muda o fluxo (ex.: id inválido vira "não encontrado"), ou `.parse` com `.catch` quando há um valor padrão (ex.: parâmetros do catálogo na URL), que nunca lança. Tipos de domínio vêm de `z.infer`.
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
- Fake timers só onde não há rede (debounce, expiração). O user-event funciona com os fake timers do Vitest se o relógio andar sozinho: `vi.useFakeTimers({ shouldAdvanceTime: true })` com `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`. Sem o `shouldAdvanceTime`, o `setTimeout(0)` que o Testing Library espera depois de cada interação nunca dispara e o teste trava; o `advanceTimers` evita a espera de cerca de 20 ms em cada passo. Para controlar o relógio com exatidão, use `fireEvent` e `act(() => { vi.advanceTimersByTime(ms) })`.
- O interceptor XHR do MSW não dispara o `timeout` do jsdom enquanto o handler não responde; o tempo esgotado é testado com um adapter de teste que rejeita como o adapter XHR do axios (`code: 'ETIMEDOUT'`).
- As notificações do Mantine têm estado global: limpe com `notifications.clean()` dentro de `act` depois de cada teste que as exibe.
- Interações com `@testing-library/user-event` (`userEvent.setup()`) e consultas por papel e nome. Para testar páginas e rotas, `renderWithProviders(<AppRoutes />, { route })` monta o layout e as rotas reais num `MemoryRouter`; com `initialEntries`, o histórico começa com várias entradas, na última. Para conferir a URL, renderize o `LocationDisplay` (`src/test/location.tsx`), um `<output aria-label="Endereço atual">`.
- O `getByText` só casa o texto do próprio elemento: com um `VisuallyHidden` dentro, confira o elemento pai com `toHaveTextContent`.
- No `Select` do Mantine, o campo tem o papel `combobox` e as opções, `option`. O botão de limpar é `aria-hidden` e fica fora da tabulação: nos testes, ache-o com `{ hidden: true }`. Pelo teclado, escolher de novo a opção atual limpa a seleção (`allowDeselect`).
- O jsdom não implementa `window.scrollTo`: o setup o troca por uma função vazia. Para conferir a rolagem, use `vi.spyOn(window, 'scrollTo')`.
- Para semear o carrinho, `renderWithProviders(ui, { cartItems })` grava os itens no storage do jsdom antes de montar o `CartProvider`. Os itens de teste ficam em `src/test/cart.ts`. Para simular outra aba, grave o storage e dispare `new StorageEvent('storage', { key })`: o navegador só entrega esse evento às outras abas.
- Para semear a sessão, `renderWithProviders(ui, { session })` grava a sessão no storage do jsdom antes de montar o `AuthProvider` (`activeSession()` e `sessionExpiringIn(ms)` ficam em `src/test/session.ts`). O `initialEntries` aceita entradas com state, como `{ pathname: '/login', state: { from: '/admin' } }`.
- O `BrowserRouter` e o `MemoryRouter` do React Router 7 aplicam a navegação dentro de `startTransition`. Uma atualização de estado feita junto com um `navigate` (ex.: o logout no Sair) precisa entrar na mesma transição; senão, renderiza antes da navegação.
- Com fake timers, `vi.getTimerCount()` também conta os timers do scheduler do React: confira o efeito (ex.: a sessão que continua salva), não a contagem.
- No `useForm` do login, o modo é `controlled`: no `uncontrolled`, o `setFieldValue` remonta o campo e o foco dado logo depois se perde. Para focar um campo, use `form.getInputNode(path)`, que dispensa o ref.
- Com `clampBehavior="strict"`, o `NumberInput` do Mantine recusa a tecla que levaria o valor para fora de `min` e `max`, mas deixa o campo vazio.
- O `Badge` e o `VisuallyHidden` do Mantine são `div`: dentro de um link ou botão, o nome calculado pelo conteúdo ganha espaços a mais. Quando o nome precisa de mais que o texto visível, use um `aria-label` que comece pelo texto visível.
- As consultas do Testing Library normalizam espaços: o espaço não separável (U+00A0) que o `Intl` põe depois de `US$` vira um espaço comum. Em comparações exatas fora do DOM, use uma constante para o caractere, nunca o caractere literal.
- No jsdom o CSS do Mantine não é aplicado: `hiddenFrom` e `visibleFrom` não escondem nada nos testes.
- No Playwright, use `page.goto('produtos')`, sem barra inicial: o `baseURL` termina em `/dummy/`.
- No E2E, o tsconfig não tem os tipos do DOM: o script do `page.addInitScript` vai como texto (`{ content }`). O botão de mostrar a senha também tem "senha" no nome, então o campo é `getByLabel('Senha', { exact: true })`.
- Os specs do Playwright importam `test` e `expect` de `e2e/support/test.ts`, nunca direto de `@playwright/test`: a fixture automática instala a API mockada em cada página, e uma requisição externa sem mock falha o teste (D45). Spec que depende dos dados das fixtures é pulado com `E2E_BASE_URL` (`test.skip(isDeployed, …)`). O smoke (`@smoke`) também roda contra a API real e por isso confere só a estrutura das páginas.
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
- **D4**: `zodResolver` próprio em `src/lib/forms/zodResolver.ts`, sobre o `schemaResolver` nativo do `@mantine/form`. Implementado na Fase 5: `schemaResolver(schema, { sync: true })`, que aceita o Standard Schema do Zod 4, com os valores tipados pelo schema.
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
- **D24**: A página temporária "Em construção" ficou em `src/routes/` até o PR 3b da Fase 3, que a removeu ao ligar as páginas do catálogo.
- **D25** (E1): O `HttpErrorNotifier` entra na Fase 2. Ele assina `httpErrorEvents` e mostra as falhas de rede, tempo esgotado, 5xx e 429 com `@mantine/notifications`, com um `id` por tipo de falha para não repetir a notificação.
- **D26** (E2): Fixtures capturadas da API e enxutas, com tokens JWT sintéticos (assinatura falsa e `exp` em 2100 e 2101) e sem os dados sensíveis fictícios da DummyJSON (senha, documentos, banco, cripto).
- **D27** (E3): Cobertura v8 com thresholds de 80/80/80/70 (linhas, statements, funções, branches) no geral e 90/90/90/85 em `lib`, `services`, `hooks` e `schemas`. O `yarn verify` e o CI rodam `test:coverage`.
- **D28** (E4): Os services de leitura de produtos aceitam `scope: 'public' | 'admin'`; com `admin`, leem pelas rotas `/auth/products`, com Bearer. As escritas sempre usam `/auth/products`.
- **D29** (E5): Sem locale global do Zod até a Fase 5. As mensagens de validação em pt-BR entram com os formulários. Fechada pela D59.
- **D30** (E6): O job de contrato contra a API real fica para a Fase 7. Até lá, os testes de contrato usam as fixtures.
- **D31** (B1): `pr-title.yml` valida o título do PR no padrão Conventional Commits, com os tipos deste arquivo e escopo opcional. Só shell, sem actions de terceiros, título recebido por `env` (nunca interpolado no script) e `permissions: {}`.
- **D32** (B2): Numa rota `/auth/*` (exceto o login) sem sessão salva, o interceptor rejeita localmente com `unauthorized`, sem enviar a requisição e sem evento. Com a sessão expirada, também não envia, apaga a sessão e emite `expired`; um 401 da API emite `rejected`.
- **D33** (B3): No `useAsyncAction`, uma nova chamada de `run` aborta a anterior, que termina com `{ ok: false }` e erro `canceled`, sem mexer no estado. O `run` nunca rejeita.
- **D34**: O build grava a versão na meta `app-version` do `index.html` e do `404.html` (o `GITHUB_SHA`, ou `local`). Depois do deploy, o smoke espera essa versão ficar no ar, porque o CDN do Pages guarda o HTML por até 10 minutos, e confere a meta.
- **D35**: Esclarecimento da A1: uma versão que já está no lockfile como transitiva pode virar dependência direta mesmo com menos de 7 dias. Assim o `postcss` entrou na 8.5.29, a mesma do Vite, com uma única cópia; versões novas no lockfile seguem a regra.
- **D36**: Os parâmetros do catálogo na URL são `q`, `categoria` e `pagina`, em pt-BR como as rotas, e viram `query`, `category` e `page` no código. Valores ausentes ou inválidos caem no padrão (`src/schemas/catalog.ts`).
- **D37**: No mobile, a navegação pública abre num `Drawer` (prende o foco, fecha com Esc e ao escolher um item). O cabeçalho só tem links para rotas que já existem.
- **D38**: A Fase 3 sai em dois PRs: 3a (layout, rotas, componentes de estado e hooks do catálogo) e 3b (páginas do catálogo, E2E do fluxo 1 e smoke final).
- **D39**: `useDocumentTitle` define o título da aba por página e o restaura no cleanup.
- **D40**: O seletor de tema claro/escuro fica para a Fase 7.
- **D41**: Na Fase 4, o carrinho usa `useState` com funções puras que atualizam com spread, no lugar do `useReducer` que a A3 permitia. Assim o requisito 2.1 já fica evidenciado na Fase 4, sem depender do overlay do admin. Implementado na Fase 4 (`src/features/cart/context/cart-state.ts`).
- **D42**: O smoke roda com a API mockada no CI (preview local) e contra a API real em produção, como verificação contínua da integração; o E2E do CI continua todo mockado. Implementado no PR 3b: o smoke confere a estrutura das páginas, não os dados das fixtures.
- **D43**: O `StockBadge` (PR 3b) mostra rótulos em pt-BR ("Em estoque", "Estoque baixo", "Esgotado"), não o texto em inglês da API. Nomes, descrições e avaliações seguem como vêm da API.
- **D44** (C1): As respostas mockadas do E2E levam `Access-Control-Allow-Origin: *`. O spike do PR 3b mostrou que, no Playwright 1.63, o navegador aceita a resposta do `route.fulfill` sem cabeçalho CORS (GET 200 e POST 201) e que o próprio Playwright responde ao preflight, que nem chega à rota. Ou seja, o cabeçalho é opcional; ele fica por fidelidade à API real e para não depender desse comportamento.
- **D45**: E2E mockado (`e2e/support/`). A DummyJSON responde com as mesmas fixtures do Vitest, lidas do disco e validadas com os schemas do app (`fixtures.ts`, `mock-api.ts`). As imagens do CDN viram um PNG transparente e qualquer outro host externo é bloqueado. Rota, método ou host sem mock falha o teste, como o `onUnhandledRequest: 'error'` do MSW. A fixture automática de `test.ts` instala o mock em cada página quando não há `E2E_BASE_URL`.
- **D46** (C2): No detalhe do produto, id inválido (`.safeParse`) e 404 da API mostram "Produto não encontrado" (título da página e da aba), com link para o catálogo e sem "Tentar novamente". As demais falhas mostram o erro com "Tentar novamente".
- **D47** (C5): No modo declarativo, o React Router não controla a rolagem. O `ScrollToTop` (`src/app/`) leva ao topo quando muda o caminho ou o parâmetro `pagina`. Busca e categoria não rolam a tela, e no Voltar e no Avançar (navegação `POP`) a rolagem fica com o navegador.
- **D48**: O botão Voltar do detalhe usa `navigate(-1)` quando há histórico dentro do app, e assim preserva a busca, a categoria e a página. Quando o detalhe é a primeira entrada (deep link, `location.key === 'default'`), vai para `/produtos` com `replace`.
- **D49**: O catálogo normaliza a URL com `<Navigate replace>`, sem criar entrada no histórico: parâmetros inválidos ou com o valor padrão saem da URL, e uma página além da última (ex.: depois de trocar a categoria) vira a última.
- **D50**: Na URL do catálogo, a digitação da busca grava com `replace`, para não encher o histórico; categoria, página e "Limpar filtros" gravam com push, para o Voltar do navegador refazer o caminho. Mudar a busca ou a categoria volta à página 1. O `SearchField` guarda o texto localmente e só grava 400 ms depois da última tecla; se a busca mudar por fora (Voltar, "Limpar filtros"), o campo acompanha sem buscar de novo.
- **D51**: Fases aceleradas: nas Fases 4 e 7, o plano e a implementação acontecem na mesma etapa, dentro das decisões vigentes, e o plano abre o relatório. Uma decisão nova (dependência fora das previstas, mudança nas regras de camadas, spike que contrarie o plano) interrompe o trabalho depois do plano. As Fases 5 e 6 seguem com o plano revisado antes da implementação.
- **D52**: Os relatórios são curtos: sem código nem saídas completas, a menos que sejam pedidos. Numa falha, só o trecho do erro.
- **D53**: O aviso de chunk acima de 500 kB do build fica nos logs por enquanto. A divisão por rota com `React.lazy` entra na Fase 6, com a área admin.
- **D54**: Cada item do carrinho guarda os dados do produto quando ele entrou (id, título, preço, desconto, estoque e miniatura) e a quantidade, em `dummy:cart:v1` com `version: 1`. O schema descarta o carrinho salvo se a versão for outra, se uma quantidade passar do estoque ou se houver produto repetido. O storage fica em `src/lib/cart-storage.ts`, como a sessão, para o `renderWithProviders` semear o carrinho sem importar internos da feature.
- **D55**: A quantidade fica sempre entre 1 e o estoque. No detalhe, ela vai até o que resta (o estoque menos o que já está no carrinho), e os campos usam `clampBehavior="strict"`; tirar um item é só pelo botão Remover. Os totais são calculados em centavos inteiros: o preço unitário com desconto é arredondado uma vez, como no `discountedPrice`, e multiplicado pela quantidade.
- **D56**: O link do carrinho mostra a soma das quantidades num selo (até 99+), com o nome acessível num `aria-label` ("Carrinho, 3 itens"); com o carrinho vazio, ele é só "Carrinho". No mobile, fica no Drawer, como os outros links (D37). O card do catálogo não tem botão de compra: ela começa no detalhe.
- **D57**: Sessão (Fase 5). A hidratação é síncrona, no inicializador do `AuthProvider`, e a sessão salva vencida é apagada. Ela é encerrada em três camadas: um timer até o `expiresAt`, com o atraso limitado a 2³¹−1 ms, que ao disparar confere a sessão de novo e, se ela ainda valer, reagenda (nunca encerra só porque disparou); a volta à aba (`visibilitychange`); e o `unauthorizedEvents` do interceptor (D32), para a sessão vencida antes do envio e o 401. Outras abas são acompanhadas pelo evento `storage`, sem aviso. O fim involuntário (inclusive a sessão salva vencida ao abrir) mostra uma notificação de id fixo; o Sair encerra sem aviso. O logout mantém o carrinho, e o `value` expõe o usuário, mas não o token. Numa página pública, a pessoa continua nela; numa protegida, o `RequireAuth` leva ao login.
- **D58**: Redirecionamentos. O retorno do login vai no `location.state` (`from`), nunca na URL, e passa pelo `internalPathSchema`: só caminho interno, com uma única barra no começo, sem barra invertida nem espaços e com até 2048 caracteres; o `redirectTarget` também recusa o próprio `/login` e cai em `/produtos` em qualquer outro caso. Usam `replace`: o `RequireAuth` levando ao login, o retorno depois de entrar, o `/login` aberto já logado e o Sair numa página protegida (vai para `/produtos`, na mesma transição da navegação). Usam push: o Entrar e o "Finalizar compra" sem login.
- **D59**: Formulário de login. `@mantine/form` em modo controlado com o `zodResolver`; a validação roda no envio, com as mensagens em pt-BR no próprio schema, campo a campo, sem locale global do Zod (fecha a D29). O 400 vira o alerta "Usuário ou senha inválidos.", com a senha apagada e o foco nela; outras falhas mostram o motivo, além do toast global, que é aceito. Os campos têm `name` e `autocomplete` (`username`, `current-password`), o botão de mostrar a senha tem rótulo em pt-BR e entra na tabulação, e o Entrar fica em loading durante o envio.
- **D60**: Checkout. "Finalizar compra" sem login leva ao login, que volta ao carrinho; com login, o `useCheckout` envia o pedido com o id do usuário. Durante o envio, a quantidade e a remoção ficam desabilitadas; na falha, inclusive no descarte de produtos pela API (regra do `checkout()`), um alerta dá o motivo e o carrinho fica; o 401 encerra a sessão e o botão volta a levar ao login. O carrinho só é limpo depois de uma resposta válida, e desmontar no meio do envio aborta sem limpar. A confirmação (número do pedido, quantidade e total em centavos do carrinho) recebe o foco e não é salva.
- **D61**: Mocks de POST. No E2E, `POST /auth/login` aceita a conta pública de teste e responde com a fixture de login (token sintético, `exp` em 2100), e as outras credenciais recebem 400; `POST /auth/carts/add` exige o Bearer desse token, valida o pedido com o `checkoutRequestSchema` e monta o carrinho como a API, descartando sem aviso o produto desconhecido. O handler do MSW monta o carrinho do mesmo jeito. O smoke de produção continua sem login.
- **D62**: O `/admin` mostra, por enquanto, uma página provisória em `src/routes/` (`AdminPlaceholderPage`), que sai na Fase 6, como na D24. Qualquer conta logada entra: não há autorização por papel, e isso está nas limitações do README.
- **D63**: A Fase 5 saiu num PR só, e não em 5a e 5b: com os relatórios curtos (D52), o tamanho do PR deixou de pesar na revisão. Os commits de autenticação vêm antes dos de checkout.
- **A1**: Não adotar versão publicada há menos de 7 dias, exceto correção de segurança, e registrar a data de publicação (escopo em D13).
- **A2**: `AppError` em `src/lib/errors.ts` (sem axios), `toAppError` em `services` e `HttpErrorNotifier` em `src/app/`. Única exceção de import: zodResolver → `@mantine/form`.
- **A3**: Ajustada pela D41: o carrinho usa `useState` com funções puras e spread, não `useReducer`. O overlay do admin usa `useState` com atualizações funcionais e spread.
- **A4**: O logout limpa o overlay do admin.
- **A5**: Moeda com `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' })`.
- **A6**: Formato do token validado com `z.jwt()` do Zod 4, se existir na versão instalada.
- **A7**: A Fase 0 não tem CI. O pronto dela é a verificação local, e o PR é mesclado sem checks obrigatórios.
