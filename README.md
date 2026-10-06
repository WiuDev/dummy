# Loja Dummy

> **Aplicação no ar:** https://wiudev.github.io/dummy/
>
> **Repositório:** https://github.com/WiuDev/dummy

[![CI](https://github.com/WiuDev/dummy/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/WiuDev/dummy/actions/workflows/ci.yml)
[![Deploy](https://github.com/WiuDev/dummy/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/WiuDev/dummy/actions/workflows/deploy.yml)

Catálogo e compras em React + TypeScript que consome a API pública [DummyJSON](https://dummyjson.com). Tem uma área pública, para navegar, buscar e comprar, e uma área administrativa protegida por login, para a gestão de produtos.

**Credenciais de teste (públicas, da DummyJSON):** usuário `emilys` e senha `emilyspass`. Há outras contas em https://dummyjson.com/users.

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

Tema escolhido: **catálogo e compras** (`/products`), com os recursos `/auth` e `/carts` da DummyJSON.

- **Área pública:** catálogo com busca, filtro por categoria e paginação; detalhes do produto; carrinho salvo no navegador, com um checkout que exige login.
- **Área administrativa:** login pelo `POST /auth/login` e gestão de produtos, com tabela paginada, busca, cadastro, edição e exclusão.

## Funcionalidades

| Área    | Rota                                                 | Funcionalidade                                                                                     |
| ------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Pública | `/produtos`                                          | Grade responsiva com busca (debounce), filtro por categoria e paginação, tudo refletido na URL     |
| Pública | `/produtos/:id`                                      | Imagens, preço e desconto, avaliação, estoque, avaliações de clientes e adicionar ao carrinho      |
| Pública | `/carrinho`                                          | Quantidades, remoção, totais e persistência; o checkout exige login e mostra a confirmação         |
| Pública | `/login`                                             | Autenticação com validação e retorno à página de origem                                            |
| Admin   | `/admin/produtos`                                    | Tabela paginada com busca e exclusão com confirmação; as alterações simuladas aparecem sinalizadas |
| Admin   | `/admin/produtos/novo`, `/admin/produtos/:id/editar` | Cadastro e edição de produtos, com validação                                                       |

Em todas as páginas:

- **Tema claro ou escuro:** segue o do sistema até a pessoa escolher, e a escolha fica salva no navegador.
- **Celular:** a navegação vai para um menu e, na área pública, o carrinho, com o contador, fica à vista no cabeçalho.
- **Acessibilidade:** link para pular para o conteúdo, foco visível e controles com nomes acessíveis. Quando o conteúdo muda, o foco vai para um lugar útil: o item vizinho ao remover um do carrinho, o título quando ele esvazia e a confirmação do pedido.

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

React 19 · TypeScript 6 (estrito) · Vite 8 · Mantine 9 (core, hooks, form e notifications) + CSS Modules (PostCSS com o preset do Mantine) · Tabler Icons · React Router 7 · Axios + Zod · Context API · Vitest + React Testing Library + user-event + MSW · Playwright · GitHub Actions + GitHub Pages.

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

Para rodar os testes:

```bash
yarn test                         # unitários e de componentes
yarn playwright install chromium  # uma vez: o navegador do E2E, no cache do usuário
yarn test:e2e                     # ponta a ponta, contra o build de produção
yarn verify                       # lint, formatação, tipos, testes com cobertura, build e E2E
```

Os comandos desta seção foram conferidos num clone limpo do repositório.

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
| `yarn test:contract`                | Testes de contrato com a API real (precisam de rede; ficam fora do verify)  |
| `yarn verify`                       | lint + format:check + typecheck + testes com cobertura + build + testes E2E |

## Arquitetura

Organização em camadas (`app`, `layouts`, `routes`, `features`, `components`, `hooks`, `services`, `schemas`, `lib`), com regras de import validadas pelo lint. O detalhe está em [AGENTS.md](AGENTS.md#arquitetura-e-regras-de-import).

```text
src/
├─ main.tsx                      # ponto de entrada: StrictMode + BrowserRouter (basename /dummy/)
├─ app/
│  ├─ App.tsx                    # MantineProvider (tema claro e escuro), notificações, sessão, carrinho e rotas
│  ├─ AppRoutes.tsx              # rotas declarativas com layout routes; o admin com React.lazy
│  ├─ HttpErrorNotifier.tsx      # notifica falhas de rede, tempo esgotado, 5xx e 429
│  ├─ ScrollToTop.tsx            # volta ao topo ao mudar de caminho ou de página do catálogo
│  └─ theme.ts                   # tema do Mantine e o tema salvo (colorSchemeManager)
├─ components/                   # UI apresentacional: AppNavLink, PageHeader, AsyncContent,
│                                # EmptyState, ErrorState, Price, PaginationNav, ConfirmDialog
│                                # e ColorSchemeToggle
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
│  │  │                          # OrderConfirmation e os ids dos itens (cart-item-ids.ts)
│  │  └─ pages/                  # CartPage (/carrinho)
│  └─ catalog/
│     ├─ index.ts                # API pública: as duas páginas, o SearchField e o useCategories
│     ├─ pages/                  # ProductsPage (/produtos) e ProductDetailsPage (/produtos/:id)
│     ├─ components/             # ProductCard, ProductGrid, SearchField, CategorySelect,
│     │                          # ProductGridSkeleton, ProductGallery, ReviewList, StockBadge
│     │                          # (+ CSS Modules)
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
├─ schemas/                      # schemas Zod do contrato, do storage, dos formulários e da URL
├─ services/
│  ├─ api.ts                     # instância do Axios e interceptors
│  ├─ http-error.ts              # toAppError: falha HTTP → AppError
│  ├─ http-events.ts             # eventos de falha global e de sessão
│  ├─ parse-response.ts          # validação das respostas com Zod
│  ├─ *.service.ts               # produtos, autenticação e carrinho
│  └─ api.contract.test.ts       # contrato com a API real (yarn test:contract)
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
├─ catalog.spec.ts               # fluxo do catálogo, menu no celular e produto inexistente (fluxo 1)
├─ cart.spec.ts                  # carrinho e checkout com login (fluxo 2)
├─ auth.spec.ts                  # autenticação com redirecionamento (fluxo 3)
├─ admin-products.spec.ts        # gestão de produtos (fluxo 4)
├─ theme.spec.ts                 # tema claro e escuro
└─ smoke.spec.ts                 # smoke (mockado no CI; em produção, com a API real)
```

O build divide o código: as dependências da carga inicial ficam em chunks próprios (React, React Router, Mantine e as demais), e o admin carrega sob demanda o layout e as páginas. O maior chunk, o do Mantine, tem cerca de 311 kB (95 kB com gzip), abaixo do limite de aviso do Vite (500 kB).

## Decisões e limitações da API

- A DummyJSON **simula** as escritas (POST, PUT, PATCH e DELETE) e não persiste nada. No admin, as alterações valem só na sessão da aba e são sinalizadas como simuladas (veja [Área administrativa](#área-administrativa)).
- A API não combina a busca textual com o filtro por categoria. Com os dois ativos, o catálogo traz a busca inteira (`limit=0`) e filtra e pagina no cliente.
- Nomes, descrições e avaliações vêm em inglês, como a API os entrega; só os rótulos de estoque são traduzidos.
- O carrinho fica no navegador e guarda os dados do produto do momento em que ele entrou. A API só recebe o carrinho no checkout, que exige login.
- O token (`accessToken`) expira em 60 minutos e não há refresh token: ao expirar, a sessão é encerrada e é preciso entrar de novo.
- **Limitações de segurança da sessão:** o token fica no `localStorage`, numa origem do GitHub Pages (`wiudev.github.io`) compartilhada com os outros repositórios publicados pelo mesmo usuário, então um script de qualquer um desses sites poderia lê-lo; não há refresh token; e qualquer conta logada acessa a área administrativa, porque não há verificação de papel.
- O carrinho da API descarta sem aviso os produtos que ela não conhece; o checkout confere a quantidade de itens aceitos e falha com uma mensagem amigável se ela divergir.
- Os preços vêm em dólar (USD) e são exibidos no formato pt-BR.
- Os testes do CI usam respostas capturadas da API e não dependem da rede. O contrato com a API real é conferido à parte, toda semana, pelo job `contract`.

## Checklist dos 10 requisitos

Todos os requisitos estão concluídos. Para cada subitem do enunciado, a tabela traz como ele foi resolvido e os arquivos de evidência.

### 1. Estrutura de componentes e tipagem com TypeScript

| Subitem                                                                                             | Como foi resolvido                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Evidência                                                                         |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1.1 Projeto inicializado com Vite no template React + TypeScript                                    | Criado com o template `react-ts` do Vite, em TypeScript estrito (`strict`, `noUncheckedIndexedAccess` e afins). O `any` é proibido pelo lint, e o `!` e o `@ts-ignore` também.                                                                                                                                                                                                                                                                                                                             | `package.json`, `vite.config.ts`, `tsconfig.app.json`, `.oxlintrc.json`           |
| 1.2 Componentes funcionais desacoplados, props tipadas, composição com children e estilos modulares | Só componentes funcionais, com props `readonly` (numa interface, nos componentes exportados). A composição usa `children` no `PageHeader`, no `EmptyState`, no `AppNavLink`, no `ConfirmDialog` (a mensagem da confirmação) e no `AsyncContent` (children como função). A UI genérica fica em `src/components/`, e cada feature tem os seus componentes, que outras features só alcançam pelo `index.ts` (regra do lint). Os estilos usam os componentes do Mantine e CSS Modules com o preset do Mantine. | `src/components/`, `src/features/*/components/`, `*.module.css`, `.oxlintrc.json` |

### 2. Estado reativo, imutabilidade e ciclo de vida

| Subitem                                                                               | Como foi resolvido                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Evidência                                                                                                                                                                        |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 Estado local com `useState`, atualizando objetos e arrays com spread              | O carrinho e o overlay do admin ficam em `useState` e mudam por funções puras, que devolvem objetos e arrays novos com spread e reaproveitam o que não mudou; os testes rodam sobre objetos congelados. Os filtros da tabela do admin (busca e página) são um objeto em `useState`, atualizado com spread. O `SearchField` guarda o texto digitado em estado local até o debounce.                                                                                            | `src/features/cart/context/cart-state.ts`, `src/features/admin-products/context/overlay-state.ts` (e os testes), `AdminProductsProvider.tsx`, `SearchField.tsx`                  |
| 2.2 `useEffect` com dependências precisas e cleanup de timers, subscrições e ouvintes | As dependências são conferidas pelo lint (`react/exhaustive-deps`). Todo efeito com recurso faz a limpeza: o `useAsync` aborta a requisição com `AbortController`, o `useDebouncedValue` cancela o timer, o `useDocumentTitle` restaura o título, o `AuthProvider` cancela o timer da expiração e tira o ouvinte do `visibilitychange`, e ele e o `CartProvider` tiram o do `storage`. O `ScrollToTop` lê o tipo da navegação com `useEffectEvent`, sem torná-lo dependência. | `src/hooks/`, `src/lib/storage.ts` (`onStorageKeyChange`), `src/features/auth/context/AuthProvider.tsx`, `src/features/cart/context/CartProvider.tsx`, `src/app/ScrollToTop.tsx` |

### 3. Estado global com Context API e Custom Hooks

| Subitem                                                           | Como foi resolvido                                                                                                                                                                                                                                                                                                                                             | Evidência                                                                                                                                             |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 Contextos globais para dados compartilhados                   | A sessão (`AuthContext`) e o carrinho (`CartContext`) valem para toda a aplicação, com o `value` memoizado; os dois ficam salvos no navegador, validados com Zod, e acompanham as outras abas. No admin, o `AdminProductsContext` guarda as alterações simuladas e os filtros da tabela. O tema claro ou escuro fica no contexto do próprio `MantineProvider`. | `src/features/auth/context/`, `src/features/cart/context/`, `src/features/admin-products/context/`, `src/lib/*-storage.ts`, `src/lib/auth-session.ts` |
| 3.2 Custom hook dedicado, que avisa quando usado fora do Provider | `useAuth`, `useCart` e `useAdminProducts` lançam um erro claro fora do Provider correspondente, e cada um tem um teste para isso.                                                                                                                                                                                                                              | `src/features/*/hooks/use{Auth,Cart,AdminProducts}.ts` e os testes ao lado                                                                            |

### 4. Roteamento e layouts com React Router

| Subitem                                                                           | Como foi resolvido                                                                                                                                                                                                                                                                                                                                   | Evidência                                                                                                         |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 4.1 Rotas declarativas                                                            | `BrowserRouter` com `basename` e rotas declarativas com layout routes, redirecionamentos com `<Navigate replace>` e página de não encontrado. O admin fica sob o guard `RequireAuth` e carrega sob demanda com `React.lazy` e `Suspense`.                                                                                                            | `src/main.tsx`, `src/app/AppRoutes.tsx`, `src/routes/`                                                            |
| 4.2 Layout com cabeçalho e navegação persistentes, com as páginas no `<Outlet />` | O `PublicLayout` (cabeçalho, navegação e menu do celular) e o `AdminLayout` (cabeçalho e barra lateral) continuam montados entre as páginas, que entram no `<Outlet />`.                                                                                                                                                                             | `src/layouts/PublicLayout.tsx`, `src/layouts/AdminLayout.tsx`                                                     |
| 4.3 `<NavLink>` com rota ativa, `useNavigate()` e `useParams()`                   | O `AppNavLink` usa o `NavLink`, que marca a rota ativa com `aria-current="page"`, destacada pelo CSS Module. O `useNavigate` volta no detalhe do produto, leva ao login no "Finalizar compra", sai da área protegida no Sair e volta à tabela depois de salvar no admin. O `useParams` lê o id em `/produtos/:id` e em `/admin/produtos/:id/editar`. | `src/components/AppNavLink.tsx`, `ProductDetailsPage.tsx`, `CartPage.tsx`, `useSignOut.ts`, `ProductFormPage.tsx` |

### 5. Interface gráfica e formulários com Mantine UI

| Subitem                                                                                           | Como foi resolvido                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Evidência                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5.1 `MantineProvider` e tema                                                                      | `MantineProvider` com tema próprio (cor primária e raio), tema claro ou escuro salvo no navegador e as notificações do `@mantine/notifications`.                                                                                                                                                                                                                                                                                                                         | `src/app/App.tsx`, `src/app/theme.ts`, `src/components/ColorSchemeToggle.tsx`                                                                                                      |
| 5.2 Layouts responsivos com os componentes do Mantine                                             | `AppShell` com `Burger` e `Drawer` na área pública e com barra lateral recolhível no admin; grade de `Card` com `SimpleGrid`; `Grid` no carrinho e no detalhe; tabela do admin num contêiner com rolagem horizontal. No celular, o carrinho fica no cabeçalho e o restante vai para o menu.                                                                                                                                                                              | `src/layouts/`, `ProductGrid.tsx`, `CartPage.tsx`, `ProductsTable.tsx`                                                                                                             |
| 5.3 Formulários com `@mantine/form`, listagens e tabelas com paginação e feedback de carregamento | Login e produto com `@mantine/form` e o `zodResolver`, com `TextInput`, `PasswordInput`, `Textarea`, `Select`, `NumberInput` e `TagsInput`. O catálogo em grade e o admin em `Table` têm `Pagination` com rótulos em pt-BR (`PaginationNav`). O carregamento aparece com os esqueletos de `Skeleton` que as páginas passam ao `AsyncContent`, com o `LoadingOverlay` dele ao recarregar, com `Loader` no carregamento sob demanda e com os botões em loading nos envios. | `LoginForm.tsx`, `ProductForm.tsx`, `src/components/PaginationNav.tsx`, `src/components/AsyncContent.tsx`, `ProductGridSkeleton.tsx`, `ProductsTable.tsx`, `src/app/AppRoutes.tsx` |

### 6. Fluxo de autenticação JWT e rotas protegidas

| Subitem                                                                                   | Como foi resolvido                                                                                                                                                                                                                                                                                                                  | Evidência                                                                                                                    |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 6.1 Tela de login com o `POST /auth/login`                                                | A `LoginPage` usa o `LoginForm`, que envia as credenciais pelo service de login. No 400, mostra "Usuário ou senha inválidos."; no sucesso, volta à página de origem.                                                                                                                                                                | `src/features/auth/pages/LoginPage.tsx`, `src/features/auth/components/LoginForm.tsx`, `src/services/auth.service.ts`        |
| 6.2 Token persistido, status no contexto global e área administrativa bloqueada sem login | A sessão (token, vencimento lido do `exp` do JWT e usuário) fica no `localStorage`, validada com Zod. O `AuthProvider` a expõe no contexto e a encerra ao vencer, ao voltar à aba e no 401, e acompanha as outras abas. O `RequireAuth` bloqueia o `/admin` sem sessão e leva ao login com a origem, validada contra open redirect. | `src/lib/auth-session.ts`, `src/features/auth/context/AuthProvider.tsx`, `src/routes/RequireAuth.tsx`, `src/lib/redirect.ts` |

### 7. Consumo de API REST, interceptors e validação com Zod

| Subitem                                                                                                       | Como foi resolvido                                                                                                                                                                                                                                                                                                                                              | Evidência                                                                                                        |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| 7.1 Axios centralizado em `src/services/api.ts`, com `baseURL` e os estados de carregamento, sucesso e erro   | A instância tem `baseURL: 'https://dummyjson.com'` e timeout, e o `axios` só pode ser importado em `src/services` (regra do lint). O `useAsync` (leituras) e o `useAsyncAction` (envios) expõem o estado explícito (`idle`, `loading` ou `pending`, `success` e `error`), e o `AsyncContent` mostra o carregamento, o erro com "Tentar novamente" e o conteúdo. | `src/services/api.ts`, `src/hooks/useAsync.ts`, `src/hooks/useAsyncAction.ts`, `src/components/AsyncContent.tsx` |
| 7.2 Interceptor de request com o Bearer e de response com falhas amigáveis                                    | O de request injeta `Authorization: Bearer <token>` nas rotas `/auth/*`, menos no próprio `/auth/login`. O de response converte toda falha em `AppError`, com mensagem em pt-BR, avisa o fim da sessão no 401 e manda as falhas de rede, tempo esgotado, 5xx e 429 para a notificação global.                                                                   | `src/services/api.ts`, `src/services/http-error.ts`, `src/lib/errors.ts`, `src/app/HttpErrorNotifier.tsx`        |
| 7.3 Schemas com `z.object`, tipos com `z.infer`, `.safeParse()` nas respostas e `zodResolver` nos formulários | Os schemas `z.object` geram os tipos com `z.infer`. Toda resposta passa por `.safeParse` no `parseResponse` e vira erro amigável se o contrato mudar. Os formulários de login e de produto usam o `zodResolver`, com mensagens em pt-BR. A URL, o id da rota e o storage também são validados.                                                                  | `src/schemas/`, `src/services/parse-response.ts`, `src/lib/forms/zodResolver.ts`                                 |

### 8. Testes automatizados com Vitest e RTL

| Subitem                                                                  | Como foi resolvido                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Evidência                                                   |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 8.1 Testes unitários e de componentes com Vitest e React Testing Library | Testes ao lado do código para schemas, services, hooks, componentes, layouts, rotas e páginas, com jsdom e jest-dom. A cobertura tem thresholds, conferidos no `yarn verify` e no CI.                                                                                                                                                                                                                                                                                                                   | `src/**/*.test.ts(x)`, `vitest.config.ts`                   |
| 8.2 Consultas acessíveis, `user-event` e wrappers de contexto em memória | As consultas priorizam papel e nome (`getByRole`, `getByText`), e as interações usam `userEvent.setup()`. As exceções são pontuais: o `fireEvent` onde o relógio do debounce precisa de controle exato e a contagem dos cards do esqueleto, que fica fora da árvore acessível. O `renderWithProviders` monta o Mantine, um `MemoryRouter` e os providers de sessão e carrinho, que podem começar com dados no storage do jsdom. O HTTP é simulado pelo MSW, e uma requisição sem handler falha o teste. | `src/test/render.tsx`, `src/test/msw/`, `src/test/setup.ts` |

### 9. Testes ponta a ponta com Playwright

| Subitem                                                               | Como foi resolvido                                                                                                                                                                                                                                                                                                                       | Evidência                                               |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 9.1 Playwright com pelo menos dois fluxos completos em navegador real | Quatro fluxos no Chromium, contra o build de produção: o catálogo, o carrinho com o checkout, a autenticação com redirecionamento e a gestão de produtos. Há também os testes do tema e o smoke, que depois do deploy roda contra o site publicado. A API é mockada por uma fixture automática, e uma requisição sem mock falha o teste. | `playwright.config.ts`, `e2e/*.spec.ts`, `e2e/support/` |
| 9.2 Localizadores semânticos e execução em modo headless              | As interações e as conferências usam `getByRole`, `getByLabel` e `getByText`. Seletores CSS só aparecem no que não tem papel acessível: a meta `app-version`, o atributo de tema do `html` e a cor de fundo do `body`. Os testes rodam em modo headless, localmente e no CI.                                                             | `e2e/`                                                  |

### 10. Pipeline de CI/CD e deploy em produção

| Subitem                                                                                                     | Como foi resolvido                                                                                                                                                                                             | Evidência                                                         |
| ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 10.1 CI com checkout, setup do Node, `yarn install --frozen-lockfile`, Vitest e Playwright a cada push e PR | O `ci.yml` roda em todo push e em todo PR para a `main`: checkout, Node do `.nvmrc`, `yarn install --frozen-lockfile`, lint, formatação, typecheck, Vitest com cobertura, build e, no job `e2e`, o Playwright. | `.github/workflows/ci.yml`                                        |
| 10.2 CD com build e deploy automatizado no GitHub Pages, com o repositório público                          | A cada push na `main`, o `deploy.yml` roda o CI como portão, faz o build, publica no GitHub Pages, espera a nova versão ficar no ar e roda o smoke em produção. O repositório é público.                       | `.github/workflows/deploy.yml`                                    |
| 10.3 `base` no `vite.config.ts` e fallback de SPA (404.html)                                                | `base: '/dummy/'` e um plugin que copia o `index.html` para o `404.html` no build. O CI confere a cópia, e o smoke testa o deep link e o recarregamento no site publicado.                                     | `vite.config.ts`, `.github/workflows/ci.yml`, `e2e/smoke.spec.ts` |
| 10.4 Proteção da `main`, com PR obrigatório e os testes de CI aprovados antes do merge                      | Ruleset ativo na `main`: PR obrigatório, checks `verify`, `e2e` e `pr-title` exigidos, merge só por squash e exclusão e force push bloqueados. As evidências estão em [Proteção da main](#proteção-da-main).   | ruleset `main` no GitHub                                          |

## Testes

- **Unitários e de componentes:** Vitest 5 com jsdom, React Testing Library e jest-dom. As interações usam user-event, que também roda com fake timers no debounce da busca. Os testes ficam ao lado do código (`*.test.ts(x)`) e usam consultas acessíveis (`getByRole`, `getByText`). Rode com `yarn test`.
- **HTTP simulado:** o MSW 2 intercepta as requisições do Axios. Os handlers padrão respondem com fixtures capturadas da API (tokens sintéticos, sem dados sensíveis) e uma requisição sem handler falha o teste. O POST e o PUT de produtos devolvem o corpo enviado, como a API. Os schemas têm testes de contrato contra essas fixtures.
- **Cobertura:** `yarn test:coverage` (v8) com thresholds de 80/80/80/70 (linhas, statements, funções, branches) no geral e 90/90/90/85 em `lib`, `services`, `hooks` e `schemas`. O relatório HTML fica em `coverage/` e o CI o publica como artefato.
- **Ponta a ponta:** Playwright em modo headless contra o build de produção servido em `/dummy/`, com a API mockada. Uma fixture automática (`e2e/support/test.ts`) responde à DummyJSON com as mesmas fixtures dos testes unitários, validadas com os schemas, troca as imagens do CDN por um PNG transparente e bloqueia os outros hosts; uma requisição sem mock falha o teste. Como a API, o mock não guarda estado: as escritas do admin respondem, mas não mudam as leituras. Rode com `yarn test:e2e`.
  - `e2e/catalog.spec.ts`: o fluxo do catálogo (busca, categoria, página, detalhe, Voltar e recarregamento, com o estado na URL), o celular (o carrinho com o contador no cabeçalho e o resto no menu) e o produto inexistente.
  - `e2e/cart.spec.ts`: o carrinho (adicionar pelo detalhe, o contador do cabeçalho, alterar a quantidade, remover com o foco indo para o item que ficou e recarregar mantendo os itens) e o checkout: sem login, "Finalizar compra" leva ao login, que volta ao carrinho; com login, o pedido é confirmado e o carrinho fica vazio.
  - `e2e/auth.spec.ts`: o `/admin` sem sessão leva ao login, que mostra o erro de credenciais e, depois de entrar, abre a gestão de produtos com o nome no cabeçalho do admin, cujo Sair volta ao catálogo; o Entrar do cabeçalho volta à página em que a pessoa estava; uma sessão salva vencida leva ao login, com aviso.
  - `e2e/admin-products.spec.ts`: o cadastro (a imagem fora de https é recusada), a edição de um produto do servidor e as duas exclusões (a do item criado aqui não chama a API; a do servidor manda o DELETE), mantidas ao recarregar; a busca e a página preservadas na ida ao formulário e na volta; e o descarte, que volta aos dados da API, e o Sair, que apaga as alterações.
  - `e2e/theme.spec.ts`: o seletor troca o tema, que continua ao recarregar; sem escolha salva, vale o tema do sistema já antes de o React montar; e a escolha salva vale mais que o sistema.
  - `e2e/smoke.spec.ts`: a home, que redireciona para o catálogo e lista os produtos (inclusive a meta `app-version`), o cabeçalho com a navegação ativa, um deep link de produto com recarregamento, uma rota desconhecida e o 404.html gerado no build. Ele confere a estrutura das páginas, não os dados, porque também roda em produção.
- Depois de cada deploy, o smoke roda contra o site publicado e a API real, assim que a meta `app-version` mostra o commit do deploy (o CDN do Pages guarda o HTML por até 10 minutos). Lá o deep link responde HTTP 404 (o GitHub Pages serve o 404.html) e a aplicação abre a rota pedida.
- **Contrato com a API real:** `src/services/api.contract.test.ts` chama a DummyJSON de verdade pelos services, que validam cada resposta com os schemas da aplicação: listagem, busca, categoria, detalhe, categorias, login, leituras e escritas do admin e checkout. Roda com `yarn test:contract` e no job semanal `contract`, fora do `yarn test` e do `verify`.

## CI/CD, deploy e proteção da main

- **CI** (`.github/workflows/ci.yml`): a cada push, em qualquer branch, e a cada pull request para a `main`. O job `verify` roda instalação com `yarn install --frozen-lockfile`, lint, formatação, typecheck, testes unitários com cobertura (o relatório vira o artefato `coverage`), build e checagem do 404.html. O job `e2e` roda o Playwright com a API mockada. O Node vem do `.nvmrc`.
- **Deploy** (`.github/workflows/deploy.yml`): a cada push na `main` (ou à mão), roda o CI completo, faz o build, publica no GitHub Pages, espera a nova versão ficar no ar e executa o smoke em produção.
- **Título do PR** (`.github/workflows/pr-title.yml`): o job `pr-title` confere se o título do PR, que vira a mensagem do squash, segue o Conventional Commits.
- **Contrato** (`.github/workflows/contract.yml`): à mão ou toda segunda-feira, o job `contract` roda os testes de contrato com a API real. Ele não roda em push nem em PR e não é check exigido, então nunca bloqueia o merge.
- **Dependabot:** atualiza semanalmente as GitHub Actions (fixadas por SHA), respeitando 7 dias de espera após cada versão.

### Proteção da main

O [ruleset `main`](https://github.com/WiuDev/dummy/rules/24546730) está ativo na branch padrão, com estas regras:

- pull request obrigatório (sem exigir aprovação de revisor);
- os checks `verify`, `e2e` e `pr-title` aprovados antes do merge;
- merge só por squash;
- exclusão da branch e force push bloqueados.

Evidências:

- **PR com os checks obrigatórios:** o [#10](https://github.com/WiuDev/dummy/pull/10), da gestão de produtos, só foi integrado com `verify`, `e2e` e `pr-title` aprovados (veja a [aba Checks](https://github.com/WiuDev/dummy/pull/10/checks)).
- **PR barrado pelo `pr-title`:** o [#3](https://github.com/WiuDev/dummy/pull/3) foi aberto com o título "Feat/fase 2 nucleo dados", fora do padrão, e o check reprovou o título ([execução](https://github.com/WiuDev/dummy/actions/runs/37400942238)). Ele foi fechado e refeito como [#4](https://github.com/WiuDev/dummy/pull/4), com o título "feat: adiciona o núcleo de dados (fase 2)".

## Convenções

- Conventional Commits, com tipo em inglês e descrição em pt-BR; branches curtas integradas por PR com squash.
- Oxlint (type-aware) para lint, Prettier para formatação e finais de linha LF em todos os arquivos de texto.
- Código (identificadores, arquivos e pastas) em inglês; interface, rotas e documentação em pt-BR.

## Uso de IA

- **Planejamento e revisão:** conduzidos pelo aluno com o apoio de uma IA conversacional (Claude), usada para escrever os prompts de cada etapa e auditar os relatórios.
- **Implementação, testes e documentação:** feitos por um agente de IA no editor (Claude Code), seguindo o [AGENTS.md](AGENTS.md).
- **Publicação:** o aluno fez o push, os PRs, os merges e as configurações do GitHub e validou o site publicado.
- **Processo:** ciclos de plano, implementação, testes e publicação, com revisão humana antes de cada push e o CI como portão de qualidade.

Exemplos em que a revisão mudou o rumo:

- **Política de versões:** uma versão só é adotada 7 dias depois de publicada, salvo correção de segurança (o escopo exato está no AGENTS.md).
- **Título dos PRs:** depois de squashes com mensagens fora do padrão, entrou o check `pr-title`, que valida o Conventional Commits antes do merge.
- **Ruleset:** os checks exigidos foram corrigidos para os nomes exatos dos jobs (`verify`, `e2e` e `pr-title`).
- **Busca do admin:** a busca sobre as alterações simuladas passou a seguir o critério da API (título ou descrição), para o total da tabela bater com o da DummyJSON.

Limites: todo código gerado passou por lint, typecheck, testes e CI. As decisões e as limitações estão registradas no [AGENTS.md](AGENTS.md) e neste README.

## Créditos

- Dados: [DummyJSON](https://dummyjson.com).
- Ícones: [Tabler Icons](https://tabler.io/icons) (MIT), também no favicon.
