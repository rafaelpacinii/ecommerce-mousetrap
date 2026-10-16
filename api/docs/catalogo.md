# Catálogo de produtos

O catálogo do MouseTrap organiza marcas e mouses para administração dos produtos da loja. Cada mouse possui um SKU único, uma marca, especificações técnicas, preço e quantidade em estoque.

## Recursos

### Marcas

Uma marca possui nome e situação de disponibilidade. Nomes não podem se repetir, independentemente de maiúsculas e minúsculas. Uma marca vinculada a mouses não pode ser excluída; é possível desativá-la.

### Mouses

Cada registro representa um produto vendável identificado por SKU. Cores comercializadas separadamente possuem registros, preços e estoques próprios.

O cadastro inclui nome, descrição, cor, preço, quantidade em estoque, DPI máximo, quantidade de botões, peso em gramas, situação e marca. Um mouse pode suportar mais de um tipo de conexão simultaneamente.

| ID | Tipo de conexão |
| --- | --- |
| 1 | USB |
| 2 | Bluetooth |
| 3 | Receptor USB sem fio |

## Contratos HTTP

A URL base de desenvolvimento é `http://localhost:8080`. Os corpos de requisição e resposta usam JSON.

| Operação | Marca | Mouse | Sucesso |
| --- | --- | --- | --- |
| Listar | GET `/marcas` | GET `/mouses` | 200, array |
| Consultar | GET `/marcas/{id}` | GET `/mouses/{id}` | 200, objeto |
| Cadastrar | POST `/marcas` | POST `/mouses` | 201, objeto criado |
| Editar | PUT `/marcas/{id}` | PUT `/mouses/{id}` | 200, objeto atualizado |
| Excluir | DELETE `/marcas/{id}` | DELETE `/mouses/{id}` | 204, sem corpo |

### Cadastro de marca

```json
{ "nome": "Logitech", "ativo": true }
```

A resposta inclui `id`, `nome` e `ativo`.

### Cadastro de mouse

Exemplo considerando uma marca existente de ID 1:

```json
{
  "sku": "MOUSE-PRETO-001",
  "nome": "Mouse sem fio",
  "descricao": "Mouse com conexão USB e Bluetooth.",
  "cor": "Preto",
  "preco": 199.90,
  "quantidadeEstoque": 10,
  "dpiMaximo": 16000,
  "quantidadeBotoes": 6,
  "pesoGramas": 75.50,
  "ativo": true,
  "idMarca": 1,
  "tiposConexao": [1, 2]
}
```

A resposta inclui os campos comerciais, `id`, `versao`, `marca: {id, nome, ativo}` e `tiposConexao: [{id, label}]`. Os DTOs de entrada recebem os IDs de marca e conexões; as respostas incluem seus dados descritivos.

### Edição e concorrência

O PUT recebe todos os campos do cadastro. Para editar um mouse, envie também `versao` com o valor recebido na consulta mais recente. O backend verifica a versão e a atualiza ao persistir a alteração.

Se outra operação tiver modificado o produto, a edição retorna 409. Recarregue o registro antes de tentar novamente para evitar sobrescrever mudanças concorrentes.

## Regras de validação

- Nomes, descrição, cor e SKU têm espaços externos removidos; o SKU é armazenado em maiúsculas.
- O nome da marca é único ignorando caixa, e o SKU é único por produto.
- Estoque é inteiro e não negativo.
- Preço, peso, DPI máximo e quantidade de botões são positivos.
- Valores monetários e peso aceitam até duas casas decimais.
- A marca referenciada deve existir, e pelo menos uma conexão deve ser informada.
- O cadastro administrativo permite vincular marcas inativas. No fluxo de venda planejado, marca e mouse precisarão estar ativos.

As validações dos DTOs são complementadas por regras nos serviços e restrições no PostgreSQL.

## Respostas de erro

Erros de validação e regras de negócio retornam `application/problem+json`, com `type`, `title`, `status`, `detail`, `instance` e `errors`. Cada item de `errors` identifica o campo e sua mensagem.

| Status | Situação |
| --- | --- |
| 400 | Campos inválidos, duplicidade identificada pelo serviço ou exclusão de marca vinculada |
| 404 | Registro ou rota inexistente |
| 409 | Conflito de versão ou violação de integridade concorrente |

O frontend preserva os valores do formulário quando ocorre uma falha e apresenta a mensagem recebida.

## Persistência

A migration [V1__criar_catalogo.sql](../src/main/resources/db/migration/V1__criar_catalogo.sql) define as tabelas `marca`, `mouse` e `mouse_conexao`. Elas utilizam chaves primárias, referências, índices únicos e CHECKs para garantir a integridade dos dados.

`Marca` e `Mouse` herdam identidade e auditoria de `DefaultEntity`. `mouse_conexao` persiste a coleção de conexões por IDs explícitos de enum. O preço usa `BigDecimal` no Java e `numeric(12,2)` no PostgreSQL.

As regras de negócio ficam nos serviços, acessados pelos recursos REST. Repositórios encapsulam a persistência e os DTOs separam os contratos HTTP das entidades JPA.

## Evolução do domínio

O [modelo completo](modelagem/README.md) prevê imagens, usuários, endereços, lista de desejos, pedidos e pagamentos. Esses recursos ainda não fazem parte da implementação do catálogo. O carrinho será mantido no frontend; o checkout validará os itens, preços e estoque no backend.

Para configurar a API e executar sua suíte de testes, consulte o [README da API](../README.md).
