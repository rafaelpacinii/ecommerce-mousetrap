# Ambiente de desenvolvimento — MouseTrap

O MouseTrap é um e-commerce especializado em mouses, com API REST em Quarkus e interface Angular. Este guia descreve a preparação do ambiente para executar o código existente.

## Estrutura

```text
ecommerce-mouses/
├── api/    Backend Quarkus e documentação do domínio
└── web/    Frontend Angular
```

O projeto é organizado como um **Monorepo** unificado contendo o backend (`api/`), o frontend (`web/`), scripts de automação (`scripts/`) e configurações de agentes (`.github/agents/`, `.agents/rules/`).

## Pré-requisitos

- JDK 17 com `JAVA_HOME` configurado.
- Node.js compatível com Angular 22 e npm conforme o `packageManager` de `web/package.json`.
- PostgreSQL 16 ou Docker para executar o banco localmente.

O backend inclui o Maven Wrapper; o frontend utiliza a CLI instalada nas dependências do projeto. As versões das dependências estão em `api/pom.xml`, `web/package.json` e `web/package-lock.json`.

## PostgreSQL local

Se ainda não houver um banco de desenvolvimento disponível, o comando abaixo cria um container com volume persistente. As credenciais correspondem ao arquivo de configuração de exemplo e são destinadas ao ambiente local.

```bash
docker run --detach --name mouse-store-postgres --publish 127.0.0.1:5432:5432 --env POSTGRES_DB=db --env POSTGRES_USER=dbuser --env POSTGRES_PASSWORD=dbpasswd --volume mouse-store-postgres-data:/var/lib/postgresql/data postgres:16-alpine
docker exec mouse-store-postgres pg_isready -U dbuser -d db
```

Aguarde o banco aceitar conexões. Se já houver um PostgreSQL na porta 5432, utilize uma base dedicada nessa instância ou escolha outra porta e ajuste a URL JDBC.

## Backend

A partir da raiz do projeto:

```bash
cd api
test -f src/main/resources/application.properties || cp src/main/resources/application.properties.example src/main/resources/application.properties
```

Configure a conexão com o PostgreSQL no arquivo local. Flyway gerencia as migrations e Hibernate valida o esquema; a primeira execução deve usar uma base vazia. Não versione credenciais locais.

```bash
./mvnw quarkus:dev
```

A API fica em `http://localhost:8080`; o Swagger UI fica em `http://localhost:8080/q/swagger-ui` no modo de desenvolvimento.

## Frontend

Em outro terminal, a partir da raiz:

```bash
cd web
npm ci
npm start
```

Abra `http://localhost:4200`. Cadastre uma marca e, em seguida, um mouse vinculado a ela. A API permite essa origem pela configuração de CORS.

## Testes e documentação

- [API: arquitetura, banco, testes e build](api/README.md).
- [Web: organização, rotas, testes e build](web/README.md).
- [Catálogo: contratos e regras de negócio](api/docs/catalogo.md).
- [Modelagem do banco e diagrama de classes em PlantUML](api/docs/modelagem/README.md).

Os testes da API usam um PostgreSQL separado na porta 55439. Sua configuração e os comandos de execução estão no README do backend.
