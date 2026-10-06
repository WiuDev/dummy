# Loja Dummy

> **Aplicação no ar:** https://wiudev.github.io/dummy/

[![CI](https://github.com/WiuDev/dummy/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/WiuDev/dummy/actions/workflows/ci.yml)
[![Deploy](https://github.com/WiuDev/dummy/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/WiuDev/dummy/actions/workflows/deploy.yml)

Catálogo e compras em React + TypeScript que consome a API pública [DummyJSON](https://dummyjson.com). Tem uma área pública de navegação e uma área administrativa protegida por login.

> Projeto em desenvolvimento. **Fase 6 (admin) concluída**: a gestão de produtos tem tabela paginada com busca, cadastro, edição e exclusão com confirmação, todos simulados na sessão. Ela se junta ao catálogo, ao carrinho, ao login e ao checkout, que já estavam prontos. Próxima: **Fase 7 (polimento e entrega)**.

## Sumário

1. [Tema e visão geral](#tema-e-visão-geral)
2. [Funcionalidades](#funcionalidades)
3. [Área administrativa](#área-administrativa)
4. [Stack](#stack)
5. [Como executar localmente](#como-executar-localmente)
6. [Scripts](#scripts)
7. [Arquitetura](#arquitetura)
8. [Decisões e limitações da API](#decisões-e-limitações-da-api)
9. [Checklist dos 10 requisitos](#checklist-dos-10-requisitos)
10. [Testes](#testes)
11. [CI/CD, deploy e proteção da main](#cicd-deploy-e-proteção-da-main)
12. [Convenções](#convenções)
13. [Uso de IA](#uso-de-ia)
14. [Créditos](#créditos)

## Tema e visão geral

Tema escolhido: **catálogo e compras**, com os recursos `/products`, `/auth` e `/carts` da DummyJSON.

- **Área pública:** catálogo com busca, filtro por categoria e paginação; detalhes do produto; carrinho salvo no navegador.
- **Área administrativa:** login via `POST /auth/login` e gestão de produtos (listagem paginada, cadastro, edição e exclusão).

## Funcionalidades

| Área    | Rota                                                 | Funcionalidade                                                                                | Status    |
| ------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------- |
| Pública | `/produtos`                                          | Grid responsivo com busca (debounce), filtro por categoria e paginação, tudo refletido na URL | concluído |
| Pública | `/produtos/:id`                                      | Imagens, preço e desconto, avaliação, estoque, avaliações de clientes e adicionar ao carrinho | concluído |
| Pública | `/carrinho`                                          | Quantidades, remoção, totais e persistência; "Finalizar compra" exige login                   | concluído |
| Pública | `/login`                                             | Autenticação com retorno à página de origem                                                   | concluído |
| Admin   | `/admin/produtos`                                    | Tabela paginada com busca e exclusão com confirmação; alterações simuladas sinalizadas        | concluído |
| Admin   | `/admin/produtos/novo`, `/admin/produtos/:id/editar` | Cadastro e edição de produtos, com validação                                                  | concluído |

Credenciais de teste da DummyJSON: `emilys` / `emilyspass` (há outras em https://dummyjson.com/users).

## Área administrativa

Entre com a conta de teste e abra `/admin`, que leva à gestão de produtos. O admin tem layout próprio, com barra lateral recolhível e o aviso de que as alterações são simuladas. Ele é carregado sob demanda (`React.lazy`), fora do código da área pública.

- **Tabela:** 10 produtos por página, lidos pelas rotas autenticadas `/auth/products`. A busca procura no título e na descrição, como a da API. A busca e a página continuam as mesmas quando a pessoa vai ao formulário e volta.
- **Cadastro e edição:** formulário validado com Zod e mensagens em pt-BR. Ele pede título, descrição, categoria, preço, desconto e estoque; marca, URL da imagem (só https) e tags são opcionais.
- **Exclusão:** pede confirmação antes. O botão "Descartar alterações simuladas" volta aos dados da DummyJSON.

A DummyJSON simula as escritas: responde como se tivesse gravado, mas não grava nada. Por isso o app guarda o resultado de cada uma num overlay da sessão. Na tabela, os produtos criados aqui aparecem no topo da página 1 com o selo "Local", os editados aparecem com o selo "Simulado" e os excluídos somem.

Limitações:

- **Duração:** as alterações valem só na aba (ficam no `sessionStorage`) e são apagadas quando a sessão termina, seja pelo Sair (nesta aba ou em outra) ou pela expiração.
- **Paginação aproximada:** as páginas vêm do servidor e não se reequilibram. Uma página com um produto excluído mostra um item a menos, e os criados aqui entram a mais na página 1.
- **Busca:** quem busca os produtos do servidor é a API, que só conhece os dados originais. Um produto editado aqui continua sendo encontrado pelo título e pela descrição antigos, embora a tabela mostre os novos. Os criados aqui são buscados no navegador, pelo mesmo critério da API.
- **Itens criados aqui:** editar ou excluir um deles não chama a API, que não os conhece.
- **Acesso:** qualquer conta logada entra no admin (veja as limitações de segurança da sessão).

## Stack

React 19 · TypeScript 6 (estrito) · Vite 8 · Mantine 9 (core, form e notifications) + CSS Modules (PostCSS com o preset do Mantine) · Tabler Icons · React Router 7 · Axios + Zod · Context API · Vitest + React Testing Library + user-event + MSW · Playwright · GitHub Actions + GitHub Pages.

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
│  ├─ App.tsx                    # MantineProvider + tema + notificações + carrinho + rotas
│  ├─ AppRoutes.tsx              # rotas declarativas com layout routes; o admin com React.lazy
│  ├─ HttpErrorNotifier.tsx      # notifica falhas de rede, tempo esgotado, 5xx e 429
│  ├─ ScrollToTop.tsx            # volta ao topo ao mudar de caminho ou de página do catálogo
│  └─ theme.ts                   # tema do Mantine
├─ components/                   # UI apresentacional: AppNavLink, PageHeader, AsyncContent,
│                                # EmptyState, ErrorState, Price, PaginationNav e ConfirmDialog
├─ features/
│  ├─ admin-products/
│  │  ├─ index.ts                # API pública: AdminProductsProvider, useAdminProducts e as páginas
│  │  ├─ context/                # AdminProductsContext, AdminProductsProvider (overlay e filtros)
│  │  │                          # e as funções puras do overlay (overlay-state.ts)
│  │  ├─ hooks/                  # useAdminProducts, useAdminProductPage, useAdminProduct e
│  │  │                          # useProductMutations
│  │  ├─ components/             # ProductsTable, ProductForm e os valores do formulário
│  │  └─ pages/                  # AdminProductsPage (/admin/produtos) e ProductFormPage (novo e editar)
│  ├─ auth/
│  │  ├─ index.ts                # API pública: AuthProvider, useAuth, useSignOut, LoginPage, AccountNav
│  │  ├─ context/                # AuthContext e AuthProvider (sessão, expiração e outras abas)
│  │  ├─ hooks/                  # useAuth (lança erro fora do AuthProvider) e useSignOut (Sair)
│  │  ├─ components/             # LoginForm (@mantine/form + zodResolver) e AccountNav (cabeçalho)
│  │  └─ pages/                  # LoginPage (/login), só para visitantes
│  ├─ cart/
│  │  ├─ index.ts                # API pública: CartProvider, useCart, CartPage, AddToCartForm, CartNavLink
│  │  ├─ context/                # CartContext, CartProvider e as funções puras do carrinho (cart-state.ts)
│  │  ├─ hooks/                  # useCart (lança erro fora do CartProvider) e useCheckout
│  │  ├─ components/             # AddToCartForm, CartNavLink, CartItemList, CartItemRow, CartSummary,
│  │  │                          # OrderConfirmation
│  │  └─ pages/                  # CartPage (/carrinho)
│  └─ catalog/
│     ├─ index.ts                # API pública: as duas páginas, o SearchField e o useCategories
│     ├─ pages/                  # ProductsPage (/produtos) e ProductDetailsPage (/produtos/:id)
│     ├─ components/             # ProductCard, ProductGrid, SearchField, CategorySelect,
│     │                          # ProductGallery, ReviewList, StockBadge (+ CSS Modules)
│     └─ hooks/                  # useCatalogParams (URL), useProducts, useProduct, useCategories
├─ hooks/
│  ├─ useAsync.ts                # leitura assíncrona cancelável (abort no cleanup)
│  ├─ useAsyncAction.ts          # mutações com estado explícito
│  ├─ useDebouncedValue.ts       # debounce com setTimeout e clearTimeout
│  └─ useDocumentTitle.ts        # título da aba, restaurado no cleanup
├─ layouts/
│  ├─ PublicLayout.tsx           # AppShell: cabeçalho, navegação, menu mobile e <Outlet />
│  └─ AdminLayout.tsx            # AppShell do admin: barra lateral recolhível, aviso e <Outlet />
├─ lib/
│  ├─ errors.ts                  # AppError e mensagens em pt-BR
│  ├─ events.ts                  # canais de eventos tipados
│  ├─ storage.ts                 # localStorage e sessionStorage versionados e validados com Zod
│  ├─ jwt.ts                     # leitura do payload do JWT
│  ├─ auth-session.ts            # sessão de autenticação (dummy:auth:v1)
│  ├─ cart-storage.ts            # carrinho salvo (dummy:cart:v1)
│  ├─ admin-overlay.ts           # alterações simuladas do admin (dummy:admin-products:v1)
│  ├─ image-fallback.ts          # imagem neutra para foto de produto que não carrega
│  ├─ paths.ts                   # caminhos das rotas
│  ├─ redirect.ts                # retorno depois do login (from validado)
│  ├─ forms/zodResolver.ts       # validação dos formulários do @mantine/form com Zod
│  └─ format.ts, pricing.ts      # moeda, contagens, percentual, nota e data em pt-BR; preços em centavos
├─ routes/
│  ├─ NotFoundPage.tsx           # página não encontrada
│  └─ RequireAuth.tsx            # guard das rotas protegidas: sem sessão, leva ao login
├─ schemas/                      # schemas Zod do contrato e dos parâmetros da URL
├─ services/
│  ├─ api.ts                     # instância do Axios e interceptors
│  ├─ http-error.ts              # toAppError: falha HTTP → AppError
│  ├─ http-events.ts             # eventos de falha global e de sessão
│  ├─ parse-response.ts          # validação das respostas com Zod
│  └─ *.service.ts               # produtos, autenticação e carrinho
└─ test/
   ├─ setup.ts                   # setup do Vitest (jest-dom, MSW, polyfills do Mantine)
   ├─ render.tsx                 # renderWithProviders
   ├─ location.tsx               # LocationDisplay: o endereço atual, para conferir a URL
   ├─ cart.ts                    # itens de carrinho de teste, com os dados das fixtures
   ├─ admin.ts                   # páginas do servidor e produtos de teste do admin
   ├─ session.ts, jwt.ts         # sessões e JWTs sintéticos de teste
   ├─ msw/                       # servidor, handlers padrão e registro de requisições
   └─ fixtures/                  # respostas da API capturadas e enxutas
e2e/
├─ support/
│  ├─ test.ts                    # test e expect com a fixture automática da API mockada
│  ├─ mock-api.ts                # DummyJSON e CDN mockados; outros hosts bloqueados
│  ├─ fixtures.ts                # as fixtures de src/test, validadas com os schemas
│  └─ session.ts                 # script que grava uma sessão de teste antes de a página abrir
├─ catalog.spec.ts               # fluxo do catálogo, menu no celular e produto inexistente
├─ cart.spec.ts                  # carrinho e checkout com login (fluxo 2)
├─ auth.spec.ts                  # autenticação com redirecionamento (fluxo 3)
├─ admin-products.spec.ts        # gestão de produtos (fluxo 4)
└─ smoke.spec.ts                 # smoke (mockado no CI; em produção, com a API real)
```

O build separa o admin do resto: o chunk principal tem cerca de 751 kB (233 kB com gzip), e o admin carrega sob demanda o layout (2 kB) e as páginas (41 kB). O Vite ainda avisa que o chunk principal passa de 500 kB; a divisão das dependências externas fica para a Fase 7.

## Decisões e limitações da API

- A DummyJSON **simula** as escritas (POST, PUT, PATCH e DELETE) e não persiste nada. No admin, as alterações valem só na sessão da aba e são sinalizadas como simuladas (veja [Área administrativa](#área-administrativa)).
- A API não combina a busca textual com o filtro por categoria. Com os dois ativos, o catálogo traz a busca inteira (`limit=0`) e filtra e pagina no cliente.
- Nomes, descrições e avaliações vêm em inglês, como a API os entrega; só os rótulos de estoque são traduzidos.
- O carrinho fica no navegador e guarda os dados do produto do momento em que ele entrou. A API só recebe o carrinho no checkout, que exige login.
- O token (`accessToken`) expira em 60 minutos e não há refresh token: ao expirar, a sessão é encerrada e é preciso entrar de novo.
- **Limitações de segurança da sessão:** o token fica no `localStorage`, numa origem do GitHub Pages (`wiudev.github.io`) compartilhada com os outros repositórios publicados pelo mesmo usuário, então um script de qualquer um desses sites poderia lê-lo; não há refresh token; e qualquer conta logada acessa a área administrativa, porque não há verificação de papel.
- O carrinho da API descarta sem aviso os produtos que ela não conhece; o checkout confere a quantidade de itens aceitos e falha com uma mensagem amigável se ela divergir.
- Os preços vêm em dólar (USD) e são exibidos no formato pt-BR.

## Checklist dos 10 requisitos

| #   | Requisito                                             | Status    | Como foi resolvido                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| --- | ----------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Estrutura de componentes e tipagem com TypeScript     | concluído | Projeto criado com Vite (template react-ts) e TypeScript estrito, sem `any`. Componentes com props tipadas (`readonly`) e `children` (`PageHeader`, `EmptyState`, `AppNavLink`, `AsyncContent`, este com children como função, e `ConfirmDialog`, com a mensagem da confirmação como children), os do catálogo (`ProductCard`, `ProductGrid`, `SearchField`, `CategorySelect`, `ProductGallery`, `ReviewList` e `StockBadge`, em `src/features/catalog/components/`), os do admin (`ProductsTable` e `ProductForm`, em `src/features/admin-products/components/`) e estilos em CSS Modules com o preset do Mantine (`src/components/`, `src/layouts/`, `src/features/catalog/components/`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2   | Estado reativo, imutabilidade e ciclo de vida         | concluído | O carrinho usa `useState` com funções puras que atualizam com spread em arrays e objetos e reaproveitam os itens que não mudam, com teste de imutabilidade sobre objetos congelados (`src/features/cart/context/cart-state.ts`). O overlay do admin segue o mesmo padrão, também testado sobre objetos congelados (`src/features/admin-products/context/overlay-state.ts`), e os filtros da tabela (busca e página) ficam num objeto em `useState` atualizado com spread (`AdminProductsProvider`). Hooks com cleanup no ciclo de vida: `useAsync` aborta a requisição com `AbortController` e descarta respostas atrasadas (os hooks do catálogo passam tarefas estáveis), `useDebouncedValue` cancela o timer, `useDocumentTitle` restaura o título da aba e o `CartProvider` tira o listener do evento `storage` ao desmontar (`src/hooks/`, `src/features/`). O `SearchField` guarda o texto em estado local, acompanha a busca da URL e só a grava depois do debounce; o `ScrollToTop` lê o tipo da navegação com `useEffectEvent`, sem torná-lo dependência do efeito (`src/app/ScrollToTop.tsx`).                                                                                                                                        |
| 3   | Estado global com Context API e Custom Hooks          | concluído | `CartContext` e `CartProvider` guardam o carrinho para toda a aplicação, com `value` memoizado, totais em centavos e ações estáveis, e o custom hook `useCart` lança um erro fora do Provider (`src/features/cart/`); o carrinho é salvo em `dummy:cart:v1`, validado com Zod na hidratação e sincronizado entre abas pelo evento `storage` (`src/lib/cart-storage.ts`). O `AuthContext` e o `AuthProvider` fazem o mesmo com a sessão, e o `useAuth` também lança fora do Provider (`src/features/auth/`). O `AdminProductsContext` e o `AdminProductsProvider` guardam as alterações simuladas e os filtros da tabela para as páginas do admin, e o `useAdminProducts` lança fora do Provider (`src/features/admin-products/`); o overlay fica em `dummy:admin-products:v1` no `sessionStorage`, validado com Zod (`src/lib/admin-overlay.ts`), e o `AuthProvider` o apaga quando a sessão termina.                                                                                                                                                                                                                                                                                                                                           |
| 4   | Roteamento e layouts com React Router                 | concluído | `BrowserRouter` com `basename` (`src/main.tsx`) e rotas declarativas com layout route (`src/app/AppRoutes.tsx`): o `PublicLayout` persiste com `<Outlet />` (`src/layouts/PublicLayout.tsx`), `/` redireciona com `<Navigate replace>` e rotas desconhecidas mostram a `NotFoundPage`; o `AppNavLink` usa o `NavLink` e marca a rota ativa com `aria-current`. O catálogo guarda busca, categoria e página na URL com `useSearchParams` (`useCatalogParams`) e normaliza parâmetros inválidos com `<Navigate replace>`; o detalhe lê o id com `useParams` e volta com `useNavigate` (`src/features/catalog/pages/`); o `ScrollToTop` usa `useLocation` e `useNavigationType` para voltar ao topo, exceto no Voltar e no Avançar. O admin tem layout próprio, o `AdminLayout`, com as rotas aninhadas sob o `RequireAuth`: o `/admin` redireciona para `/admin/produtos`, a edição lê o id com `useParams` e, depois de salvar, volta à tabela com `navigate` e `replace`; o layout e as páginas do admin entram com `React.lazy` e `Suspense` (`src/app/AppRoutes.tsx`, `src/layouts/AdminLayout.tsx`).                                                                                                                                         |
| 5   | Interface gráfica e formulários com Mantine UI        | concluído | `MantineProvider` com tema e notificações (`src/app/App.tsx`, `src/app/theme.ts`); `AppShell` responsivo, com `Burger` e `Drawer` no mobile (`src/layouts/PublicLayout.tsx`); `Skeleton` e `LoadingOverlay` via `AsyncContent`. Formulário de login com `@mantine/form`, validado com Zod pelo `zodResolver` (`src/lib/forms/`), com mensagens em pt-BR, `TextInput`, `PasswordInput`, `Alert` e botão em loading (`src/features/auth/`). Listagem do catálogo em grade responsiva de `Card`, com busca em `TextInput`, categoria em `Select` e `Pagination` com rótulos em pt-BR (`src/features/catalog/`). No carrinho: quantidade com `NumberInput` limitado ao estoque, notificação ao adicionar, contador com `Badge` e resumo com o checkout (`src/features/cart/`). No admin: `AppShell` com barra lateral recolhível (`src/layouts/AdminLayout.tsx`); tabela com `Table` em contêiner com rolagem, `Badge` de origem e `Pagination`; formulário de produto com `@mantine/form` e `zodResolver`, com `TextInput`, `Textarea`, `Select` com busca, `NumberInput`, `TagsInput` e `Fieldset` desabilitado durante o envio; confirmação de exclusão em `Modal` (`ConfirmDialog`) e notificações de sucesso (`src/features/admin-products/`). |
| 6   | Fluxo de autenticação JWT e rotas protegidas          | concluído | Login pelo `POST /auth/login` (`src/features/auth/`), com a sessão salva e validada com Zod e a expiração lida do `exp` do JWT (`src/lib/auth-session.ts`). O `AuthProvider` encerra a sessão em três camadas: um timer até o vencimento (limitado ao máximo do `setTimeout`, que reconfere e reagenda), a volta à aba (`visibilitychange`) e o aviso do interceptor, que envia o Bearer nas rotas `/auth/*` e trata a sessão ausente, a vencida e o 401 (`src/services/api.ts`); outras abas são acompanhadas pelo evento `storage`. O `RequireAuth` protege o `/admin` e leva ao login com a origem no state, validada contra open redirect (`src/routes/RequireAuth.tsx`, `src/lib/redirect.ts`). O checkout usa o `POST /auth/carts/add` com o Bearer, e a gestão de produtos lê e escreve pelas rotas `/auth/products`, também com o Bearer.                                                                                                                                                                                                                                                                                                                                                                                               |
| 7   | Consumo de API REST, interceptors e validação com Zod | concluído | Instância do Axios com `baseURL`, timeout e interceptors de request (Bearer) e de response (`AppError`), em `src/services/api.ts`; toda resposta validada com Zod (`src/services/parse-response.ts`, `src/schemas/`); falhas de rede, tempo esgotado, 5xx e 429 viram notificação global (`src/app/HttpErrorNotifier.tsx`). Os formulários de login e de produto são validados com Zod pelo `zodResolver`, este com o `productFormSchema` (mensagens em pt-BR e imagem só com https, em `src/schemas/product-form.ts`), e o pedido do checkout, pelo `checkoutRequestSchema`. Os parâmetros do catálogo na URL passam por `.parse` com `.catch` (nunca lança: valor inválido cai no padrão), o id do produto, no detalhe e na edição do admin, por `.safeParse` (`src/schemas/catalog.ts`) e a origem do login por `.safeParse` (`src/lib/redirect.ts`).                                                                                                                                                                                                                                                                                                                                                                                        |
| 8   | Testes automatizados com Vitest e RTL                 | concluído | Vitest + jsdom + React Testing Library + jest-dom + user-event, com HTTP simulado pelo MSW (`src/test/msw/`) e `renderWithProviders` com roteador em memória, sessão e carrinho semeados (`src/test/render.tsx`); consultas por papel e nome; testes de contrato dos schemas e de services, hooks, componentes, layouts, rotas, páginas do catálogo, do carrinho e do admin, autenticação (com fake timers na expiração), checkout e as funções puras do overlay, com user-event também sob fake timers (debounce da busca); cobertura com thresholds (`vitest.config.ts`) no `yarn verify` e no CI.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 9   | Testes ponta a ponta com Playwright                   | concluído | Playwright headless contra o build de produção (`playwright.config.ts`), com a API mockada por uma fixture automática, inclusive o login e o checkout (`e2e/support/`). Quatro fluxos: (1) o catálogo, com busca, categoria, página, detalhe, Voltar e recarregamento, além do menu no celular e do produto inexistente (`e2e/catalog.spec.ts`); (2) o carrinho, com adicionar, o contador, alterar, remover e recarregar, e o checkout, que exige login e esvazia o carrinho (`e2e/cart.spec.ts`); (3) a autenticação com redirecionamento: o `/admin` leva ao login e volta, o Entrar do cabeçalho volta à página, e a sessão vencida leva ao login (`e2e/auth.spec.ts`); (4) a gestão de produtos, com o cadastro (inclusive um erro de validação), a edição, a exclusão de um item criado aqui, sem chamar a API, e de um do servidor, com o DELETE, as alterações mantidas ao recarregar, a busca e a página preservadas na ida ao formulário, o descarte e o Sair, que apaga as alterações (`e2e/admin-products.spec.ts`). O smoke cobre a home, um deep link de produto, uma rota desconhecida e o 404.html e, depois do deploy, roda contra a API real (`e2e/smoke.spec.ts`).                                                           |
| 10  | Pipeline de CI/CD e deploy em produção                | concluído | CI (`.github/workflows/ci.yml`), deploy no GitHub Pages com smoke pós-deploy que espera a versão publicada (`.github/workflows/deploy.yml`), `base`, 404.html e meta `app-version` (`vite.config.ts`) e validação do título do PR (`.github/workflows/pr-title.yml`). Ruleset da `main` (configuração no GitHub): PR obrigatório, checks `verify`, `e2e` e `pr-title`, merge só por squash e exclusão e force push bloqueados.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

## Testes

- **Unitários e de componentes:** Vitest 5 com jsdom, React Testing Library e jest-dom. As interações usam user-event, que também roda com fake timers no debounce da busca. Os testes ficam ao lado do código (`*.test.ts(x)`) e usam consultas acessíveis (`getByRole`, `getByText`). Rode com `yarn test`.
- **HTTP simulado:** o MSW 2 intercepta as requisições do Axios. Os handlers padrão respondem com fixtures capturadas da API (tokens sintéticos, sem dados sensíveis) e uma requisição sem handler falha o teste. O POST e o PUT de produtos devolvem o corpo enviado, como a API. Os schemas têm testes de contrato contra essas fixtures.
- **Cobertura:** `yarn test:coverage` (v8) com thresholds de 80/80/80/70 (linhas, statements, funções, branches) no geral e 90/90/90/85 em `lib`, `services`, `hooks` e `schemas`. O relatório HTML fica em `coverage/` e o CI o publica como artefato.
- **Ponta a ponta:** Playwright em modo headless contra o build de produção servido em `/dummy/`, com a API mockada. Uma fixture automática (`e2e/support/test.ts`) responde à DummyJSON com as mesmas fixtures dos testes unitários, validadas com os schemas, troca as imagens do CDN por um PNG transparente e bloqueia os outros hosts; uma requisição sem mock falha o teste. Como a API, o mock não guarda estado: as escritas do admin respondem, mas não mudam as leituras. Rode com `yarn test:e2e`.
  - `e2e/catalog.spec.ts`: o fluxo do catálogo (busca, categoria, página, detalhe, Voltar e recarregamento, com o estado na URL), o menu na largura de celular e o produto inexistente.
  - `e2e/cart.spec.ts`: o carrinho (adicionar pelo detalhe, o contador do cabeçalho, alterar a quantidade, remover e recarregar mantendo os itens) e o checkout: sem login, "Finalizar compra" leva ao login, que volta ao carrinho; com login, o pedido é confirmado e o carrinho fica vazio.
  - `e2e/auth.spec.ts`: o `/admin` sem sessão leva ao login, que mostra o erro de credenciais e, depois de entrar, abre a gestão de produtos com o nome no cabeçalho do admin, cujo Sair volta ao catálogo; o Entrar do cabeçalho volta à página em que a pessoa estava; uma sessão salva vencida leva ao login, com aviso.
  - `e2e/admin-products.spec.ts`: o cadastro (a imagem fora de https é recusada), a edição de um produto do servidor e as duas exclusões (a do item criado aqui não chama a API; a do servidor manda o DELETE), mantidas ao recarregar; a busca e a página preservadas na ida ao formulário e na volta; e o descarte, que volta aos dados da API, e o Sair, que apaga as alterações.
  - `e2e/smoke.spec.ts`: a home, que redireciona para o catálogo e lista os produtos (inclusive a meta `app-version`), o cabeçalho com a navegação ativa, um deep link de produto com recarregamento, uma rota desconhecida e o 404.html gerado no build. Ele confere a estrutura das páginas, não os dados, porque também roda em produção.
- Depois de cada deploy, o smoke roda contra o site publicado e a API real, assim que a meta `app-version` mostra o commit do deploy (o CDN do Pages guarda o HTML por até 10 minutos). Lá o deep link responde HTTP 404 (o GitHub Pages serve o 404.html) e a aplicação abre a rota pedida.

## CI/CD, deploy e proteção da main

- **CI** (`.github/workflows/ci.yml`): a cada push e pull request para a `main`. O job `verify` roda instalação com `yarn install --frozen-lockfile`, lint, formatação, typecheck, testes unitários com cobertura (o relatório vira o artefato `coverage`), build e checagem do 404.html. O job `e2e` roda o Playwright com a API mockada. O Node vem do `.nvmrc`.
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
