# MouseTrap — API

API REST do MouseTrap, um e-commerce especializado em mouses. O catálogo permite gerenciar marcas e produtos, com especificações técnicas, múltiplos tipos de conexão, preço e estoque.

## Funcionalidades

- Cadastro, consulta, edição e exclusão de marcas e mouses.
- Paginação e filtro server-side por nome nas listagens administrativas.
- Validação de dados e unicidade de nomes de marcas e SKUs.
- Proteção contra exclusão de marcas vinculadas a produtos.
- Controle de versão na edição de mouses para detectar alterações concorrentes.
- Respostas de erro padronizadas e documentação OpenAPI.

A versão atual contempla a administração do catálogo. Autenticação, lista de desejos, pedidos e pagamentos estão no [planejamento do domínio](docs/modelagem/README.md). O carrinho está previsto como estado local do frontend.

## Tecnologias e arquitetura

Java 17, Quarkus 3, Hibernate ORM com Panache, PostgreSQL, Flyway, Jackson e Bean Validation. As versões das dependências são definidas no [pom.xml](pom.xml).

O backend organiza as responsabilidades em recursos REST, serviços, repositórios e entidades. DTOs de entrada e resposta usam records; conversores persistem os IDs explícitos dos enums.

```text
src/main/java/br/unitins/tp2/
├── model/        Entidades, enums e conversores JPA
├── repository/   Consultas e persistência com Panache
├── dto/          Contratos de entrada e resposta
├── service/      Regras de negócio e transações
├── resource/     Endpoints REST
└── exception/    Tratamento centralizado de erros
```

## Desenvolvimento local

Requisitos: JDK 17 com `JAVA_HOME` configurado e PostgreSQL 16. Os comandos abaixo são executados na pasta `api`.

Crie a configuração local a partir do exemplo, caso ela ainda não exista:

```bash
test -f src/main/resources/application.properties || cp src/main/resources/application.properties.example src/main/resources/application.properties
```

Ajuste usuário, senha e URL do banco em `src/main/resources/application.properties`. Esse arquivo é ignorado pelo Git. A configuração de referência está em [application.properties.example](src/main/resources/application.properties.example).

```bash
./mvnw quarkus:dev
```

A API estará disponível em `http://localhost:8080`. No modo de desenvolvimento, o Swagger UI fica em `/q/swagger-ui` e o Dev UI em `/q/dev`. O CORS permite a origem `http://localhost:4200`, com credenciais e os métodos GET, PUT, POST, DELETE, PATCH e OPTIONS.

## Banco de dados

O Flyway aplica as migrations de [src/main/resources/db/migration](src/main/resources/db/migration). O Hibernate valida o esquema na inicialização, sem recriar tabelas. A migration inicial cria `marca`, `mouse` e `mouse_conexao`, com chaves, índices e restrições de integridade.

A primeira inicialização deve usar um banco vazio. Para adotar um banco com tabelas existentes, revise sua compatibilidade com as migrations antes de executá-las. Novas mudanças de esquema devem ser versionadas em novas migrations; arquivos já aplicados não devem ser modificados.

## Testes

Os testes HTTP usam `@QuarkusTest` e um PostgreSQL isolado, configurado em [CatalogoTestProfile](src/test/java/br/unitins/tp2/resource/CatalogoTestProfile.java). Com Docker disponível:

```bash
docker run --detach --rm --name ecommerce-mouses-crud-tests --publish 127.0.0.1:55439:5432 --env POSTGRES_USER=ecommerce_test --env POSTGRES_PASSWORD=ecommerce_test --env POSTGRES_DB=ecommerce_test postgres:16-alpine
docker exec ecommerce-mouses-crud-tests pg_isready -U ecommerce_test -d ecommerce_test
```

Quando o banco estiver aceitando conexões:

```bash
./mvnw clean verify
```

A suíte cobre operações do catálogo, validações, paginação e filtro de marcas, registros inexistentes, vínculos entre marca e mouse, conflitos de versão e CORS. A configuração atual usa `skipITs=true` para Failsafe; os testes HTTP executam pelo Surefire.

### Continuous testing and database availability

The HTTP test profile also runs during continuous testing in `./mvnw quarkus:dev`.
Keep the test database container running while using this mode. It is separate
from the development database on port 5432.

If startup fails with `Connection to localhost:55439 refused`, check
`docker ps --filter name=ecommerce-mouses-crud-tests` and start the test database
with the `docker run` command above if it is missing. Wait until `pg_isready`
reports that connections are accepted, then press `r` in the Quarkus terminal
to rerun the tests. The `--rm` option removes the container when it stops, so
`docker start` cannot restore it afterward; use `docker run` again.

Stop the disposable database only after ending the test session, including
continuous testing:

```bash
docker stop ecommerce-mouses-crud-tests
```

## Build

`./mvnw clean verify` também gera a aplicação em `target/quarkus-app`. O diretório completo é necessário para executá-la:

```bash
java -jar target/quarkus-app/quarkus-run.jar
```

## Documentação

- [Catálogo: contratos e regras de negócio](docs/catalogo.md).
- [Modelo de dados e diagrama de classes](docs/modelagem/README.md).

Os endpoints administrativos ainda não exigem autenticação. O controle de acesso deve ser implementado antes de disponibilizá-los publicamente.

## Clientes e consulta por CEP

Cadastro, edição, listagem e exclusão de clientes com endereço estruturado em Município e Estado, preenchimento por ViaCEP e validações nos dois lados. [Contratos, arquitetura, migration e avaliação](docs/clientes-cep.md).

## Public catalog, product images and gaming specifications

The second storefront slice is implemented. Public browsing uses
`GET /catalogo/mouses`, `GET /catalogo/mouses/{id}` and `GET /catalogo/filtros`.
It supports active-product/active-brand visibility, combined filters, safe sorting
and pagination. The existing administrative CRUD contracts are preserved. Mouse
payloads additionally accept optional `especificacoes` and `imagens` groups.

Migration V3 adds product images and gaming specifications without modifying V1/V2
or inventing values for existing products. Images are managed by URL and inherit
entity audit fields; gallery edits use the mouse's optimistic version check.
Authentication, orders, wishlist and payments remain future slices. The current
image/gallery behavior supersedes older statements describing images as planned.

See [Public catalog contracts, migration and validation](../docs/public-catalog.md).
