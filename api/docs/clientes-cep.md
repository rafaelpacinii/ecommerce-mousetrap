# Clientes e endereço por CEP

O MouseTrap permite cadastrar, listar, editar e excluir clientes do e-commerce. Cada cliente possui um endereço com CEP, logradouro, bairro, número, complemento opcional e uma referência a Município; cada Município referencia um Estado. Todas as entidades herdam a auditoria de DefaultEntity.

## Consulta e persistência

`GET /ceps/{cep}` recebe exatamente oito dígitos e consulta `https://viacep.com.br/ws/{cep}/json/`. A resposta contém `cep`, `logradouro`, `bairro`, `localidade`, `uf` e `ibge`. A consulta não grava dados. Formato inválido e CEP inexistente retornam 400 com erro no campo `cep`. Falha HTTP, conexão, timeout, JSON inválido ou resposta sem município/UF/IBGE retorna 503 em RFC 7807.

O cliente HTTP utiliza Java 17 HttpClient e Jackson, já disponível no projeto, sem nova dependência. O timeout de conexão é de 5 segundos e o de requisição é de 8 segundos. `viacep.url` configura a URL base, que deve terminar com `/`; o padrão é o ViaCEP. Os testes usam um servidor HTTP local com respostas controladas.

POST e PUT consultam o CEP novamente no backend. O município e o estado nunca são aceitos como identificadores informados pelo navegador: a UF local vem da tabela Estado e o Município é criado/reutilizado pelo código IBGE único retornado pela consulta. O repositório usa `ON CONFLICT DO NOTHING` para evitar duplicação de municípios em cadastros concorrentes.

A migration `V2__criar_clientes_enderecos.sql` cria `estado`, `municipio` e `cliente`, índices, chaves estrangeiras e as 27 UFs. É aditiva e não altera registros do catálogo. Flyway aplica a migration na próxima inicialização da API; Hibernate valida o esquema. Não foi aplicada ao banco de desenvolvimento durante a implementação.

## Contrato de cliente

- `GET /clientes`: lista de clientes com Município e Estado aninhados.
- `GET /clientes/{id}`: consulta individual; 404 quando inexistente.
- `POST /clientes`: cria; 201 com o cliente persistido.
- `PUT /clientes/{id}`: altera; 200 com o cliente persistido.
- `DELETE /clientes/{id}`: exclui somente o cliente; 204. Município e Estado permanecem compartilháveis.

Exemplo de entrada (mesmo contrato para POST/PUT):

```json
{
  "nome": "Cliente MouseTrap",
  "email": "cliente@example.com",
  "cep": "01001000",
  "logradouro": "Praça da Sé",
  "bairro": "Sé",
  "numero": "10",
  "complemento": "Apto 1"
}
```

Nome: obrigatório, 2–100 caracteres; e-mail: obrigatório, válido, até 254 caracteres e único após normalização para minúsculas. CEP: oito dígitos. Logradouro, bairro e número são obrigatórios, com limites de 200, 100 e 20 caracteres. Complemento é opcional, até 100 caracteres. Textos são aparados antes da validação no backend; campos com apenas espaços são rejeitados. E-mail repetido retorna 400; a restrição única no banco protege também contra concorrência, retornando 409.

Na resposta, `municipio` contém `id`, `nome`, `codigoIbge` e `estado` com `id`, `nome`, `sigla`. O cadastro não verifica a existência real de número, e-mail ou correspondência de bairro/logradouro; os últimos são editáveis para atender CEPs genéricos sem rua/bairro.

## Frontend e avaliação

Acesse `/clientes` pelo menu. O formulário Reactive Forms aceita CEP com ou sem hífen e consulta ao sair do campo ou pelo botão. Após a consulta, cidade e UF são exibidas sem edição, e rua/bairro podem ser completados. Informe número (ou `S/N`) e complemento quando necessário. Antes de cadastrar, é obrigatória uma consulta bem-sucedida. A edição carrega dados pelo resolver; o backend valida novamente o CEP ao salvar. Alterar o CEP cancela a requisição anterior e limpa os dados de endereço derivados; isso impede aplicar respostas atrasadas ao novo endereço.

Cadastro e edição dependem da disponibilidade do ViaCEP. Consulta, listagem e exclusão de clientes salvos não dependem dele. Não há CRUD administrativo de Município/Estado: são dados estruturados mantidos pelo fluxo de CEP.

Validação automática: `./mvnw clean verify` em `api`, com PostgreSQL de testes configurado conforme README; `npm test -- --watch=false` e `npm run build` em `web`. Testes cobrem CRUD, reutilização e mudança de município/UF, e-mail duplicado, campos inválidos, CEP inexistente, falhas externas e cancelamento de consultas no frontend. O build de produção requer acesso às fontes usadas pelo projeto. Não foi executada avaliação visual em navegador.

Referências adaptadas: [backend do professor](https://github.com/janiojunior/sga-tp2-2026), especialmente a relação Município → Estado; [frontend do professor](https://github.com/janiojunior/hello-world-angular), com formulários Reactive Forms, resolver e Material; [ViaCEP](https://viacep.com.br/), com CEP de oito dígitos, `erro: true` para inexistentes e código IBGE.

## Pacote de entrega

Na raiz contendo `api` e `web`, execute:

```bash
python3 api/scripts/gerar-pacote.py
```

O script gera `mousetrap-clientes-cep.zip` e sua listagem de conteúdo na raiz. Inclui fontes, testes, migrations, documentação, dependências e wrappers. Exclui Git, dependências instaladas, builds, Docker, arquivos de ferramentas e configuração local. Antes de executar o pacote, copie `application.properties.example` para `application.properties` e configure um PostgreSQL local conforme o README.
