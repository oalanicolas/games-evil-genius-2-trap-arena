# Configuração da grade recuperada do pacote

Fonte executável: `evilgenius_vulkan.exe`, SHA256
`c52e656a6bbdfdf4f59aa03bfa0f11425854299e61fb078744e5865847c79042`.
Fonte de dados: `misc/common.asr`, chunk `BLUE` no offset671476,
extração SHA256 `48a1644e954d5a3f24aa2892705925ce3588dd32fdab9c106266dae3c82bccb6`.
Biblioteca somente leitura; todo código e evidência novos ficam neste protótipo.

## Ligação comprovada

O dispatcher compara a tag `BLUE` em `12841b`, segue para `12847b` e chama
`113fd0` em `1284be`. Esse leitor registra namespaces em `1105e0` e lê os
grupos via `10e700`. Os lookups `110730→110ab0→10e3a0` são os mesmos chamados
por `5a71c0`, que popula a escala da grade.

O chunk selecionado contém namespace212de4f7, nove grupos e42 propriedades.
O grupo2666f252 tem15 propriedades e nenhum pai. Seu leitor é versão13,
sem strings de nomes; keys e palavras de metadados não recebem nomes inventados.
Os grupos terminam no offset1216. A extensão seguinte é preservada opaca:
contador2 e104 bytes. Não está semanticamente decodificada.

| Consumidor nativo | Key | Offset do valor no chunk | Tipo | Valor |
|---|---|---:|---|---:|
| Escala X | 8b99f777 | 332 | f32 | 1 |
| Escala Y antes de negação no loader | cdd5fd96 | 284 | f32 | 3 |
| Escala Z | d4aba755 | 212 | f32 | 1 |
| Tipo de célula na inicialização padrão | e603206f | 308 | u32 | 0x497004c7 |

A configuração do pacote alimenta **[1,-3,1]**, enquanto os defaults da imagem
são [1,-1,1]. Isso resolve a origem dos valores; não executa o loader nem prova
ausência de overrides em memória. Valores de piso podem prevalecer sobre o tipo
padrão no inicializador `5fb6f0`; não afirmar que toda célula tem esse tipo.

## Produtor dos flags de contato

O construtor `5fb620` inicializa cell48/49=0 e cell4a=4. `5fe100` resolve os
IDs cell24/28/20 via `661d40`, salvando os ponteiros em cell10/18/08.
O bit0 de resource98 vai para bit6 de cell4a; o bit0 de resource96 vai para
bit7 de cell4a. Sem recurso principal, limpa ambos. O classificador `5453a0`
retorna classe1 se cell4a for negativo como byte assinado. Isso liga o flag à
regra de contato, sem atribuir a classe1 o nome “parede” por aparência.

O leitor `5fbc20` também comprova que flags antigos dependem da versão:
versões1..15 têm campo booleano para cell48bit0;14..15 para bit1;3..15 para bit2.
O tipo de célula é lido em cell24. O recurso que preenche resource96/98 foi
resolvido abaixo; ainda falta o schema moderno. O campo `flags_u32` do parser ENTI da
biblioteca não foi declarado equivalente a esses bytes do runtime.

## Definições dos tipos de célula

`misc/common.asr`, chunk BLUE no offset831852, SHA256
`dc34cd111b5f3af8f6defe41e4d947960b1398d04649bb2f48383f297d7939d6`,
contém namespace94de9754,195 grupos,59 descendentes de997288ff. Os grupos
terminam em72500, seguidos de contador de extensão0; nenhum tail opaco.
`decode-native-cell-types.py` reutiliza o leitor BLUE comprovado e conserva
ID, ancestrais, offsets, tipo serializado e fonte de cada flag herdado.

O inicializador694800 enumera esse namespace/parent via110070/1101e0.
Seu modo depende de um objeto global+28: false seleciona39 filhos diretos;
true seleciona49 folhas descendentes. Não afirmar que os59 recursos estão
simultaneamente registrados na partida.69492d chama662030, que insere o ID
e ponteiro na tabela141cb1358, a mesma consultada por661d40.694950 chama660770,
que preenche resource96 pela keyafe7e835 e resource98 pela keyfed53b01.
Ambas exigem tipo booleano2; propriedade ausente consulta o pai via10e3a0,
propriedade existente com tipo errado termina a busca e o consumidor usa zero.

| ID do grupo | String bruta d9e2ac24 | resource96 | resource98 | cell4a após construtor/aplicação | Classe com cell48=0 |
|---|---|---|---|---:|---:|
| 497004c7 | Dirt | true@22390 | false herdado@31091 | 132 | 1 |
| 2a5b912a | Corridor | false herdado@31806 | false herdado@31091 | 4 | 0 |
| 430bd860 | OpenGroundImpassable | true@9515 | true@9270 | 196 | 1 |

As strings existem nos dados; seu papel na UI não foi inferido. Classe1 vem
do sinal de cell4a, não da aparência do mesh. Esses resultados usam os flags
do construtor. Furniture/ocupação pode alterar cell48; valores de piso, modo
global e overrides ainda precisam do vínculo ao estado instanciado.

O porte isolado `native-grid-transport.js` preserva a escrita desses
dois bits e o prefixo do classificador5453a0: cell4a negativo→1;
cell48 não negativo→0; cell48 negativo com bit0→2. A continuação que depende
de cena/furniture retorna `requiresScene` quando seus providers não estão ligados,
sem inventar uma classe. A continuação completa foi portada abaixo com providers
explícitos e fixtures; a cena da arena não fornece esses inputs ainda.
Ainda não é importado pela arena. O teste compara os59 tipos com suas fontes,
exercita a preservação dos outros seis bits em todos256 bytes e os guards
com prioridade entre classes; é porte de código, não execução do original.

## Ocupação produzida por registros do objeto

`5d36ae` chama6024b0 depois de resolver uma célula pelo stridea8 do piso.
Antes disso, lê metadados de footprint em registros de36 bytes do recurso
+298/count2a4; um override em registros144 bytes pode substituir o campo de
tipo. A comparação desse campo com2 gera o booleanoR8 passado ao setter.
Ainda falta vincular esses registros ao footprint instanciado de cada armadilha.

O setter aceita slots0..2, liga cell48bit7 e grava o ID do objeto em
cell84+slot*4. No slot2, cell48bit0 recebe o booleanoR8; outros ramos notificam
objetos e modificam flags adicionais, portanto não foi substituído por um
setter simplificado na arena. A remoção6026d0 exige ID correspondente,
grava999 no slot, limpa bit7 e volta a ligá-lo se algum dos três slots estiver
diferente de999. Isso fundamenta a origem do flag de ocupação utilizado pelo
classificador; não prova que todo dispositivo bloqueia ou captura igualmente.

O lookup5f4820, chamado pelo classificador, consulta o mapa de donos do piso
em2a0 com índiceZ*largura+X, sob lock, via2c0e60. **Não escreve cell48**.
A continuação do classificador exige os vínculos dos objetos e seus guards.

## Footprints das cinco armadilhas lidos pelo código original

`decode-native-footprints.py` parte do prefixo FNTR comprovado emB+355,
que termina emB+398. O caminho de versão155 em653199 avança por campos
escalares e dois envelopes intermediários versão1, conservados opacos.
O contador lido em653bc8 precede os registros lidos por658950 e copiados
com stride36 para FNTR298/count2a4. Não houve busca por padrões de bytes para
escolher o início das células.

| Recurso | Offset do contador na extração | Células16 | field4 consumido pelo setter | flag15 no footprint |
|---|---:|---:|---:|---|
| FanTrap | 540 | 16 | 0 | true nas16 |
| BoxingGlove | 544 | 8 | 0 | false nas8 |
| BubbleBlower | 548 | 8 | 0 | false nas8 |
| SoapTrap | 544 | 4 | 0 | false nas4 |
| LaserWall | 544 | 16 | 0 | false nas16 |

Cada payload16 tem dois u16 de coordenadas planares, field4 e field0c u32,
dez bools para offsets10..19, contadoru16/lista de u32 e field8 u32 final.
O leitor nativo conserva os quatro primeiros slots da lista apenas quando
contador<=4, truncando cada valor para u16; acima de4 consome e descarta todos.
O parser conserva cada offset/byte/valor e exige o consumo integral do payload.
Na seleção, payloads44 bytes e listas com quatro valores. Field8 varia0/2 em
luva/bolha/laser, mas permanece **sem nome de comportamento**: não reutilizar
automaticamente o rótulo “KeepClear” do catálogo como regra comprovada.

`545456→5d2ff0` busca o registro do objeto por coordenada de célula em modo3.
`5d3140` escolhe origem, dois deltas inteiros e dimensões na instância;
se as dimensões diferirem de FNTR68/6a, limpa o ponteiro do recurso.
A busca percorre linhas por índice1..largura*profundidade, com operaçõesint32;
retorna o registro serializado de índice-1 se houver match e count suficiente.
Não calcula esse contato por um raio em torno do mesh, nem usa as coordenadas
serializadas como coordenadas do objeto já colocado.

O porte `nativeFootprintQuery` preserva esse percurso com inputs explícitos.
Testes consultam todos52 registros em quatro fixtures cardinais, piso distinto,
mismatch de dimensões, índice ausente e wrapint32. As fixtures não provam a
orientação ou posição de uma instância do cliente original. O wrapper recusa
dimensões nulas ou produto acima do cursoru16, fora da seleção suportada.

O porte `nativeClassifyCell` traduz também a continuação5453a0: consulta donos
do piso, relê cell48 e consulta objeto por cell8c. Se component78 existe e seu
campo332u16 pertence a2..4, chama a busca de footprint em modo3; flag15 diferente
de0 retorna classe2. Em seguida, faz uma segunda consulta do objeto e retorna
classe2 quando componenta0 existe e seu field7c é diferente de34264a; senão0.
São guards de campos nativos sem nomes de estados de gameplay inventados.
Ordem das consultas, ausência de ponteiros e mudanças de flags entre consultas
foram testadas. Os providers ainda não vêm de uma cena reconstruída equivalente.

## Estado do dispositivo e contato inicial

A lente desta continuação é reproduzir decisões com os campos do original. O
cenário de prova é cruzar limites temporais e células, inclusive nos casos que
não ativam ou não avançam. Reutilizada a prova de ponteiros e relógio em
`native-rules-research.json`; nenhum nome de fase foi criado para substituir
um enum numérico.

O componente78 e seu estado332 consultados por5453a0 são o controlador de
armadilhas já recuperado:5d6796 chama612590, aloca0x460 bytes e salva o ponteiro
no objeto78; component8 aponta para o dono, cujo80 contém FNTR.5d68b1 inicializa
o estado0 via618240. Seu timestamp334 usa o relógio float32 de segundos de
simulação141ad1c78, comprovado pela rota QPC/QPF anterior.

`native-trap-state.js` porta a **decisão**613d90..613e4c, após atualizações de
atores/controladores que podem já ter alterado o estado. O controller virtual30
true usa o resultado uint16 de virtual38; esse override precede a regra base.
Sem override,5cfa60 fornece um predicado do dispositivo/ambiente, **não presença
do agente**. Estado3 avança antecipadamente se esse predicado for false ou
component3e4 não for zero. Caso contrário, o teste exato é:

```text
f32(clock − threshold) > timestamp334
```

Igualdade e resultado unordered não expiram. Não substituir por
`f32(clock−timestamp)>threshold`: a ordem muda o arredondamento. O teste da
luva em timestamp128, thresholdf32(1,533) e clockf32(129,533) comprova essa
diferença no porte. O caso seguinte usa o próximo float32 representável.

| Enum | Limite em segundos / fonte | Próximo enum quando aplicável |
|---|---|---|
| 0/1 | 1e30; inversão por predicado sem esperar limite | bool do predicado |
| 2 | FNTR160 | predicado true→3; false→4 |
| 3 | FNTR158; também saída antecipada | 4 |
| 4 | FNTR164 | FNTR18c não zero→7; senão5 |
| 5 | FNTR15c | bool do predicado |
| 6 | FNTR168 | bool do predicado |
| 7 | 1e30 | 1 |
| 8 | component374==0 ? f32(0,1) : 1 | FNTR18f não zero→1; senão2 |
| 9 | 5 | bool do predicado |

FNTR ausente retorna1e30 **antes** da seleção, inclusive nos enums8/9.
Os25 valores dos enums2..6 são relidos das cinco extrações, com offset e bytes
em `trapConfigs` do relatório. O bool18f está emB+330 e étrue nas cinco fontes.
O produtor de FNTR18c continua desconhecido: não foi substituído pelo bool18e
vizinho nem por um default assumido.

A decisão produz uma solicitação de estado, **não o estado final da cena**.
618240 retorna sem resetar timestamp se o estado for igual. Seu caminho normal
grava o relógio corrente em6185c8, sem transferir sobra de tempo. Entretanto,
a entrada no estado1 chama618080; sucesso pode levar imediatamente a outro
estado e pular a gravação externa. Logo, uma decisão por chamada não implica
uma transição por atualização. O porte não executa os efeitos de entrada.

O contato inicial também não usa o mesmo footprint do classificador de bounce.
Enquanto estado1,6175b0 enumera IDs de atores na coleção3a8, resolve cada ator
via52b1b0 e passa seu XYZ inteiro34 a613000. Este testa a interseção de **duas
máscaras**: componentb8/bounds c8..dc, depois component28/bounds38..4c.
Cada máscara exige o mesmo piso, limites válidos e bit ligado no índice
`(maxX−minX+1)*(Z−minZ)+X−minX`. A operação foi portada com máscaras explícitas;
um bit/word ausente gera erro, sem fallback para raio.

Depois do contato,615210 decide elegibilidade/reação; seu resultadofalse pode
chamar618080 e o seletor616d80. No caminho de ator selecionado, o controlador
grava ownerID em actor720 e entra em estado9. O caminho sentinel999 usa61ad00.
Esses produtores e efeitos ainda precisam de vínculo, portanto a arena mantém
seu sensor/relógio reconstruídos. Não confundir estes testes com ativação real
das cinco armadilhas ou substituição concluída do cooldown.

## Reprodução e limites

```sh
python3 decode-native-grid-config.py
python3 decode-native-cell-types.py
python3 decode-native-footprints.py
python3 trace-grid-config-source.py
node test-native-grid-transport.mjs
node test-native-trap-state.mjs
python3 build_fidelity_reference.py
python3 validate-native-sources.py
```

O relatório de código preserva45 janelas de código e6 de dados, bytes e hashes. A auditoria
relê a extração e os valores nos quatro offsets, verifica cinco chamadas e
recusa14 configurações truncadas, inválidas, ambíguas ou sem binding resolvido.
Também relê118 flags em59 definições, sete chamadas da factory/leitor,
cinco asserts de herança e recusa sete definições corrompidas ou não resolvidas.
Três chamadas adicionais vinculam footprint/setter e lookup de donos.
Mais quatro calls ligam o leitor e a busca;260 campos relidos em52 células,
40 seleções corrompidas ou ambíguas recusadas. Total atual:
**285 janelas nativas**,760 referências TRPA,1715 checks do porte
de grade e659 do porte de decisão/máscaras (incluem células negativas,
mudança de piso, fronteira entre words31/32 e precedência de guards).
Mais25 valores temporais, cinco flags18f e11 chamadas são verificados diretamente
nas fontes. Esses números não são testes de
equivalência do cliente original.

**Execução original: não ocorreu. Dados extraídos: configuração BLUE e assets.
Reconstrução: parser e porte isolado em JavaScript; arena continua Three.js.**
Sem mudança do runtime nesta etapa, portanto não há nova captura ou aprovação
de movimento. Zero cadeias contínuas no layout inicial;0/34 casos integrais.

Próximo vínculo: produtores das duas máscaras e coleção de atores,615210/616d80,
efeitos de entrada618240 e flag18c. Instâncias/deltas/rotação/overrides,
IDs/donos, componenta0+7c, ENTI moderno e dados de piso também faltam.
Depois ligar esses inputs e o
registro de movimento ao porte de contato, sem trocar os providers por suposições.
