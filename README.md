# Loja Dummy

> **Aplicação no ar:** https://wiudev.github.io/dummy/ (em breve; o deploy entra na Fase 1)

Catálogo e compras em React + TypeScript que consome a API pública [DummyJSON](https://dummyjson.com). Tem uma área pública de navegação e uma área administrativa protegida por login.

> Projeto em desenvolvimento. Fase atual: **0 (Fundação)**, com ferramentas, padrões e documentação.

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

Depois acesse http://localhost:5173/.

## Scripts

| Comando                             | O que faz                                             |
| ----------------------------------- | ----------------------------------------------------- |
| `yarn dev`                          | Servidor de desenvolvimento                           |
| `yarn build`                        | Checagem de tipos (`tsc -b`) + build de produção      |
| `yarn preview`                      | Serve o build em http://localhost:4173/               |
| `yarn typecheck`                    | Checagem de tipos                                     |
| `yarn lint` / `yarn lint:fix`       | Oxlint com regras type-aware (warnings também falham) |
| `yarn format` / `yarn format:check` | Prettier                                              |
| `yarn run check`                    | lint + format:check + typecheck + build               |

> Use `yarn run check`: `yarn check`, sem `run`, é um comando interno do Yarn 1 e não executa o script.

## Arquitetura

Organização em camadas (`app`, `layouts`, `routes`, `features`, `components`, `hooks`, `services`, `schemas`, `lib`), com regras de import validadas pelo lint. O detalhe está em [AGENTS.md](AGENTS.md#arquitetura-e-regras-de-import).

Estado atual:

```text
src/
├─ main.tsx     # ponto de entrada (createRoot + StrictMode)
└─ app/
   └─ App.tsx   # composição da aplicação (mínima na Fase 0)
```

## Decisões e limitações da API

- A DummyJSON **simula** as escritas (POST, PUT, PATCH e DELETE) e não persiste nada. No admin, as alterações valerão só na sessão e serão sinalizadas como simuladas.
- A API não combina a busca textual com o filtro por categoria; com os dois ativos, a combinação será feita no cliente.
- O token (`accessToken`) expira em 60 minutos por padrão e não haverá refresh token; ao expirar, a sessão é encerrada.
- Os preços vêm em dólar (USD) e serão exibidos no formato pt-BR.

## Checklist dos 10 requisitos

| #   | Requisito                                             | Status   | Como foi resolvido |
| --- | ----------------------------------------------------- | -------- | ------------------ |
| 1   | Estrutura de componentes e tipagem com TypeScript     | pendente | —                  |
| 2   | Estado reativo, imutabilidade e ciclo de vida         | pendente | —                  |
| 3   | Estado global com Context API e Custom Hooks          | pendente | —                  |
| 4   | Roteamento e layouts com React Router                 | pendente | —                  |
| 5   | Interface gráfica e formulários com Mantine UI        | pendente | —                  |
| 6   | Fluxo de autenticação JWT e rotas protegidas          | pendente | —                  |
| 7   | Consumo de API REST, interceptors e validação com Zod | pendente | —                  |
| 8   | Testes automatizados com Vitest e RTL                 | pendente | —                  |
| 9   | Testes ponta a ponta com Playwright                   | pendente | —                  |
| 10  | Pipeline de CI/CD e deploy em produção                | pendente | —                  |

## Testes

Em breve, a partir da Fase 1: testes unitários e de componentes com Vitest, React Testing Library e MSW, e testes ponta a ponta com Playwright (headless) contra o build de produção.

## CI/CD, deploy e proteção da main

Em breve, na Fase 1: workflow de CI (lint, tipos, Vitest e Playwright a cada push e pull request), workflow de deploy no GitHub Pages e regras de proteção da branch `main`.

## Convenções

- Conventional Commits, com tipo em inglês e descrição em pt-BR; branches curtas integradas por PR com squash.
- Oxlint (type-aware) para lint, Prettier para formatação e finais de linha LF em todos os arquivos de texto.
- Código (identificadores, arquivos e pastas) em inglês; interface, rotas e documentação em pt-BR.

## Uso de IA

O projeto é desenvolvido com apoio de IA (Claude Code) em etapas com aprovação humana: planejamento, implementação por fases, testes e publicação. Cada fase só começa depois que o plano é aprovado, e cada entrega passa por revisão antes do merge. Esta seção será detalhada ao final, com o que foi gerado, o que foi revisado e ajustado manualmente e os limites encontrados.

## Créditos

- Dados: [DummyJSON](https://dummyjson.com).
