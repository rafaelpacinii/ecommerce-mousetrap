# Modelagem do e-commerce de mouses

Modelo do domínio do MouseTrap. O catálogo de marcas e mouses está implementado; usuários, lista de desejos, pedidos, imagens e pagamentos representam etapas futuras. O carrinho é previsto exclusivamente no frontend.

## Diagramas em PlantUML

- [Modelo relacional do banco](banco-de-dados.puml): tabelas, tipos PostgreSQL, chaves, cardinalidades e restrições.
- [Diagrama de classes de domínio](diagrama-de-classes.puml): entidades Java, herança, associações, objetos de valor e enums.

Visualizações geradas: [banco em SVG](banco-de-dados.svg) e [classes em SVG](diagrama-de-classes.svg).

Os dois arquivos são independentes, sem includes ou serviços externos. A notação usa a documentação oficial de [relacionamentos de banco](https://plantuml.com/ie-diagram) e [classes UML](https://plantuml.com/class-diagram). É possível abrir os arquivos em um visualizador PlantUML ou renderizá-los localmente com Java, PlantUML e Graphviz:

```bash
java -Djava.awt.headless=true -jar "${PLANTUML_JAR:?Defina PLANTUML_JAR com o caminho do JAR instalado}" -charset UTF-8 -checkonly docs/modelagem/banco-de-dados.puml docs/modelagem/diagrama-de-classes.puml
java -Djava.awt.headless=true -jar "${PLANTUML_JAR:?Defina PLANTUML_JAR com o caminho do JAR instalado}" -charset UTF-8 -tsvg docs/modelagem/banco-de-dados.puml docs/modelagem/diagrama-de-classes.puml
```

Execute a partir de `api`, com a variável `PLANTUML_JAR` apontando para o arquivo JAR da instalação local do PlantUML. O SVG é uma visualização gerada; a fonte editável continua sendo `.puml`.

## Escopo do domínio

Uma loja, estoque único, preços em reais, entrega nacional e checkout autenticado. O MVP contempla catálogo, administração, endereços, lista de desejos, pedidos e pagamento **simulado**, com carrinho local no frontend. Frete será informado por uma política do backend, inicialmente fixa/configurável; não depende de transportadora real.

O carrinho pode usar estado Angular e armazenamento local com IDs e quantidades. Não terá tabelas nem endpoints para adicionar/remover itens; a consulta ao catálogo e o envio do checkout ainda precisam da API. Seu conteúdo não será sincronizado entre dispositivos. Ao confirmar um checkout bem-sucedido, o frontend remove os itens comprados do carrinho. A lista de desejos, por sua vez, será persistida por usuário e poderá ser recuperada em outros dispositivos. Ela não possui quantidades, preços congelados ou reserva de estoque, e comprar um favorito não o remove automaticamente da lista.

Cada `Mouse` é uma unidade comercial identificada por SKU: versões de cores distintas são registros distintos, com estoque e preço próprios. Uma entidade adicional de variantes só será necessária se houver agrupamento comercial por modelo. Marca é um cadastro; conexões são um conjunto de enums, pois um mesmo mouse pode suportar USB, Bluetooth e receptor sem fio simultaneamente.

`Usuario` atende autenticação e compras. `Perfil` distingue cliente e administrador, sem duplicar credenciais em duas entidades. O administrador também pode comprar. Um cadastro separado `Cliente` só será introduzido se houver dados ou regras próprios que o justifiquem. O cadastro público sempre atribui CLIENTE; o cliente não escolhe privilégios administrativos.

Categorias, cupons, avaliações, fornecedores, múltiplos depósitos, compras sem login, devoluções e integrações financeiras ficam como evoluções. A primeira versão do fluxo de compras utilizará pagamento simulado, sem coleta de CPF ou dados de cartão.

## Entidades e responsabilidades

| Entidade | Responsabilidade |
| --- | --- |
| Marca | Fabricante e disponibilidade no catálogo. |
| Mouse | SKU, descrição, especificações, preço e quantidade disponível. |
| ImagemMouse | URL, descrição acessível e ordem das imagens; a menor ordem é a capa. |
| Usuario | Identidade, credencial com hash, perfil e ativação. |
| Endereco | Endereço editável pertencente ao usuário. |
| ListaDesejos / ItemListaDesejos | Favoritos persistidos por usuário, sem reservar preço ou estoque. |
| Pedido / ItemPedido | Compra e cópias históricas dos dados dos produtos. |
| Pagamento | Cada tentativa simulada de pagamento, com resultado e idempotência. |

São **10 entidades persistentes, 11 tabelas e um objeto de valor**: `EnderecoEntrega` fica embutido em `Pedido`, enquanto `mouse_conexao` persiste a coleção de valores `TipoConexao`. Essa tabela de associação não é uma entidade de negócio, portanto não herda `DefaultEntity` nem recebe um ID artificial.

## Decisões de persistência

- Todas as dez entidades herdam os campos existentes de `DefaultEntity`: `id`, `dataCadastro` e `dataAlteracao`. A superclasse não tem tabela própria. `dataAlteracao` aceita NULL antes da primeira atualização.
- Java usa camelCase; SQL usa snake_case, com mapeamento explícito na implementação. `BigDecimal` corresponde a `numeric`, evitando ponto flutuante para preços. Valores monetários usam duas casas decimais, quantidade é inteira, e preços são positivos.
- `LocalDateTime` corresponde a `timestamp without time zone` no mapeamento atual. A padronização de JVM/JDBC em UTC e a representação do fuso nos contratos HTTP estão previstas para a implementação dos fluxos de compra.
- Endereço de entrega é uma cópia dos campos de um endereço pertencente ao comprador. Não referencia o endereço editável por FK. Alterações posteriores no cadastro não mudam pedidos anteriores.
- `ItemPedido` guarda SKU, nome, cor e preço unitário da compra. Sua FK para `Mouse` permite consulta ao catálogo, mas dados históricos nunca são reconstruídos a partir do catálogo atual.
- Subtotal do item = quantidade × preço unitário. Subtotal do pedido = soma dos subtotais; total = subtotal + frete. Totais derivados não têm colunas redundantes. `Pagamento.valor` registra o valor efetivamente tentado e deve corresponder ao total do pedido.
- Os campos de versão em `Mouse`, `Pedido` e `Pagamento` usam `@Version`. A lista de desejos tem operações de adicionar/remover itens; sua chave única evita favoritos duplicados.

## Integridade do banco

Todas as FKs apontam para `id` da tabela correspondente e são obrigatórias. O diagrama indica campos opcionais, PKs e restrições de unicidade. `id` usa `GENERATED BY DEFAULT AS IDENTITY`; versões começam em zero e `ativo` começa verdadeiro.

| Restrição | Aplicação prevista |
| --- | --- |
| Marca única | `UNIQUE(nome)`; serviço aplica trim e padronização do nome; índice único adicional em `lower(nome)` evita diferenças apenas de caixa. |
| SKU único | `UNIQUE(sku)` e `CHECK(sku = upper(trim(sku)))`. |
| E-mail único | `UNIQUE(email)` e `CHECK(email = lower(trim(email)))`; validação de formato na entrada. |
| Uma conexão de cada tipo por mouse | PK composta `(mouse_id, tipo_conexao)`. |
| Ordem de imagens sem repetição | `UNIQUE(mouse_id, ordem)` e `CHECK(ordem >= 0)`. |
| Uma lista de desejos por usuário | `UNIQUE(usuario_id)`; criada quando necessária, sem limite artificial de itens. |
| Produto sem linhas duplicadas | `UNIQUE(lista_desejos_id, mouse_id)` e `UNIQUE(pedido_id, mouse_id)`. |
| Valores válidos | `CHECK` de preço/preço unitário/pagamento > 0, frete/estoque/versão >= 0; quantidade/DPI/botões/peso > 0. |
| Pedido repetido | `UNIQUE(chave_checkout)`; serviço verifica mesmo usuário e mesma requisição para reutilizar o resultado. |
| Tentativa repetida | `UNIQUE(chave_idempotencia)`; repetição retorna a mesma tentativa, sem processar novamente. |
| Uma tentativa em andamento ou bem-sucedida | Índice único parcial `ON pagamento(pedido_id) WHERE status IN (1, 2)`. Tentativas recusadas/canceladas ficam no histórico. |
| Prazo de pagamento | `CHECK(expira_em > data_cadastro)`; o valor do prazo será configurável no backend. |
| Processamento coerente | PENDENTE exige `processado_em IS NULL`; APROVADO/RECUSADO/CANCELADO exigem `processado_em IS NOT NULL`. |
| Endereço nacional | CEP com oito dígitos e UF em uma das 27 siglas brasileiras, tanto no cadastro como na cópia do pedido. Número é texto para aceitar `S/N`. |

Enums usam IDs explícitos e `CHECK ... IN (...)`, sem tabela de domínio e sem persistência por ordinal:

| Enum / coluna | IDs |
| --- | --- |
| TipoConexao / mouse_conexao.tipo_conexao | 1 USB; 2 BLUETOOTH; 3 RECEPTOR_USB. |
| Perfil / usuario.perfil | 1 CLIENTE; 2 ADMINISTRADOR. |
| StatusPedido / pedido.status | 1 AGUARDANDO_PAGAMENTO; 2 PAGO; 3 ENVIADO; 4 ENTREGUE; 5 CANCELADO; 6 EXPIRADO. |
| FormaPagamento / pagamento.forma | 1 PIX; 2 CARTAO — ambos simulados. |
| StatusPagamento / pagamento.status | 1 PENDENTE; 2 APROVADO; 3 RECUSADO; 4 CANCELADO. |

Índices adicionais previstos: `mouse(marca_id)`, `endereco(usuario_id)`, `item_lista_desejos(mouse_id)`, `item_pedido(mouse_id)`, `pedido(usuario_id, data_cadastro DESC)` e `pagamento(pedido_id)`. Para expiração: índice parcial `pedido(expira_em) WHERE status = 1`. As chaves únicas/primárias compostas já atendem buscas pelo seu primeiro campo; não duplicar esses índices.

Na exclusão, usar RESTRICT/NO ACTION nas FKs por padrão. Somente `mouse_conexao`, `imagem_mouse` e `item_lista_desejos` podem acompanhar a exclusão de seu respectivo dono com ON DELETE CASCADE. Para favoritos, o dono é a lista; a FK de favorito para mouse permanece RESTRICT. Não apagar pedidos, itens de pedido ou tentativas de pagamento por cascade. Marca, mouse ou usuário com histórico devem ser desativados; remoção física é limitada a registros sem dependências. Endereços cadastrados podem ser removidos porque pedidos guardam sua própria cópia.

Quantidade mínima de filhos, propriedade do endereço, preço vigente, total de pagamento e transições de status são invariantes de serviço: FKs e CHECKs de linha, sozinhos, não as garantem. Um mouse cadastrado precisa de ao menos uma conexão; um pedido precisa de ao menos um item, ambos garantidos dentro da transação.

## Checkout, estoque e pagamento

1. O serviço recebe itens `{idMouse, quantidade}`, endereço do usuário e chave de checkout; valida identidade, lista não vazia, IDs sem repetição, quantidades, produtos/marcas ativos e preço atual. Não aceita preço ou total calculado pelo frontend como fonte da verdade. Se o preço mudou desde a revisão da compra, informa a alteração para reconfirmação.
2. Em uma transação, bloqueia os mouses em ordem de ID, verifica saldo, desconta estoque, copia itens/endereço e cria pedido AGUARDANDO_PAGAMENTO com vencimento. Falha em qualquer item desfaz toda a operação. Uma repetição da chave retorna o pedido existente, após verificar proprietário e equivalência da requisição; conflito concorrente dessa chave deve desfazer a transação perdedora antes de buscar o resultado existente. O frontend mantém a mesma chave durante tentativas da mesma compra e só limpa seu carrinho após confirmação da API.
3. O desconto torna as unidades indisponíveis enquanto o pagamento está pendente. O carrinho sozinho não produz esse efeito. Estoque é a quantidade disponível para novas compras, não inclui unidades comprometidas por pedidos.
4. Cada tentativa de pagamento tem chave própria. Apenas um pagamento PENDENTE ou APROVADO pode existir por pedido. Tentativas recusadas permitem uma nova tentativa antes do vencimento. Valor e forma são validados pelo serviço; nenhum número de cartão, CVV ou credencial bancária é armazenado.
5. Aprovar pagamento e mover o pedido para PAGO ocorre na mesma transação, bloqueando primeiro o pedido e depois sua tentativa. Cancelamento e expiração usam a mesma ordem. Assim uma corrida entre aprovação e expiração tem um único resultado válido.
6. Cancelar ou expirar um pedido ainda AGUARDANDO_PAGAMENTO cancela sua tentativa pendente e devolve estoque uma única vez, na mesma transação. O serviço verifica o status sob bloqueio e bloqueia os mouses em ordem de ID. Uma rotina periódica deverá expirar pedidos vencidos; não basta armazenar `expiraEm`. Aprovação após o prazo é recusada e aciona a expiração.
7. Fluxo normal: AGUARDANDO_PAGAMENTO → PAGO → ENVIADO → ENTREGUE. Saídas alternativas: AGUARDANDO_PAGAMENTO → CANCELADO ou EXPIRADO. Os três últimos estados são terminais no MVP; não existe cancelamento de pedido pago sem modelar estorno. Não se desconta estoque novamente ao pagar ou enviar.

Os campos históricos do pedido são imutáveis após sua criação. Somente estado, rastreio, auditoria e versão mudam pelos fluxos permitidos. O carrinho pode ser alterado depois do checkout sem afetar o pedido. Uma repetição da chave com conteúdo diferente deve ser rejeitada; sua implementação precisará comparar a requisição com os dados históricos, incluindo os itens e o endereço.

O pagamento simulado deverá ficar identificado na interface e limitado ao ambiente demonstrativo. Integração real exigirá outra revisão: IDs do provedor, webhooks autenticados e deduplicados, conciliação, estornos e tratamento de aprovações tardias.

## Organização da implementação

O diagrama de classes é do **domínio**, não de cada classe técnica do sistema. Na implementação, seguir `Resource → Service → Repository → Entity`, com interfaces e implementações de serviço separadas, DTOs de entrada/saída em records e conversores de enum em `model.converterjpa`, conforme o `AGENTS.md`.

Relacionamentos Java podem ser unidirecionais quando suficientes; as cardinalidades não obrigam coleções bidirecionais em todos os lados. Objetos JPA não são contratos HTTP. Para pedidos e pagamento, usar operações de negócio como criar, pagar e cancelar, em vez de permitir um PUT genérico para sobrescrever histórico ou status. O CRUD de catálogo continua seguindo o padrão do projeto.

Evolução do produto:

1. Catálogo de marcas, mouses e conexões: implementado, com validações, preço e estoque.
2. Imagens dos produtos.
3. Usuários, autorização e endereços.
4. Lista de desejos persistida, carrinho no frontend e checkout transacional.
5. Pagamento simulado, expiração e acompanhamento do pedido.

Antes de integrar checkout, testar especialmente concorrência pelo último item, repetição de checkout/pagamento, corrida entre pagamento e expiração e preservação de preços/endereço históricos. A suíte atual cobre o catálogo; esses cenários serão incorporados com os fluxos de compra.

## Esquema implementado

A migration V1 cria `marca`, `mouse` e `mouse_conexao`. As demais tabelas e regras deste documento representam o domínio planejado. Consulte [Catálogo de produtos](../catalogo.md) para os contratos e comportamentos disponíveis.
