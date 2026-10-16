# MouseTrap — Web

Interface administrativa do MouseTrap para gerenciar o catálogo de marcas e mouses. A aplicação permite cadastrar produtos, editar especificações e preços, acompanhar o estoque e controlar a disponibilidade dos registros.

## Funcionalidades

- Listagens com ações de edição e exclusão.
- Formulários de criação e edição com validações.
- Seleção da marca e de múltiplos tipos de conexão de cada mouse.
- Carregamento dos registros antes da edição por route resolvers.
- Confirmação de exclusão, mensagens de erro e notificações de sucesso.
- Layout responsivo e formatação monetária em reais.

O carrinho está previsto como estado local do frontend. Lista de desejos, checkout e autenticação fazem parte da evolução do produto e ainda não estão disponíveis.

## Tecnologias

Angular 22 com componentes standalone, Angular Material, Reactive Forms, HttpClient e Vitest. As versões e o gerenciador de pacotes estão definidos em [package.json](package.json); [package-lock.json](package-lock.json) registra as dependências resolvidas.

## Desenvolvimento local

Requisitos: Node.js compatível com a versão Angular do projeto, npm e a API em execução em `http://localhost:8080`. Execute os comandos na pasta `web`:

```bash
npm ci
npm start
```

Abra `http://localhost:4200`. Cadastre uma marca antes de cadastrar o primeiro mouse.

| Página | Rota |
| --- | --- |
| Marcas | `/marcas` |
| Nova marca | `/marcas/novo` |
| Editar marca | `/marcas/editar/:id` |
| Mouses | `/mouses` |
| Novo mouse | `/mouses/novo` |
| Editar mouse | `/mouses/editar/:id` |

As telas são carregadas por rota. Os serviços em `src/app/services` definem a URL local da API.

## Organização do código

```text
src/app/
├── components/
│   ├── marcas/    Listagem e formulário de marcas
│   └── mouses/    Listagem e formulário de mouses
├── models/       Interfaces de entidades, DTOs e tipos de conexão
├── services/     Comunicação HTTP e tratamento de erros
├── resolvers/    Carregamento dos registros para edição
├── app.routes.ts
└── app.config.ts
```

## Testes e build

```bash
npm test -- --watch=false
npm run build
```

Os testes usam Vitest e cobrem navegação, formulários, exclusão e tratamento de falhas. O build gera os arquivos em `dist/web`, com o conteúdo estático em `dist/web/browser`. A otimização das fontes referenciadas em `src/index.html` requer acesso aos serviços de fontes do Google.

Ao hospedar a SPA, configure o servidor para servir `index.html` nas rotas da aplicação. A URL da API e sua política de CORS devem corresponder ao ambiente de hospedagem. O acesso administrativo ainda não possui autenticação.

## Documentação

Na estrutura com `api` e `web` lado a lado:

- [API: execução e testes](../api/README.md).
- [Catálogo: contratos e regras de negócio](../api/docs/catalogo.md).
- [Modelagem em PlantUML](../api/docs/modelagem/README.md).
