# EG2 — rastreamento de regras nativas

Data: 2026-10-02. Alvo exclusivo: protótipo `prototypes/evil-genius-2-trap-arena`. Fonte em somente leitura: biblioteca Evil Genius 2 e instalação apontada por ela. Zero execução do cliente, instalação, rede ou alteração de runtime. Os únicos arquivos persistentes gravados são este relatório e `native-rules-research.json` ao lado. Desmontagens e leitores estáticos temporários ficam em `/tmp`, conforme o brief de continuidade.

## 1. Resultado e limite

**[O]** 16 comparações passaram byte a byte contra contêineres nativos abertos novamente: cinco registros FNTR, cinco TRPA e seis RTrT de investigadores. A origem do JSON contém arquivo extraído, SHA-256, offset no contêiner descompactado e tamanho. Quatro tabelas HTXT completas também foram comparadas com os arquivos originais e são iguais. O leitor usado: `libraries/evil-genius-2/adapter/asura.py:22` (Zbb), `:51` (chunks) e `:89` (HTXT). O envelope FNTR está em `libraries/evil-genius-2/adapter/furniture_extract.py:13`; extração de bytes e interpretação funcional são coisas distintas.

**[O]** Nenhum campo numérico de sensor, cooldown, dano, impulso, duração, detecção, desarme ou recuperação foi semanticamente identificado neste recorte. **[I]** Os números abaixo são candidatos para engenharia reversa, não valores esperados do original e não autorizam converter constantes do protótipo em “nativas”.

## 2. Cinco armadilhas — números sem rótulos

**[O]** Há seis floats little-endian consecutivos na posição `B+280..B+300`, sendo `B=(offset do primeiro NUL do nome+4)&~3`. A fórmula alinha o fim do nome observado; não depende do marcador de pi utilizado no parser de custo. Todos os offsets da tabela são relativos ao registro FNTR extraído. Os detalhes incluem os quatro bytes individuais de cada valor.

| Registro nativo | Offsets dos seis slots | Leituras f32 | Endereço no relatório JSON |
|---|---|---|---|
| LaserWall | 292, 296, 300, 304, 308, 312 | 5, 40, 0, 0.5, 30, 0.200000003 | `native-rules-research.json:8` |
| BoxingGlove | 292, 296, 300, 304, 308, 312 | 0, 40, 3, 1.53299999, 30, 0.200000003 | `native-rules-research.json:109` |
| FanTrap | 288, 292, 296, 300, 304, 308 | 4.5, 50, 0.5, 0.5, 30, 0.200000003 | `native-rules-research.json:210` |
| SoapTrap | 292, 296, 300, 304, 308, 312 | 2.5, 40, 0.5, 1, 30, 0.200000003 | `native-rules-research.json:311` |
| BubbleBlower | 296, 300, 304, 308, 312, 316 | 2, 50, 0.5, 1.33299994, 30, 0.200000003 | `native-rules-research.json:412` |

**[O]** Os slots finais são 30 e aproximadamente 0.2 em todos os cinco registros. **[I]** Não há prova de que 30 seja cooldown, nem de que os outros slots sejam alcance/dano/atraso. A igualdade entre itens não fornece unidade ou nome de campo. O prefixo de “3” e “1.533” da luva não deve ser promovido a tempo de contato ou alcance.

**[O]** FanTrap tem u32 4000 em +120, enquanto o parser existente não devolve `cost` para ele: `libraries/evil-genius-2/adapter/furniture_fields.py:19` exige marcador `db0f4940` (pi), ausente naquele ponto. **[I]** Esse slot parece estruturalmente equivalente ao custo dos demais; sem rótulo native/runtime, o relatório mantém `adjacent_u32_semantic=unknown`.

**[O]** Os registros TRPA têm nomes `TrapAnimationData_<família>`, versão 10; foram relidos e comparados com a fonte. A busca do cabeçalho TRPA [+16,+24) dentro de cada FNTR dá -1 para todos os cinco. **[I]** Nome de família sustenta investigar uma associação, mas não prova referência binária. O relatório evita criar uma ligação exata inexistente. HCAN e animações ficam com o especialista responsável.

## 3. Investigadores e Skill

**[O]** Existem RTrT `MinionTrait_Investigator_Quality_01` até `_05` e `_Super`. Cada um contém o literal `On Spawn` em +52 e três floats 500 em +126, +130 e +134. Todos os seis apresentam esses mesmos floats. Origens/hashes/bytes no array `investigator_traits` do JSON. **[I]** Os três 500 não podem ser chamados Vitality/Skill/Resolve sem decodificação do serializer: a igualdade entre todas as qualidades é evidência para rejeitar uma atribuição ingênua.

**[O]** O u32 em +187 é 0x194c134a até 0x194c134e por qualidade 1..5, e 0xdfc97192 para Super. O mesmo padrão ocorre nos RTrT Thief, Saboteur e Soldier (no Soldier em +237). **[I]** Trata-se de um discriminador compartilhado por qualidade; seu tipo pode ser enum/hash/referência e não foi confirmado. Nenhum dos valores tem correspondência encontrada em HTXT inglês ou em objectId dos registros gameplay.

**[O]** `libraries/evil-genius-2/details/textos/text-pc-character-character-asr-en.json:12666`: “Skill boosts the base strength of the Agent's Disguise, and their ability to avoid Traps.” Isto sustenta duas funções de Skill: disfarce e evasão. Não fornece fórmula de probabilidade ou pontos iniciais. Novo em relação ao relatório anterior que citava apenas texto de menu.

**[O]** `libraries/evil-genius-2/details/textos/text-pc-dlc108-oceans-dlc108-oceans-asr-en.json:9076`: “Lowers the cooldown of traps making them trigger more frequently.” A linha 9081 identifica `Trap Cooldown Upgrade`. Isso demonstra cooldown modificável por melhoria Oceans; duração base e multiplicador permanecem desconhecidos. Tabelas integrais comparadas com HTXT nativo, hashes em `constraints`.

## 4. Não confirmado e onde procurei

- **[O]** O índice de recursos tem 75195 entradas; não contém chunks STMA, BHAV ou BTREE. A contagem exata atual está em `inventory.resource_entries` do JSON. A ausência é apenas nesse índice non-RSCF, não prova ausência de comportamento compilado ou recursos aninhados.
- **[O]** Procurei nomes ASCII nos GUAP, RFLX, DLLT, DLLN, stsy, ttsy, gdat, STRC/STSM e FNTR. GUAP contém nomes GUI; STRC/STSM contêm contadores de conquistas/combos; DLLN traz diálogos. Nenhum trouxe tuning nomeado das cinco armadilhas.
- **[O]** Procurei strings ASCII/UTF-16 no executável Vulkan. `EG_FurnitureData_TrapAnimations` em offset de arquivo 0xb15e68 é nome de tipo; `Cooldown` em UTF-16 em 0xb34fd0 é rótulo isolado. Um único byte-match `BHAV` em 0x1533be76 encontra-se entre bytes de instruções, sem header de chunk: não é evidência de resource BHAV. Nenhum desses nomes revela valores ou funções chamadas.
- **[O]** Sensor/alcance, recarga, dano por stat, impulso, duração de bolha/sabão, regras de obstrução, chance Skill, desarme e recuperação seguem desconhecidos. Fontes pesquisadas: os índices furniture/gameplay/resources, seus chunks selecionados, HTXT inglês, GUAP, executable strings e os contêineres nativos relevantes.

## Continuidade verificável

**[I]** A próxima operação de reversão com potencial de fechar valores é resolver o serializer FNTR e as leituras desses slots no código nativo, ou obter os painéis de cada item no próprio jogo acessível. Medir uma animação não basta para dar nome aos floats. Nenhuma alteração de gameplay foi produzida neste rastreamento.


## 5. Continuidade — reader FNTR real no executável

**[O]** Executável analisado: `<native-root>/bin/evilgenius_vulkan.exe`, 411673600 bytes, SHA-256 `c52e656a6bbdfdf4f59aa03bfa0f11425854299e61fb078744e5865847c79042`, PE AMD64, ImageBase `0x140000000`. Ferramentas já instaladas: Capstone 5.0.7 e pefile 2024.8.26. Sem executar o cliente. Seções PE, offsets brutos, hashes das regiões e excertos com bytes originais estão em `native-rules-research.json:1214`, chave `native_code_reader`.

**[O]** O dispatcher compara `0x72746e66` (`fntr`) em VA `0x1406849f1`, desvia para `0x140684b29` e chama `0x140684120` em `0x140684b62`. Este reader aceita versão de contêiner até 7 (`0x1406841b6`), constrói o objeto em `0x140684375` com `0x14064fd60` e chama o reader de registro `0x140651410` em `0x140684382`. O nome do recurso não foi usado para adivinhar esta cadeia: o literal do tag e os destinos de call são instruções observadas.

**[O]** Em `0x140651453`, o reader passa limite `0x9b` = 155 ao helper `0x14008e730`. O helper lê u32, extrai versão pelos 24 bits inferiores em `0x14008e760` (`and eax,0xffffff`) e flag de bit 31 em `0x14008e765`. Com a flag alta, lê u8 e u32 extra, e rejeita a versão acima do limite em `0x14008e7bd`. Portanto `9b` no envelope `01 9b 00 00 80 00 <len32>` é versão de serializer, não rótulo de tipo. O contêiner FNTR v7 e o serializer de registro v155 são versões diferentes.

**[I]** Seguindo os branches do reader para v155 e contabilizando cada chamada de leitura, a posição de stream imediatamente antes de `0x1406529a5` é `B+280`. A contabilidade completa está em `native_code_reader.prefix_accounting` no JSON. **[O]** Os seis prefixos de referências foram verificados em todos os cinco registros: três `version=1,type=0` consomem 16 bytes cada; três `version=1,type=2` consomem 8 bytes cada. Também foram verificados os envelopes de 13 bytes em `B+166` (mapa, count=0) e `B+212` (serializer v0, payload de 4 bytes). Estes tamanhos vêm do helper de referências `0x1401620e0` e dos envelopes, não de alinhamento inferido entre valores parecidos.

| Posição no registro | Destino no objeto | VA do `lea r8` / chamada de leitura | Versão mínima |
|---|---|---|---|
| B+280 | +0x158 | 0x1406529a5 / 0x1406529b4 | 1 |
| B+284 | +0x15c | 0x1406529d5 / 0x1406529e4 | 1 |
| B+288 | +0x160 | 0x140652a05 / 0x140652a14 | 30 |
| B+292 | +0x164 | 0x140652a35 / 0x140652a44 | 30 |
| B+296 | +0x168 | 0x140652a65 / 0x140652a74 | 76 |
| B+300 | +0x16c | 0x140652a95 / 0x140652aa4 | 76 |

**[O]** As seis chamadas usam `edx=4`, destino explícito `rdi+offset` e virtual `call [rax+8]`; os branches usam comparação da versão seguida por `jb` para saltar os campos ausentes. O bloco completo com bytes de instruções está em `native_code_reader.excerpts.six_slot_reads`. Não há nomes de propriedades nesse bloco.

**[O]** O construtor inicializa `+0x158..+0x164` em zero (`0x14064ff09` e `0x14064ff10`), `+0x168` com bits `0x41200000` (`0x14064ff17`) e `+0x16c` com bits `0x3e4ccccd` (`0x14064ff21`). **[I]** Como f32 são 0, 0, 0, 0, 10 e aproximadamente 0.2. São defaults do objeto; os cinco registros sobrescrevem +0x168 com 30. Os defaults também não fornecem nome, unidade ou condição de aplicação.

**[O]** O accessor `0x1406f9a80` retorna o endereço de `EG_FurnitureData_TrapAnimations`; o accessor adjacente `0x1406f9a90` retorna `0x61707274` (`trpa`). Isto liga esse nome de tipo a TRPA. **[I]** Não liga os seis slots FNTR a parâmetros TRPA, portanto não foi usado para atribuir suas semânticas.

**[O]** Busquei padrões SSE `movss` com deslocamentos `0x158..0x16c` nas seções PE executáveis e localizei 108 ocorrências contidas em intervalos `.pdata`. Examinei clusters, incluindo `0x1402fb250`, `0x140520920`, `0x140917f00` e `0x1590a665d`. **[I]** Nenhum desses consumidores foi ligado por proveniência de ponteiro ao objeto FNTR; vários parecem ler outros layouts. Igualdade de deslocamento não constitui evidência de tipo. O padrão SSE tampouco cobre acessos via MOV inteiro, SIMD de largura maior, acesso indireto por getter ou código ofuscado: a busca não prova ausência de consumidores.

**Não confirmado:** nomes/unidades dos seis slots e chamadas que utilizam o ponteiro FNTR após o carregamento. O avanço fechado desta rodada é a associação byte → offset de objeto → versão de serializer, com origem binária rastreável. Não há novo valor semanticamente autorizado para atualizar gameplay. Desmontagens legíveis preservadas: `/tmp/eg2-fntr_record_reader.asm`, `/tmp/eg2-envelope_reader.asm`, `/tmp/eg2-reference_reader.asm`, `/tmp/eg2-fntr-constructor.asm`, `/tmp/eg2-fntr-container-reader.asm` e `/tmp/eg2-fntr-dispatch.asm`; hashes individuais e excertos persistidos no JSON.


## 6. R1 — provenance do ponteiro e usos reais dos seis slots

**[O]** Esta rodada fecha uma associação consumer/parâmetro, com nome GUI nativo e matemática observada: `FNTR+0x15c` normaliza o progresso de `Code/SelectedFurniture/StatBars/TrapCharge` no estado 5. Não há ainda prova da conversão do relógio para segundos ou do nome inglês desse estado. A revisão desta seção supera o limite anterior de “nenhum consumer ligado”; os nomes genéricos cooldown/dano/alcance continuam sem confirmação.

**[O]** Cadeia de ponteiro, observada no mesmo executável/hash da seção 5:

| Passo | Endereços / instrução decisiva |
|---|---|
| Inserção inicial FNTR | `0x1406843af` carrega coleção `0x141a1ff88`; `0x1406843bb` chama insert; `0x1406843cc` chama copy `0x14065bf90` |
| Cópia dos seis slots | `0x14065c420..0x14065c462` copia cada u32 de `rsi+0x158..16c` para os mesmos offsets de `rdi` |
| Reindexação | `0x140650990` percorre ponteiros da coleção bruta; `0x140650bd4` passa esse `rbx` como `r8`; `0x140650bd7` aponta coleção `0x141cb1088`; insert em `0x140650be1` |
| Lookup usado pela instância | `0x14065be10` consulta `0x141cb1088`, busca key u32 e retorna o ponteiro encontrado em `rax` |
| Instância → data | `0x1405beff7` chama lookup; `0x1405beffc` grava `rax` em instance+0x80 |
| Instância → componente | `0x1405d6770` aloca 0x460 bytes; `0x1405d6790` passa instance em `rdx` ao ctor `0x140612590`; retorno vai para instance+0x78 em `0x1405d679b` |
| Componente → instância | ctor `0x14061259d`: `mov [rcx+8],rdx` |
| Componente → data → slot | accessor `0x140619ba0` lê owner em component+8; `0x140619ba4` lê data em owner+0x80; jump table escolhe slot desse data |

**[O]** Não existe vtable no data para resolver esta cadeia: o construtor FNTR e a cópia são de um layout de dados, com referências no prefixo. O componente guarda owner no offset +8. Não foi necessário chamar o data de um tipo RTTI inventado. A consulta global resolve o provenance do data, e o ctor do componente resolve o provenance do owner; por isso o accessor não está mais classificado como um simples match de offsets.

**[O]** A jump table em VA `0x140619c30` tem oito RVAs, indexados por `enum-2`. O enum fica em component+0x332. Estes cinco casos retornam os slots FNTR:

| Enum nativo | Destino de case | Campo data | Registro original | Uso demonstrado |
|---|---|---|---|---|
| 2 | 0x140619be4 | +0x160 | B+288 | duração usada em limite temporal de estado |
| 3 | 0x140619bd1 | +0x158 | B+280 | duração usada em limite temporal de estado |
| 4 | 0x140619bee | +0x164 | B+292 | duração usada em limite temporal de estado |
| 5 | 0x140619bf8 | +0x15c | B+284 | duração usada em limite temporal de estado e progresso `TrapCharge` |
| 6 | 0x140619c02 | +0x168 | B+296 | duração usada em limite temporal de estado |

**[O]** Em `0x140613dee`, o update chama esse accessor com o enum atual; `0x140613df3` lê o float global `0x141ad1c78`; `0x140613dfb` subtrai o resultado do accessor; `0x140613dff` compara com component+0x334. Se `clock - duration > timestamp`, segue para o accessor de próximo estado `0x140619af0` e altera estado via `0x140618240`. Há branches especiais anteriores para o estado 3 e um controlador externo. **[I]** Portanto os cinco campos são durações de fases/estados, na unidade do relógio nativo; não são cinco valores de dano ou alcance. Sem observar o escritor do relógio, a unidade não pode ser promovida a segundos. Setter `0x1406185c8..0x1406185d0` grava o mesmo relógio em component+0x334 na mudança de estado.

**[O]** A associação com nome nativo é mais estreita: `0x140047b66` carrega a string `Code/SelectedFurniture/StatBars/TrapCharge` (arquivo +0xb13370); `0x140047b86` passa global `0x141cb06e0` ao registro GUI. Em `0x1405df059` o painel verifica enum==5, em `0x1405df083` chama getter(enum5), em `0x1405df093..0x1405df09f` calcula `(clock - timestamp)/getter_result` e em `0x1405df0ce..0x1405df0d5` envia esse progresso ao mesmo global GUI. **[I]** O papel confirmado de FNTR+0x15c é duração que normaliza `TrapCharge` no estado 5. LaserWall/BoxingGlove/SoapTrap têm 40; FanTrap/BubbleBlower têm 50. Isto não prova que o estado 5 deva ser chamado cooldown: a designação preservada é exatamente a string nativa `TrapCharge`.

**[O]** O sexto slot segue outro caminho: `0x140615070` usa a mesma cadeia component+8→owner+0x80. Com `r9b!=0`, `0x140615090` lê data+0x16c; caso contrário lê data+0x170. Depois transforma coordenadas inteiras de uma célula, subtrai os centros das coordenadas float de entrada e compara com dois limites espaciais dos quais foi subtraído esse slot (`0x140615120`, `0x140615144`). **[I]** Assim os 0.2 participam de um limiar espacial, não do getter temporal dos estados 2..6. O papel exato do booleano, nome do limiar e escala espacial continuam desconhecidos.

**[O]** Provenance e 14 regiões binárias com SHA-256, offsets PE, bytes/excertos completos, jump table e lista de próximas operações estão em `native_pointer_provenance_R1` no JSON. As desmontagens legíveis estão em `/tmp/eg2-provenance-*.asm`; a evidência necessária foi persistida no JSON, sem depender desses temporários. A busca desta rodada seguiu coleção e retornos de lookup; não repetiu o scan de 108 padrões SSE sem tipo.

**Não confirmado / próxima ação distinta:** rastrear escritores de `0x141ad1c78` para fixar unidade temporal; nomear enums 2..6 pelas ações de `0x140618240` e seus links; seguir callers tipados de `0x140615070` para nomear o limiar espacial e seu seletor. Estes alvos são endereços funcionais já ligados ao FNTR original, não ajuste visual por tentativa e erro. Investigador Skill/desarme/recuperação não foi ampliado nesta fatia.

**[O]** Também foi decodificado o accessor de próximo estado `0x140619af0`, sem nomes: 2→(booleano ?3:4), 3→4, 4→(data+0x18c ?7:5), 7→1, 8→(data+0x18f ?1:2); estados 0/1/5/6/9 retornam o booleano 0/1. O enum 6 não aparece como destino desses casos. **[I]** Para nomear o slot +0x168 (30), a próxima busca deve procurar entradas explícitas em enum6 no setter `0x140618240`, além deste fluxo temporal. Mapa literal e bytes da segunda jump table no JSON `state_next_mapping`.


## 7. R1 continuidade — segundos de simulação e eventos de fase

**[O]** Escala temporal agora confirmada no código nativo; a incerteza da seção 6 foi resolvida. O global `0x141ad1c78` acumula segundos de simulação, escalados pela velocidade e congelados por pausa. A prova completa está em `native_clock_and_states_R1` no JSON, com 11 novas regiões de código e seus SHA-256/excertos. Nenhum cliente foi executado.

**[O]** Frequência: `0x1431069eb` chama IAT `0x159dfb6a8`, cujo hint/name nativo é `QueryPerformanceFrequency`; resultado inteiro em `0x142f645b0` é convertido a float em `0x1431069f7` e gravado em `0x142f6457c` em `0x143106a06`. Init `0x140168b51..0x140168b63` copia esse float para `0x141ad1d30`. Tick `0x140168e3f` chama IAT `0x140a6a2a0`; seus bytes de thunk apontam hint/name `QueryPerformanceCounter` em RVA `0xbf3740` (não uma função desmontável naquele RVA). O delta do contador é convertido em `0x140168e6a`. Em `0x140168fb1`, o código divide frequency por delta; em `0x140168fd4`, divide a constante 1 por esse quociente. **[I]** A unidade do resultado é delta_counter/frequency = segundos, com base no contrato dos dois nomes de API nativos, não numa estimativa de framerate ou vídeo.

**[O]** `0x14016906c..0x140169074` multiplica esse delta pela escala float `0x141ad1c70`; a flag `0x141ad1c74` força delta zero na pausa. `0x140169086` lê clock atual, `0x140169097` adiciona delta e `0x1401690b8` grava o novo clock em `0x141ad1c78`. Init `0x140168ca4` define scale=1.0, vindo dos bits `0000803f` em VA `0x140b4b224`. Existem overrides de passo em `0x141ad1d14` e `0x1419f01c4`; isso não transforma a duração em tempo garantido de parede. **[I]** Os cinco campos temporais dos estados são expressos em segundos de simulação: em velocidade 1, sem pausa/override e sem saída antecipada, correspondem a segundos reais.

**[O]** Nome do evento do estado 2: o setter `0x140618240` entra no bloco `0x14061843d` para enum2, constrói evento com vtable `0x140b14290` em `0x1406184a5` e emite por `0x1406184d1`. O slot +16 dessa vtable contém accessor `0x140612370`; o accessor retorna a string `EG_TrackedEvent_TrapTriggered` em VA `0x140b14050` / offset bruto `0xb13650`. **[I]** FNTR+0x160, portanto, mede o limite temporal da fase cuja entrada registra `TrapTriggered`. Isso não basta para chamar a fase de mount, sensor delay ou ataque: a equivalência com animação permanece na outra investigação.

**[O]** Nome do evento associado ao estado 6: caller `0x14071e17d..0x14071e223` constrói evento com vtable `0x140b1ba28`, emite por `0x14071e211`, passa `edx=6` em `0x14071e216` e chama setter em `0x14071e21e`. O slot +16 da vtable contém accessor `0x1406bb9f0`, que retorna `EG_TrackedEvent_TrapSabotaged` em VA `0x140b1b2f0` / offset bruto `0xb1a8f0`. **[I]** FNTR+0x168 (30 nos cinco registros) é a duração da fase posterior ao evento nativo `TrapSabotaged`. Não é o tempo que o agente precisa gastar para sabotar/desarmar; o evento já foi emitido antes da entrada nessa fase.

| Enum | Campo FNTR | Unidade provada | Associação nativa preservada |
|---|---|---|---|
| 2 | +0x160 / B+288 | segundos de simulação | entrada emite `EG_TrackedEvent_TrapTriggered` |
| 3 | +0x158 / B+280 | segundos de simulação | entrada chama `0x140617380` condicionalmente e `0x140619cd0`; saída chama `0x140619e10` |
| 4 | +0x164 / B+292 | segundos de simulação | próximo estado depende de FNTR+0x18c: 7 ou 5; nome não confirmado |
| 5 | +0x15c / B+284 | segundos de simulação | duração/progresso `Code/SelectedFurniture/StatBars/TrapCharge` |
| 6 | +0x168 / B+296 | segundos de simulação | entrada após `EG_TrackedEvent_TrapSabotaged`; 30 em todos os cinco |

**[O]** Há caminhos explícitos de saída antecipada: `0x14090f2ff` altera estado3→4; `0x140733eb4` avança estado5 usando o mesmo accessor de próximo estado. O update principal ainda tem branches especiais para estado3 e controlador externo. **[I]** Uma reprodução fiel deve preservar essas condições; os números não são durações obrigatórias de toda ocorrência. Os nomes desses callers/ações ainda não foram provados.

**Não confirmado:** nomes nativos dos estados3/4/5, associação de enum2 com phase mount/loop/dismount, a ação que avança estado5 cedo, fórmula/tempo de Skill/desarme de agentes, modifiers adicionais e escala do limiar espacial +0x16c. O relógio e a unidade dos cinco slots temporais já não estão nesta lista de desconhecidos. A evidência de FNTR+0x194/TRPA fica com a investigação responsável, sem novas conclusões aqui.

## R2 — estados 2–5, efeitos e saídas antecipadas (fonte nativa)

**[O]** Em `evilgenius_vulkan.exe` SHA256 `c52e656a6bbdfdf4f59aa03bfa0f11425854299e61fb078744e5865847c79042`, estado 3 entra pelo setter `0x14061841f` e chama `0x140619cd0`. Owner comprovado `component+8 → owner+80 → FNTR`. Dois novos campos concretos: FNTR `+0x1a0` e `+0x1a4`, lidos como u32 desde B+347 e B+351 (reader `0x140652f00/0x140652f30`, versão mínima 46). São entradas de `0x1409678a0` e de seu core `0x1404af3b0`; retornos são handles nos pontos `component+0x190`, contador `+0x19c`, stride 0x60, slots `+0x58/+0x5c`. O segundo depende do byte ponto+0x54. Só FanTrap tem IDs nãozero: `0xf4040360` e `0x9a898a69`; outras quatro armadilhas têm ambos zero. Sem unidade/nome comprovado.

**[O]** Saída do estado 3: setter chama `0x140619e10`; os dois handles nãozero são enviados a `0x1404bebc0` com comando 4 e float zero, então zerados no ponto (`0x140619e51/0x140619e6a`). Esse helper apenas enfileira uma tupla; chamá-lo destruir/parar seria **[I]**, ainda não confirmado. Objeto criado pelo core ocupa 0x160, vtable `0x140b06a88`, ID `+0x28`. Consulta RTTI anterior à vtable não trouxe COL válido; nomes particle/audio/VFX permanecem desconhecidos.

**[O]** Outra entrada opcional `0x140617380` usa input+0x4c → lookup `0x14066abe0`, resolve transform de filhos do owner (`owner+0x70`, `0x1400b0750/0x1405d1f50`) e chama `0x14073ec40`. Este cria objeto de 0x210 via `0x14073b440`, com extensão espacial envolvendo sqrt(input+0x1c) e input+0x28. Tipo, unidades e papel físico não comprovados. Em sucesso seta component+0x45a=1 (`0x1406174e1`).

**[O]** Early-exit interno decisivo: em `0x140613dd4..0x140613e18`, estado 3 avança para 4 sem comparar duração se `0x1405cfa60(owner)` retorna falso OU `component+0x3e4 != 0`. O significado de +0x3e4 não foi provado. Se controller `component+0x3f8` responde verdadeiro em virtual+0x30, virtual+0x38 fornece próximo estado e também contorna o caminho temporal.

**[O]** Early-exit externo estado 3: `0x14090f250` busca actor por caller+0x240, requer actor+0x5c1 bit2, consulta `0x14098a3d0 → 0x1405417f0`, compara ID do owner da component com caller+0x290, exige estado3 e chama setter4 em `0x14090f2ff`. O ponteiro da função aparece em vtable `0x140b401d8`; classe desconhecida. Estado5: `0x140733e2b..0x140733eb4` chega ao furniture owner→+0x78 pela lookup `0x1400b9ba0`, chama nextgetter(5, bool derivado owner+0x4d4 máscara0x7ff) e setter sem clock. Tipo da ação permanece desconhecido.

**[O]** Estes achados não identificam estados2/3/4 como mount/loop/dismount. Nomes e vínculo com phasekeys do actor são não confirmados. JSON `native_state_effects_R2` preserva 11 regiões com VA, offset físico, bytes, SHA256, disassembly e valores de todos os cinco FNTR. Ferramentas Capstone5.0.7/pefile2024.8.26; só leituras estáticas. Próxima rota concreta: consumidor da fila de comando4; origem do controller+3f8; escritor de component+3e4.

## R3 — transporte da configuração TRPA e payload da chave ativa

**[O]** Produtor novo `0x140544680`: aloca evento tipo u16 `0x808e`, payload0x28 bytes via `0x140360970` (`0x1405446ad`); payload em event+0x18. Copia source+0x18 → payload+4, source+0x60 → payload+8, source+0x1c!=0 → payload+0x24, argumento r8b → +0x25, source+0x74byte → +0x27, outros campos exatos no JSON. Publica em `0x140544748` via `0x140360140`, com event[0]=2, event+4=actorID resolvido por owner+0x10→+8 virtual+8, event+0x20|=1. Receptor `0x140753ae0` lê event+0x0c u16; jumptable `0x140753f80` entrada9 (8085+9=808e) aponta `0x140753e93`, passando event+0x18 ao `0x14075ba90` em `0x140753ea7`.

**[O]** Único caller direto do produtor: `0x1405432b0`, dentro `0x1405431c0`. Mesma função constrói controller com campo tipo+8=0x85 (`0x1405432e9`) e vtable `0x140b0d3e8`; publica seu ponteiro em r9 e actorID/ecx e chave/edx via `0x140108320` (`0x140543332`). Chave ESI vem de source+0x18 → lookupFNTR65be10 → FNTR+0x1a8 (`0x140543231`), ou fallback `0xa90fe010` (`0x140543247`). Reader652f60 mapeia FNTR+1a8 como u32 desde B+355, versão mínima36. Os cinco FNTR têm zero neste campo. **Não é comprovado que essa chave de seleção do controller seja a chave ativa da animação.**

**[O]** Caminho da chave ativa: `0x14059e580` lê hash do evento em source+0x10; compare `0x14059e5cc` com0x267d5762 seleciona `0x14059e80b`. Extrai stream[rbx], version1 e u32 em rbp+0x77 (readvirtual+8 em59e89e). Exige controller rdi+0x28 com tipo+8=0x85, resolve actorID por rdi+0x10→+0x40→+0x90→52c840, chama7535c0 em59e91d; este escreveedx em actor+0x714 em7535f1. Setter também replica chave para actor+0x618 via52b1b0 e outros campos explicitados no JSON.

**Não confirmado:** produtor do evento hash267d5762, nome textual da classe85, nome/semântica do fallbacka90fe010, vínculo demonstrado de mount/loop/dismount com o payload. A varredura ASCII lowercasepolynomial31 do exe não encontrou nome equivalente267d5762; isso não nomeia nenhum evento. A checagem gameplay/index não contém tagsBHAV/STMA/BTRE, e checagem do primeiro4bytes de assets*.bin não encontrou essas tags: limite do método, não prova de ausência. JSON `native_phase_transport_R3` guarda11 regiões com bytes/VA/offset/hash. Próxima ação diferente: seguir script selecionado pelo controller85/fallback e sua callback para o evento267d5762; primeiro localizar inventário/header correto dos recursos de comportamento.

## R4 — origem do UID alternativo e limite da hipótese de script

**[O]** `source+0x60` do produtor808e é campo de um parâmetro dinâmico por actor: `0x1405445f0` resolve global `0x141bfaa40 → +0xb0`, map+0x10 keyed actorID e retorna via2c0e60. `0x1405431c0` recebe exatamente esse pointer em rdx e repassa ao produtor544680. Escritor novo `0x140989090` consulta o mesmo manager+0x10/actorID (`0x14098911b`), retorna pointer emr13 (`0x140989126`, salvo rbp+0x58 e restaurado durante função). `0x14098a35e` escreve param+0x60. Alteração incrementa param+0x8 (`0x14098a357`), que5431c0 compara controller+0x60 antes de emitir808e: alternateUID alterado pode invalidar seleção mesmo sem mudar FNTR.

**[O]** Origem do valor: actor+0x548→getter96cba0 (`0x14098a31b`); getter resolve virtual+0x38handle→0554e0→object+0x48→+0x30resourceID→649fb0→649770, que consulta resource+0xe8 mapping e tabela global0x141a213d0. Registro retornado alimenta **+0x40 ou +0x44**: escolhe+44 somente se trapcomponent nãozero e component+0x454==record[0]; caso contrário+40 (`0x14098a335..0x14098a34e`). Branch record+0x3c!=0 e param+0x14==999 deixa defaultzero. Tipos, nomes dos campos e tag do recurso ainda não comprovados. Nenhum valor foi atribuído por aparência ou filename.

**[O] Correção de rota:** 108320 não prova chamada direta de script. Serializa controller por virtual+8, e1083f1 chama108170 que aloca evento tipo0xe8 (1081f5), payload24+comprimento; chaveedx vai payload[0], buffer vai payload+0x18 (10829f), publica360140(1082ef). R3 citou procurar script como hipótese de próxima rota, não fato: receptorE8 precisa ser rastreado antes de dar nome.

**Não confirmado:** produtor do evento267d5762 e equivalência da chave ativa com mount/loop/dismount. Helpers110730 e110ab0 apenas consultam mapas(hash→pointer), não expõem execução/nome de callback. Duas rotas delimitadas: transporte controllerE8 e registroCode genérico; não repetir probes literais de recursos já tentados. Próxima alternativa concreta: receptorE8→controller/graph; em paralelo conceitual, insertion/serializer da tabela141a213d0 para provar tipo dos alternatefields+40/+44. JSON native_phase_origin_R4 preserva12 regiões novas com VA, offset,bytes eSHA256.

## R5 — parser do registro que fornece os dois UIDs alternativos

**[O]** Loader `0x140671390`: enumera registry category `0x778ac315` e entry-type `0xfa89a1c0` via110070(count) e1101e0(entry,index), aloca objeto em allocator141a21400, insereentry[0]→pointer na tabela valores141a213d8/chaves141a213e0 e chama parser670ec0 em6714df. Isso identifica fonte como registro de propriedades nativas; não foi encontrada tag/filename do recurso nem nome textual da categoria.

**[O]** Parser670ec0 chama670af0 para base e lê propriedade hash `0x1575d55e` (lookup670f2c→10e3a0). Exige discriminador nativo3, lê u32property+8 e grava objeto+0x40 em670f49; defaultzero. Propriedade hash `0x3090f6b3` (670f4c→10e3a0), também exige tipo3 e grava objeto+0x44 em670f5e. Se ausente/tipoerrado/zero, copia **valor+0x40 para+0x44** em670f6a. São exatamente os dois campos consumidos em R4 para UID alternativo. Nenhum nome/ unidade foi adivinhado.

**[O]** ASCIIstrings doexe, polynomial31lowercase/exactcase: nenhum match para os quatro hashes da categoria/tipo/propriedades. Na rotaE8, scan delimitado dos comparadores nativos diretoscmpregisterimmE8/wordE8 nas seções executáveis retorna0candidates: o receptor pode usar subtração/range/jumptable, logo isso não provaausência. Produtor267d5762 permanece unknown.

**Próximo alvo diferente:** registro/factory que instancia e desserializa controller85 e vtable do router de eventosE8; para nomes dos alternatefields, tabela de strings/registryroot lida1101e0/10e3a0. Não repetir scans de igualdadeE8 ou hashesliterais. JSONnative_alternate_registry_R5 guarda4regiões comVA/offset/bytes/SHA256 e a regra de fallback. Todos os demais arquivos preservados.
