# Evil Genius 2 — laboratório web de armadilhas

Protótipo isolado, criado em 02/10/2026 em `prototypes/evil-genius-2-trap-arena`.
O usuário autorizou reconstrução web a partir da biblioteca após a investigação do
cliente original. Rabisco e a biblioteca permaneceram sem alterações deste trabalho.

## Executar

Na raiz do workspace:

```sh
python3 prototypes/evil-genius-2-trap-arena/server.py
```

Abra <http://127.0.0.1:8766/>. O servidor escuta somente em loopback e expõe somente
os 53 arquivos da biblioteca listados em `asset-manifest.json`. É necessário ter a
biblioteca `libraries/evil-genius-2` com essas extrações restauradas.
Nenhum executável original, Steam ou download é necessário para este recorte web.

## Reprodução direta das animações — R1

Abra <http://127.0.0.1:8766/native-motion.html>. Esta bancada separada permite
reproduzir, pausar e percorrer 52 clipes extraídos: a caminhada masculina
`Investigator_walk_revolvers_01`, reações A/B e movimentos dos dispositivos.
A arena principal também usa a caminhada extraída, pelo mesmo sampler. As cinco reações também usam poses extraídas. As regras, a seleção e o encadeamento ainda não são equivalentes ao original.

O decoder preserva as amostras HCAN22. A leitura estática do executável confirmou
o quantizador, nlerp pelo arco curto, flags de composição e produto bind × delta.
Referências com endereços e hashes: `evidence/native-animation-code.{md,json}`.
Os cinco esqueletos de dispositivos somam 25 ossos e 28.522 vértices referenciados
com oito influências verificadas. `build_device_rigs.py` regenera essa derivação.

A bancada usa `native-player.js`; materiais, câmera e conversão de eixos são
reconstruídos. O clipe do investigador tem 71 nomes e 58 correspondências com a
malha selecionada; os 13 sem correspondência são listados na tela. O retarget
foi confirmado: razão de comprimentos quando scalar > f32(0,01), fator igual a 1,
antes de aplicar as flags de composição. Integração com navegação/colisão e
equivalência visual ao cliente seguem em investigação. O sampler web usa float64,
enquanto o original usa float32. O piso é omitido na inspeção dos dispositivos
para não esconder os componentes enterrados; suas posições não são reposicionadas.

`build_fidelity_reference.py` regenera o inventário selado de 34 casos, com fontes
nativas e lacunas explícitas. A investigação FNTR liga cinco campos aos limites
temporais dos estados 2/3/4/5/6, em segundos de simulação. O estado 5 normaliza o
widget `TrapCharge` por 40 ou 50; o estado 6 começa depois do evento de sabotagem
e tem limite de 30. As saídas podem acontecer antes do limite. Os nomes dos demais
estados, modifiers e regras de Skill/desarme continuam sem prova completa.

`decode-trap-animation-data.py` decodifica os cinco registros TRPA3: 7 grupos,
175 mapas e 685 referências que resolvem 61 clipes únicos. A bancada mostra
os vínculos diretos das reações. Os 25 slots por grupo não recebem um tipo de
corpo por suposição; a seleção feita pelo motor ainda está sendo rastreada.
O piso possui um grupo secundário com `Trap_SlipperySoap_MovementLoop_A_01`.
A referência u32 FNTR B+335 não deve ser confundida com um id de oito bytes.
Bolha e piso apontam nesse campo para `Killer_Bees`; seu uso completo segue em
investigação. Provas: `evidence/native-trap-animation-data.json`.

`python3 validate-native-sources.py` confronta os trechos de máquina registrados
com o executável local, verifica os hashes de clipes diretamente nos bytes TRPA
e rejeita recursos truncados ou com comprimentos inválidos. Essa validação não
executa o cliente original nem certifica a cadeia.
A caminhada da arena substitui o avanço assumido pelo canal linear extraído. Os demais valores `assumed` permanecem reconstruídos. As reações usam clipes originais com seleção e duração reconstruídas. R1 continua em andamento.

## Jogar e montar

1. **Enviar agente** inicia uma tentativa; **Iniciar onda** envia seis, espaçados.
2. **Seguir agente** aproxima a câmera e acompanha sua caminhada e reações.
3. Selecione um dispositivo na bancada ou na cena; **Reposicionar** permite clicar
   no piso, **Girar** muda o sensor e **Alimentação** liga/desliga a armadilha.
4. A montagem inicial atinge **ventilador → luva → bolha → piso → laser** sobre
   o mesmo agente, mas há duas recuperações à caminhada. O histórico registra os
   cinco acertos; o contador de cinco efeitos sem recuperação permanece zero.
5. Pausa congela simulação e animação. Reiniciar preserva a montagem. Salvar mantém
   posição, orientação, alimentação e cenário no navegador; Montagem inicial restaura o exemplo.

O cenário aberto remove as paredes da apresentação; usa a mesma arena de teste e
os mesmos limites. Agentes que escapam reduzem a integridade. Recargas afetam grupos
apertados: enviar vários agentes juntos não garante seis cadeias.

## Proveniência

| Parte | Origem e limite |
|---|---|
| Execução original | **Nenhuma.** Asura e o cliente comercial não estão em execução. |
| Onze modelos | RSCF decodificado em GLB pela biblioteca: dispositivos, duas variantes do ventilador, piso, parede, corpo, cabeça e revólver do investigador. Hashes no manifesto. |
| Texturas e seis sons | DDS convertido em PNG e WAVE extraídos. Reprodução de ADPCM usa o decodificador existente da biblioteca. |
| Materiais | Associação submalha/MARE extraída; função dos slots de cor/normal inferida. Shaders, iluminação e transparência reconstruídos em Three.js. |
| Personagem | Corpo contém o chapéu; cabeça da mesma família MA. Esqueleto HSKN com 81 ossos extraído. O cabelo adicional foi removido por sobreposição. |
| Skinning | Layout localmente inferido no RSCF: oito pesos u8 em offset 32 e oito índices em 40, stride 48. Todos os 7.881 vértices referenciados somam 255 e apontam para ossos válidos. O shader preserva as oito influências, inclusive na sombra. |
| Caminhada na arena | **Clipe HCAN extraído**, Investigator_walk_revolvers_01, pelo mesmo sampler da bancada. 58/71 trilhas correspondem aos 81 ossos do modelo. Avanço linear derivado do canal extra: 1,2999999523162842 unidades em 1,1333333253860474s, ajustado pela razão nativa de comprimentos (~1,147059 unidades/s). Conversão de eixos, navegação e transições reconstruídas. Dois revólveres extraídos anexados aos ossos bn_L_weapon/bn_R_weapon sem offsets; associação inferida, não regra de equipamento comprovada. |
| Reações | Poses das cinco fases loop extraídas, ligadas pelo seletor TRPA. Slot 0, grupo primário e alternates de bolha/piso são configuração declarada da arena, não entradas observadas em partida. O relógio vem do acerto reconstruído. Entrada/recuperação, duração e derrota continuam sem equivalência certificada. |
| Ventilador na arena | Malha `trap_fan`, skin de oito influências, sete ossos e clipes `Giant_Fan_Mount_01`, `Giant_Fan_Loop_01`, `Giant_Fan_Dismount_01` extraídos. A seleção sequencial de um ciclo após o acerto é reconstruída; não executa o controlador original. Clip de recolhimento no último quadro representa o repouso. Corte de renderização em Y=0 oculta a caixa enterrada, sem alterar as poses; shader/corte pertencem à reconstrução. |
| Cenário | Planta autoral com peças nativas repetidas. Não é um mapa original importado. Plintos, marcas no piso, UI, partículas, bolha e feixes são reconstruídos. |
| Sensores e regras | Código próprio em `simulation.js`, com valores assumidos em `rules.json`. Não são código original, dano, física ou cooldown original. |

A investigação anterior permanece em [original-client-investigation.md](original-client-investigation.md).
Seus bloqueios e diagnósticos descrevem aquela etapa; não representam o estado atual
das extrações na biblioteca.

## Comparação visual

Referência inspecionada: [imagem oficial Trap Combos](https://evilgeniusgame.com/images/blog/00/01/1b-large.jpg).
O [diário dos desenvolvedores](https://evilgeniusgame.com/en/news/405) informa sensores
integrados, recargas e combinações de ventilador e bolha. A montagem específica com
cinco dispositivos atinge todos os tipos no protótipo, mas ainda não demonstra uma
cadeia contínua, nem equivalência de física com o original.

| Elemento visto na fonte | Resultado e diferença restante |
|---|---|
| Piso verde claro, paredes cinza com faixa laranja | Peças e texturas nativas; corrigida a parede que aparecia pelo verso. O enquadramento é uma arena autoral. |
| Ventilador com aro laranja e pás escuras | Malha, textura e poses extraídas de abertura/operação/recolhimento na arena. Substituído o rotor permanentemente elevado. Orientação e relógio de ativação reconstruídos; fluxo é VFX próprio, sem o shader de vento original. |
| Dispositivos arredondados e cores industriais | Malhas nativas; portas divididas em duas folhas e abertas por movimento autoral. Laser ainda tem acabamento mais simples que o original. |
| Agente humano de desenho cartunesco | Malha, cabeça e chapéu nativos; caminhada articulada corrigiu o deslize rígido inicial. Caminhada HCAN integrada; sem animações faciais ou equivalência certificada de movimento. |
| Cena iluminada, sombras suaves e efeitos legíveis | Luzes/sombras em Three.js e feedback por estado. Não reproduz pós-processamento, reflexos e partículas do Asura. |

Comparação feita por inspeção visual e capturas da cena em movimento. Não houve
comparação de pixels em câmera idêntica nem aprovação artística do usuário.

## Verificação

```sh
node prototypes/evil-genius-2-trap-arena/test-simulation.mjs
```

Para os testes de navegador, disponibilize o pacote Playwright pelo `NODE_PATH`,
com Chrome instalado, e execute `qa.mjs`, `walk-qa.mjs` e `capture.mjs`. Rodam
headless com `--use-angle=metal --ignore-gpu-blocklist`; `QA_HEADED=1` é opt-in.
`EG2_QA_OUT` define a pasta externa das capturas; padrão `/tmp/eg2-arena-qa`.
`reaction-qa.mjs` confronta os 81 ossos da arena e da bancada nas cinco reações, verificando pausa e fontes. `EG2_REACTION_QA_OUT` define sua saída externa. Isso não prova seleção, física ou duração do cliente original.
`native-motion-qa.mjs` verifica os 52 clipes, composição condicional, pausa,
nlerp, preservação de chaves estáticas e viewport. `EG2_NATIVE_QA_OUT` define
sua saída externa. Isso verifica a reprodução web, sem certificar o cliente original.

Recibos leves ficam em `evidence/`. A integração das reações está em `evidence/native-reaction-integration.json`: 35/35 verificações de aplicação de pose, caminhada 13/13 e controles reconstruídos 10/10. Mídia daquela etapa no [Drive](https://drive.google.com/file/d/1gCiP8xYj-HPEbJwvOTymNQVVy_k7aLAw/view?usp=drivesdk), fora do repositório: 29 arquivos com capturas, vídeos ao vivo, recibos, baseline e falha detectada/corrigida, com hashes no ZIP.
O teste ao vivo não usa `advance`: registra cada estado sobre o mesmo agente com
o relógio do renderer. A verificação determinística adicional demonstra que mover,
girar e desligar dispositivos muda a cadeia; não se trata de uma sequência fixa.

Assets são consumidos por referência à biblioteca. `build_manifest.py` regenera
o recorte; `build_actor_rig.py` regenera a skin derivada e valida os pesos.
Não houve commit, publicação ou deploy.


## Direção nativa e remoção de atalhos — continuação de R1

`decode-native-controller85.py` reconstrói a leitura do prefixo FNTR e registra
o percurso do controlador 0x85 diretamente no executável: fábrica, carregador,
consulta de vetor, parâmetros de direção de montagem e despacho dos canais.
As cinco famílias têm o campo FNTR+0x1b0 comprovado: ventilador/luva/bolha usam
modo 1; piso/laser usam modo 0. É um seletor de consulta, não velocidade nem tempo.
Os receptores concretos foram comprovados: direção → quaternion e destino →
translação interpolada; registros de canal e vínculo ao ator ainda faltam. Prova e limites:
[evidence/native-controller85-route.md](evidence/native-controller85-route.md).

A simulação removeu a imunidade permanente por tipo de armadilha e deixou de
contar cinco tipos no histórico como combo. Reentrada depende agora de sair do
sensor do dispositivo: esse mecanismo continua reconstruído. Uma recuperação
à caminhada encerra o episódio contado. A montagem inicial mantém os mesmos
valores e acerta os cinco tipos, mas produz **zero cadeias contínuas**, com duas
recuperações. Não houve ajuste de impulso, duração ou dano para forçar sucesso.

Os recibos anteriores são históricos. O estado atual está em
`evidence/contact-episode-qa.json`: controles 11/11, caminhada 13/13 e poses das
cinco reações 35/35 contra a bancada extraída, com erro local zero depois da
transição. O teste lógico inclui acerto repetido da mesma família e saída/reentrada
no sensor. Esses resultados não provam elegibilidade ou recuperação nativa.
Na etapa de QA, 159 janelas de bytes e 760 referências de clipes foram confrontadas às fontes;
15 prefixos FNTR malformados e 18 recursos TRPA malformados foram rejeitados.
R1 segue aberta: **0/34 casos de fidelidade integral**. A continuação estática
confere agora 183 janelas, incluindo registro, vtables, receptores, endpoints e
interpolação de destino. Os endpoints são limitados a 0..1; a conversão para
tempo de jogo ainda não foi estabelecida. Não são velocidades ou durações nativas
em segundos. O próximo alvo são os registros desses canais e os transforms do
objeto vinculado, para transportar o movimento com parâmetros do jogo.
O runtime e os assets da arena não mudaram nesta etapa; a QA de movimento acima
continua sendo a última observação da reconstrução, não uma nova execução original.

Capturas antes/depois, vídeos e recibos atuais: [Drive](https://drive.google.com/file/d/1pp1HjtFXFxN9e6hAjRUo1xNiV3snu6-i/view?usp=drivesdk), 31 arquivos (23 mídias), SHA256 em `evidence/contact-episode-media.json`.

## Ventilador com ciclo extraído — continuação de R1

A arena usa agora a mesma skin e o mesmo sampler da bancada para abrir, operar e
recolher o ventilador. As durações dos três clipes são aproximadamente 1,2s, 0,8s
e 0,5s. São durações de clipe, não cooldowns nem tempos nativos de ativação.
Um ciclo visual por acerto e o repouso no último quadro de recolhimento são
escolhas declaradas da reconstrução; controlador, eventos de fase e física
originais ainda precisam de vínculos comprovados.

`fan-animation-qa.mjs` confronta sete amostras dos sete ossos com a bancada:
42/42 verificações de pose/fonte, mais pausa, novo disparo e reinício. Caminhada
13/13 e cinco reações 35/35 passaram nesta integração. Esses resultados medem
consistência entre dois consumidores web das extrações, não equivalência ao Asura.
Recibo: `evidence/native-fan-cycle.json`; mídia e hashes: `evidence/native-fan-media.json`.

A inspeção visual encontrou a caixa enterrada visível sob o piso fino autoral.
Um plano de corte de renderização em Y=0 a oculta na arena e nas sombras; a bancada
continua mostrando a peça completa e as poses não foram reposicionadas.
Comparação numerada e limites em `game-design.md`. A cadeia contínua segue sem
prova, com zero dos 34 casos integralmente certificados e o goal ativo.

## Eventos extraídos do jogo — continuação de R1

A investigação agora decodifica a região de listeners após os hashes de ossos
em 85 HCAN22, incluindo todos os 70 clipes referenciados pelos TRPA selecionados.
35 registros tipados e 28 bases têm offsets e fonte; dois canais vetoriais de
`BounceOff_Mount_A_01`, referenciado pelo ventilador, estão completos. O código
original liga `TrapBouncePosition` a um evento de destino e `MoveToPinnedPos` à
posição armazenada no ator. Os intervalos são normalizados, não velocidades.

[Prova, limites e comandos](evidence/native-hcan-listeners.md). A auditoria passa
com 207 janelas nativas, 760 referências TRPA e 360 corrupções HCAN rejeitadas.
A geração dos destinos de colisão, guards e vínculo de progresso ainda precisam
ser resolvidos antes de aplicar esse transporte na arena. O runtime desta etapa
não mudou: mantém a última QA de movimento e **zero cadeias contínuas** no layout
inicial. R1/goal ativos e **0/34 casos integrais**; nenhum parâmetro foi ajustado
para forçar a cadeia.

## Colisão e grade: porte de operações, sem integração à arena

A rota original liga a atualização do ator à consulta de contato que emite
`TrapBouncePosition`. Há agora um porte isolado da correção lateral e da
aritmética de destinos, com19 verificações passando. A configuração pode alterar
a escala da grade; defaults do executável não foram tratados como valores do mapa.
[Prova, comandos e limites](evidence/native-bounce-grid-route.md).

A auditoria passa com234 janelas nativas. O classificador de células e os dados
de cena ainda precisam de origem comprovada antes da integração; por isso a
simulação da arena e sua última QA de movimento permanecem inalteradas. Não há
nova alegação de cadeia nativa, execução do Asura ou fidelidade100%.

## Configuração encontrada no pacote original

O recurso `BLUE` de `misc/common.asr` está ligado por chamadas nativas ao loader
da grade. O parser recuperou nove grupos e42 propriedades; a escala consumida
é **[1,-3,1]**, e o tipo de célula padrão é0x497004c7. A extensão de104 bytes
fica opaca. Isso substitui a lacuna de configuração do pacote, sem afirmar que
defaults ou overrides representam um mapa em execução.

[Fonte, offsets, reprodução e limites](evidence/native-grid-config-route.md).
A auditoria confere285 janelas e recusa14 configurações inválidas. O segundo
BLUE de `misc/common.asr` contém195 grupos e59 definições descendentes de célula.
A factory e o leitor nativos ligam as keysafe7e835/fed53b01 aos campos96/98,
que alimentam cell4a bits7/6. O parser conserva a herança e os offsets dos118
valores. As strings brutas “Dirt” e “Corridor” correspondem a classe1 e0
com os flags do construtor, respectivamente; células ocupadas dependem de
outros flags ainda não ligados ao mapa moderno. A origem do flag de ocupação
também foi rastreada: registros de footprint alimentam três slots de ID e o
setter6024b0; a remoção6026d0 recalcula a ocupação. Falta ligar os registros
específicos das cinco armadilhas às instâncias e donos da cena. Os52 registros
de footprint já foram lidos pelo caminho sequencial FNTR155→658950, com
origem de cada campo preservada. O flag15 consultado pelo contato está ligado
nas16 células do ventilador e desligado nas outras quatro famílias; isso é
condicional aos campos de estado e componente do objeto em execução.

`native-grid-transport.js` inclui esse prefixo do classificador e a escrita dos
dois bits, o classificador completo e a busca de footprint por índice nativo,
com1715 checks no porte isolado. Os providers de furniture/cena ainda não
estão ligados a instâncias equivalentes. A arena ainda não consome esse porte;
não houve nova execução ou captura do cliente original. Goal ativo.

O campo332 foi ligado ao controlador nativo de armadilhas já extraído.
`native-trap-state.js` porta a decisão temporal com subtração/comparaçãofloat32,
limite estrito e override do controller, além da interseção das duas máscaras
de contato inicial. **659 verificações passaram**, incluindo os25 limites FNTR
e casos em que o arredondamento impediria ou permitiria o avanço. O predicado
do dispositivo não é presença de inimigo. A decisão retorna uma solicitação;
efeitos de entrada podem mudar novamente o estado na mesma atualização.
Produtores das máscaras, elegibilidade/seleção do ator, flag18c e esses efeitos
continuam sem integração. Por isso este porte ainda não troca o raio e os tempos
reconstruídos da arena. Fonte e limitações no mesmo relatório acima;0/34 casos
integrais e zero cadeias contínuas no layout inicial.


## Editor de covis — engine nova (02/10/2026)

Pedido de Alan: montar cenários inteiros com todas as armadilhas, labirintos, várias entradas e níveis de
agentes, numa engine pensada para virar jogo. Fica em `engine/` e abre em `covil.html`, com servidor próprio:

```sh
python3 prototypes/evil-genius-2-trap-arena/engine/server.py     # http://127.0.0.1:8767/covil.html
```

22 armadilhas do pacote e a porta, quatro tipos de agente (investigador, sabotador, soldado, ladrão) em seis
níveis, quatro cenários de referência montados a partir das capturas do pedido. Arquitetura, origem de cada
número, comandos e limites: [engine/README.md](engine/README.md). Plano, estado e pendências:
[docs/engine/plano.md](docs/engine/plano.md). Comparação numerada com as referências:
[docs/engine/comparacao.md](docs/engine/comparacao.md).

A arena desta página (`index.html`, `app.js`, `simulation.js`) e o laboratório de fidelidade não mudaram: mesmos
arquivos, mesmos testes verdes. As regras da engine são nossas sobre tempos lidos do jogo; não são o
comportamento do Asura, e o livro de fidelidade continua em 0 de 34.
