# Laboratório de armadilhas — direção do protótipo

## Brief aceito

Reconstruir uma arena web usando a biblioteca de Evil Genius 2, em `prototypes/`,
comparar com imagens oficiais da internet e abrir no navegador quando funcional.
Correção solicitada em seguida: agente com caminhada funcional, sem aparência de
malha estática deslizando. Não modificar Rabisco.

Direção posterior: fidelidade ao comportamento e à apresentação do recorte real de
Evil Genius 2. Prioridade explicitada por Alan: obter informações diretamente dos
arquivos do jogo, sem ajuste de parâmetros por tentativa e erro. O goal usa o livro
`docs/gauntlet-fidelidade-eg2.json`; a cadeia autoral anterior é baseline, não aceite.

Lente: Criar/Operar. Recorte: uma arena e cinco dispositivos. Verbo: montar a
cadeia por posição, orientação e alimentação; enviar agentes; observar, corrigir
e repetir. Não é reconstrução do jogo inteiro nem execução do Asura.

## Critérios e evidência

- Cenário controlável, agente manual/onda e dispositivos editáveis: `qa.mjs`.
- Mesmo agente recebe ventilador, luva, bolha, piso e laser: teste lógico e captura ao vivo.
- Orientação, localização, recarga e alimentação alteram o resultado: casos negativos.
- Corpo articulado caminha, reage e congela na pausa: `walk-qa.mjs` e `capture.mjs`.
- Montagem salva reaparece: teste pelo navegador, com posição alterada e cenário aberto.
- Proveniência e limites acessíveis: rodapé, diálogo, manifesto, regras e README.

## Design system

Fonte visual: captura oficial Trap Combos. Piso verde claro, parede cinza com faixa
laranja, máquinas arredondadas laranja/metal e agente cartunesco. A cena domina a
tela; bancada de cinco modelos embaixo, controles ao lado. Texto de corpo com
14px; rótulos e metadados a partir de 12px. Realces dourados indicam seleção,
verde indica acerto e a alimentação tem texto além da cor.

Câmera inclinada com órbita, zoom e modo de seguir agente. Iluminação difusa com
sombras suaves. Preservar geometria e resolução nativas; qualidade não foi reduzida
para alcançar a cadência. Atribuição de shader, montagem do cenário e animação são
inferidos/reconstruídos e registrados como tais.

## Decisões tomadas sem Alan

Arena autoral com sensores espaciais, onda de seis e regras determinísticas.
Valores de combate e temporização marcados `assumed`. Preservar oito influências
de skinning e usar a hierarquia nativa com caminhada procedural no baseline.
Biblioteca somente leitura. Servidor em loopback, sem publicação externa.

## Limites

Não há equivalência certificada com física, pathfinding, clipes, shader ou balanceamento
originais. O corredor é um laboratório de cadeia, sem economia, pesquisa ou campanha.
Aceite visual do usuário permanece aberto; testes técnicos não substituem esse aceite.

## Divergências do baseline de fidelidade — R0

Inspeção do código em 02/10/2026; hashes e regras congelados em
`evidence/fidelity-baseline.json`. Os itens abaixo descrevem o baseline daquela etapa;
as correções posteriores são registradas nas seções seguintes.
O esperado original depende de fonte nativa decodificada e conferência em movimento.

1. `simulation.js`, bolha: substitui o movimento por `vx = speed, vz = 0`,
   independente da origem do impulso. A direção global faz a cadeia avançar.
2. Piso: impõe velocidade na direção do dispositivo. Não separa a condição de
   escorregão de um impulso causado por outro dispositivo.
3. Sensor: `hits.includes(type)` impede novos acertos de um mesmo tipo para sempre,
   mesmo após recarga ou em outra instância do dispositivo.
4. Recuperação: ao expirar `until`, retorna imediatamente à caminhada em +x.
   Não há aterrissagem, levantar-se, retomada de navegação ou fases de recuperação.
5. Bolha e luva: altura usa um arco senoidal autoral; a suspensão, o lançamento e
   suas transições não vêm das animações ou trajetórias do pacote.
6. Parede: limita somente z, rebate a velocidade e não aplica dano de impacto.
   Cenário aberto conserva esses limites invisíveis.
7. Combate: somente HP e dano instantâneo no disparo. Skill, percepção, desarme,
   atributos adicionais e bloqueio por corpos não estão implementados.
8. Laser: sensor em faixa e um dano instantâneo por acerto; não representa a
   duração do feixe e a relação entre permanência no feixe e dano no original.
9. Combo: contabiliza vitória com cinco tipos na lista histórica; não verifica
   continuidade da incapacitação. Recuperações não interrompem essa lista.
10. `rules.json`: danos, velocidades, alcance, recarga e duração são `assumed`.
    Os testes atuais repetem esses números; não demonstram que sejam originais.
11. `actor.js`: malha, pesos e hierarquia são nativos; caminhada e reações são
    poses procedurais. HCAN ainda não reproduzido, incluindo captura e recuperação.
12. Montagem, efeitos, iluminação, portas e UI são reconstruídos. Não há mapa,
    shader, animação de dispositivo ou interface do Asura em execução.

Não substituir as lacunas por novos números ajustados visualmente. A leitura de
bytes comprova bytes; o nome de um campo, a unidade e sua função exigem evidência.

## Fonte direta — R1 em andamento

Lente: inspeção de movimento extraído. Sucesso deste recorte: reproduzir amostras
nativas com as operações locais rastreadas no executável, identificando o que
ainda é integração web. A bancada `native-motion.html` é separada da arena.

52 clipes HCAN22 foram decodificados e 65 controles independentes passaram.
O executável original confirmou quantizador, interpolação nlerp, composição
bind × delta e posição relativa condicionadas pelas flags. Clipes de caminhada
de prisioneiro e Super Investigador permanecem controles distintos; a caminhada
comum usa a fonte específica `Rig_A/Investigator/Walk`.

As cinco malhas de dispositivo têm 25 ossos e 28.522 vértices referenciados com
pesos válidos. A bancada conserva seus pivôs e trilhas; não abre portas por
deslocamentos escolhidos visualmente. O corte sem piso revela a parte enterrada
dos dispositivos. Naquela etapa a arena principal conservava o baseline; caminhada,
reações e ciclo do ventilador foram integrados posteriormente, conforme abaixo.

O fator de retarget agora está provado como 1. A razão de comprimentos só se
aplica acima de f32(0,01), antes de testar flags relativas, conforme o executável.
O relógio de gameplay usa segundos de simulação, com pausa e multiplicador de
velocidade; 25 limites temporais FNTR foram ligados aos cinco estados. A carga
do estado 5 tem divisor 40/50. O estado 6 começa após o evento de sabotagem e
tem limite 30; nenhum desses números foi renomeado para dano ou velocidade.

Os TRPA3 das cinco armadilhas contêm 685 referências a 61 clipes, em 175 mapas
de 7 grupos. O grupo secundário do piso possui MovementLoop; o vínculo com o
momento de escorregar ainda precisa do produtor da interação. O consumidor original
agora está rastreado: usa actor+0x118 como índice unsigned 0–24, consulta a fase por
hash e toma o primeiro hash de clipe do vetor. FNTR+0x194 fornece o conjunto padrão;
parâmetros da interação controlam grupo secundário e conjunto alternativo. A bancada
permite consultar e reproduzir essa seleção com parâmetros explícitos de inspeção.
Isso não confirma quais parâmetros o investigador recebe no jogo.

O binder concreto liga model+0x70 ao movimento, e motion+0x10 ao modelo; o update
transfere a posição integrada aos registros do ator. Helpers de interação giram
apenas XZ e preservam Y; o converter usa centros de célula em XZ e uma tabela runtime
em Y. Essas operações não provam o sinal vertical nem a colisão geral.

Persistem lacunas materiais: sinal vertical, implementação dos slots do transform,
integração do movimento com navegação/colisão, nomes dos estados, origem do índice
TRPA e dos parâmetros da interação, e fórmulas FNTR de gameplay ainda não rastreadas.
`evidence/fidelity-reference.json` inventaria 34/34 casos;
nenhum caso completo foi promovido a fiel nem houve aprovação de Alan.


## Referência observada e produtores da seleção

O vídeo público Evil Genius 2 Trap (Kiall vun Myeret) foi reproduzido e
inspecionado nos controles do navegador. `evidence/gameplay-observation.json`
registra quadros de 5, 10, 15, 20 e 25s e limites da observação. O ventilador
alterna placa recolhida no piso e rotor elevado; lasers formam uma grade vermelha.
A câmera acompanha o alvo e muda de escala: não foram medidos alcance, velocidade
ou dano por armadilha. O vídeo contém outros dispositivos e não prova nossa cadeia
de cinco. Capturas e hashes estão no Drive, pelo recibo.

O parâmetro alternativo TRPA vem de um mapa por ator: manager+0xb0/map+0x10.
Seu writer copia campos +0x40/+0x44 de um registro resolvido por actor+0x548;
nomes e tipo desse registro permanecem desconhecidos. Controller85 é serializado
num evento E8, não demonstrado como chamada direta de script. A próxima investigação
é seguir o receptor E8 e o serializer da tabela 0x141a213d0. O índice actor+0x118
tem default 0 no construtor; o valor atual em partida não foi provado. Snapshot e
base virtual foram excluídos como writers diretos, com limites de cobertura.

Naquela etapa, a arena ainda usava gait/regras do baseline; a integração atual está descrita abaixo, sem equivalência integral declarada.


## Caminhada extraída integrada na arena — comparação R1

`app.js` carrega Investigator_walk_revolvers_01 pelo índice de exports; `actor.js`
aplica suas posições e rotações usando `applyNativeClipPose`, também usado pela
bancada. O shader de oito influências foi movido sem alteração para
`native-skinning.js`, evitando dependência circular. Foram removidos o gait por
seno, o ciclo assumido por distância e a correção autoral de altura dos pés durante
a caminhada. A origem do clipe permanece identificada por SHA256. O campo de tempo
usa o relógio da simulação reconstruída, congela na pausa e reinicia ao voltar à
caminhada; esse início e a transição de 0,18s são nossos, não eventos nativos provados.

`walk-qa.mjs`: caminhada, pausa e retorno após ventilador, inicialmente 9/9 verificações; agora 13/13, incluindo avanço derivado, relógio da pose e revólveres.
`native-motion-qa.mjs`: 22/22, incluindo os 52 clipes, após compartilhar o sampler.
O teste lógico anterior também passa; sustenta somente regressão do baseline.
O avanço em `native-walk-motion.js` deriva os dois extremos do canal extra
(1,2999999523162842 unidades em 1,1333333253860474s) e aplica a razão nativa
entre comprimento bind e scalar: aproximadamente 1,147059 unidades/s. A arena
usa esse avanço e o mesmo relógio para amostrar a pose; ambos congelam na pausa.
O teste lógico agora também consome essa derivação. A orientação +Z→+X, escala
unitária, início do ciclo e transições permanecem configuração reconstruída.
Não é uma velocidade observada em partida nem prova de aceitação pela navegação.

O revólver `ohw_ranged_pistolinvestigatorsrevolver`, já extraído na biblioteca,
foi anexado a bn_L_weapon/bn_R_weapon com transformação local identidade. O mesmo
helper serve arena e bancada; nenhum offset foi ajustado visualmente. O recurso
é original, a associação é inferida pelo nome e ossos do clipe. Ainda falta provar
a regra de equipamento e visibilidade do ator no cliente.

Naquela etapa permaneciam abertas: seleção e entradas do ator, 13 trilhas sem
correspondência, navegação/colisão, reações procedurais, física e atalhos da cadeia.
A continuação abaixo substitui as poses procedurais; os demais itens seguem abertos.
A investigação do registro alternativo agora liga duas propriedades hash aos
campos +40/+44 e comprova o fallback +44→+40; nomes e receptor E8 seguem unknown.

A arena deixou de conservar integralmente o baseline de animação. R1 permanece
em andamento, R2 não foi fechada e nenhum dos 34 casos foi certificado como fiel.

## Poses de reação extraídas na arena — continuação de R1

`native-reaction-bindings.js` usa as operações nativas do seletor TRPA para
obter a fase loop das cinco famílias. Os inputs do experimento são explícitos:
slot 0 (default do construtor recuperado, não valor observado em partida),
grupo primário e UID da família como alternate. Este último é necessário para
bolha/piso, cujo FNTR aponta originalmente para Killer_Bees. A montagem web
ainda não prova qual alternate o cliente escolheria para este investigador.

`actor.js` substitui as poses procedurais pelos clipes resultantes, sem alterar
as amostras. O relógio é tempo desde o acerto reconstruído, módulo duração
original; mount/dismount e transporte dos eventos não foram transplantados.
A interpolação de transição continua autoral, em 0,18s, agora também para posições
dos ossos. Ela é desligada ao terminar: o slerp do Three.js normaliza quaternions
mesmo em t=1; mantê-lo alterava valores estáticos originais e sinais.

`simulation.js` remove a parábola vertical inventada de luva/bolha, pois as
translações locais dos clipes já compõem suas poses. Integração vertical do
parent original ainda não é conhecida. Laser passa a entrar em reação também
quando o dano reconstruído não derrota o agente. Dano, impulsos horizontais,
recarga, retorno à caminhada e o atalho histórico da cadeia ainda são assumidos.

`reaction-qa.mjs` compara arena e bancada para cada família: 81 posições e
rotações locais por amostra depois da transição, pausa, origem e finitude.
Isso prova aplicação consistente do clipe escolhido, não equivalência com o
cliente ou uma cadeia nativa. As capturas deixam essa distinção verificável.

A rota adicional `evidence/native-actor-slot-route.json` exclui stores diretas
para actor+118 em 757840/75b920 e confirma o getter virtual +10 como actor+4cc.
São quatro janelas de bytes e 856 instruções; setters indiretos permanecem unknown.
Nenhum dos 34 casos completos foi promovido e o goal continua ativo.


## Direção do controlador e cadeia sem atalhos — continuação de R1

A rota `evidence/native-controller85-route.json` associa o controlador 0x85 à
fábrica e desserialização, lê o campo FNTR+0x1b0 nas cinco famílias e segue os
parâmetros de direção de montagem até os canais da animação. Modo 1 recupera
actor+0x718; modo 0 não fornece esse vetor. A direção é produzida a partir de
coordenadas inteiras e orientação de montagem, não de uma velocidade arbitrária.
Naquela etapa faltava demonstrar o consumidor dos eventos f05c69fc/d87366dd;
nenhuma velocidade da reação foi alterada com base em semântica não comprovada.

O histórico não concede mais imunidade por tipo. O bloqueio de contato por
dispositivo até sair do sensor é uma regra reconstruída explícita. O contador
separa histórico dos cinco tipos de um episódio sem retorno à caminhada. Na
montagem inicial atual, há duas recuperações e zero episódios com cinco tipos;
o agente recebe os cinco acertos e é derrotado pelos valores autorais preservados.
O sucesso antigo do contador era um falso positivo, não evidência de combo nativo.

Controles: 11/11; caminhada: 13/13; aplicação de poses de reação: 35/35,
comparada aos 81 ossos da bancada. Auditoria: 159 janelas de bytes, 760
referências e rejeição de 15 prefixos FNTR/18 recursos TRPA malformados.
Recibo atual: `evidence/contact-episode-qa.json`. A execução continua web em
Three.js, sem executar Asura. Física, inputs, fases e recuperação nativa permanecem
pendentes; R1 está aberta e nenhum dos 34 casos está integralmente certificado.

### Continuação: receptores de direção e destino na fonte original

O receptor f05c69fc foi ligado ao getter 0b6f90/vtable ad3dc0/handler 0b5980;
ele forma uma base e guarda um quaternion. O receptor d87366dd foi ligado ao
getter 0b7010/vtable ad3e60/handler 0b5430; ele guarda um destino XYZ e scalar
extra. Registro e entrega foram seguidos pelo mesmo hash e pelo ID do canal.
Não são impulsos ou velocidades. Endpoints vêm de channel+8/+c, limitados a0..1;
modo vem de channel+50. A aplicação de destino usa interpolação linear ou
progresso derivado do comprimento da posição extra amostrada do clipe, conforme
as guardas originais. Modo1 substitui Y de destino por Y inicial+scalar do evento.

O relatório `evidence/native-controller85-route.md` explica essas operações e
seus limites; o JSON guarda 28 janelas de código e11 de dados. A auditoria passou
com183 janelas globais,760 referências,2 receptores e6 estados do listener
conferidos. Esses estados não são uma prova da recuperação da armadilha.
Faltam registros concretos dos canais, conversão do progresso para o relógio de
jogo e integração do objeto/transform ao ator. Mantivemos a simulação intacta;
esta etapa é extração/análise estática, não execução original. Próxima ação:
resolver esses registros e setters para portar a trajetória com dados nativos.
R1 e goal ativos;0/34 casos completos.

## Ciclo nativo do ventilador integrado — R1

Intenção → aceite deste recorte: substituir o ventilador permanentemente elevado
por malha/skinning/poses de dispositivo extraídos, com sete ossos coincidindo com
a bancada durante abertura, operação, recolhimento e repouso. Fonte: `trap_fan`
e três HCAN `Giant_Fan_{Mount,Loop,Dismount}_01`; `native-fan-cycle.js` usa
`NativeRig` compartilhado. O corpo do agente e a física não receberam novos
parâmetros. O sampler preserva oito influências e nenhuma pose recebe deslocamento
manual para se ajustar ao piso.

Comparação inspecionada com o baseline, a bancada e o quadro observado de 15s
do vídeo original H8SlL7RRNBo (`evidence/gameplay-observation.json`):

1. **Corrigido:** rotor antes permanentemente elevado; agora tampa recolhida,
   abertura articulada, operação e recolhimento usam as amostras dos três clipes.
   Sete amostras comparadas, sete ossos; erro de posição e quaternion zero contra
   a bancada. Isso não é uma comparação com a execução do original.
2. **Corrigido:** caixa enterrada apareceu abaixo da arena fina numa captura de
   inspeção. Corte de renderização Y=0 oculta a parte subterrânea, incluindo
   sombras; geometria/ossos permanecem completos. A bancada continua sem piso.
3. **Aberto:** início no acerto reconstruído, uma passagem do loop e repouso
   pelo fim de Dismount são escolhas nossas. Durações de clipe não demonstram
   duração da operação, recarga ou seleção original dos eventos.
4. **Aberto:** orientação mundial, impulso e sensor não receberam semântica
   nativa completa. Layout de QA com ventilador virado à entrada é deliberado
   e não é o mapa original. A cadeia default ainda recupera duas vezes.
5. **Aberto:** fonte em câmera móvel permite confrontar forma e recolhimento,
   mas não medir escala física, temporização, material/shader ou pixels idênticos.

QA real GPU Metal: ventilador 42/42 por amostra e cinco checks agregados; caminhada
13/13; reações 35/35. Recibo `evidence/native-fan-cycle.json`. Sem aceite artístico
de Alan, nenhuma rodada de fidelidade ou caso inteiro foi concluído.

Decisão reversível sem Alan: corte visual somente na caixa enterrada do ventilador,
para representar oclusão pelo chão autoral; não há simplificação de geometria,
resolução ou skinning nem alteração dos clipes.

Próxima fonte: localizar os registros concretos dos canais de direção/translação
e seus vínculos de fase/owner, usando parser/fábrica e referência estrutural.
Varreduras literais de quatro hashes em 1.502 FAAN/COMA e 483 fnas não tiveram
resultados. Isso exclui somente aquela representação literal; não prova ausência
dos canais nos pacotes e não autoriza números novos. Não repetir essas varreduras.

## Registro de canais HCAN e destinos do ricochete — R1

O leitor nativo `140125a60..140125c28` resolveu a localização dos canais:
array polimórfica no tail HCAN, após hashes de ossos e metadados. O novo parser
consome integralmente essa região em 85 clipes (52 da bancada, 70 referências
TRPA, união85). São 35 registros, 28 bases confirmadas e dois canais vetoriais
completos. Payloads sem leitor de subtipo comprovado permanecem opacos.

1. `FanTrap` referencia `BounceOff_Mount_A_01` em20 entradas serializadas. Seus
   canais `TrapBouncePosition` e `MoveToPinnedPos` usam evento de destino de
   translação `d87366dd`, modo0 e intervalos brutos 0..f32(.033) e
   f32(.2)..f32(.2), respectivamente. Não são velocidades nem cooldowns.
2. O produtor `545xxx` emite o primeiro evento com XYZ dinâmicos e guarda uma
   posição em actor+420/424/428. A consulta de controller85 para o segundo canal
   recupera esse destino e retorna tipo1. IDs, registros, receptor e produtor
   foram ligados por bytes/offsets; a origem dos endpoints e guards permanece
   aberta. Nenhuma interpretação de colisão foi aplicada por semelhança de nome.
3. A auditoria recompõe as85 extrações, rejeita360 recursos corrompidos e
   confronta207 janelas nativas (144 gerais e63 de regras), além de760 refsTRPA.
   Fontes e reprodução: `evidence/native-hcan-listeners.md` e JSONs homônimos.
4. O runtime não mudou. A QA anterior de ventilador/caminhada/reações permanece
   a última observação em movimento. Zero cadeias contínuas no default e0/34
   casos integrais; não há nova aprovação de fidelidade.

Decisão reversível sem Alan: parser estrito para HCAN22/kind2/envelopes sized
observados; versões ou encodings não comprovados são recusados. Nenhum valor
bruto recebe papel de gameplay sem consumidor comprovado. Biblioteca readonly.

Próximo recorte: seguir os inputs e callers de `545xxx` que escolhem os destinos
de ricochete, recuperando colisão e guards. Pronto quando endpoint → evento →
listener → objeto tiver vínculo comprovado e testes negativos reproduzíveis.
Até lá, não portar esses intervalos para a física por tentativa e erro.

## Grade e contato ligados à atualização do ator — R1

A evidência estática agora liga `543370→543c10→5449e0→TrapBouncePosition`.
O update consulta um registro por dono; flags actor+5c1bit0/actor+5c2bit1
podem suspender sua translação normal. O contato consulta células0/1/2 com
guards de índice, ponteiro e móvel. O fallback examina até nove vizinhas; o
ramo de móvel também pode usar um ponto transformado mais próximo. Não há
novo nome semântico atribuído às classes da célula.

`native-grid-transport.js` porta somente a correção lateral e a aritmética
fechada dos destinos, preservando float32. Providers de célula/escape e inputs
são obrigatórios.19 checks passaram; não se trata de execução original nem
comparação de gameplay. JSON e prova: `evidence/native-bounce-grid-route.md`.
A auditoria confere234 janelas, nove constantes e três chamadas dessa rota.

O loader da grade lê escalas de configuração tipada: defaults1/-1/1 são
insuficientes para certificar o mapa. Uma busca dos cinco hashes novos em483
fnas foi negativa; limite somente literal, sem prova de ausência. A varredura
integral de instruções do executável protegido foi interrompida pela própria
sessão, confirmada terminal; a busca por stores forneceu candidatos que foram
conferidos em limites de instrução. Não repetir aquela varredura ampla nem a
busca literal: seguir namespace/group do loader.

Decisão reversível sem Alan: manter o porte isolado até configuração, bytes de
célula, provider e owner terem vínculo comprovado. Não conectar defaults ou
callbacks autorais sob a alegação de física original. Os dez hashes do runtime
coincidem com a última QA; não há captura nova nem nova aprovação. Zero cadeias
contínuas no default e0/34 casos integrais. Próxima fonte: lookup tipado
`110730→110ab0→10e3a0` e população/classificação da grade nativa.

## Configuração BLUE ligada ao loader — R1

`12841b BLUE→1284be/113fd0→1105e0` registra namespaces; grupos são lidos por
`10e700`. Os lookups conhecidos chegam ao BLUE de `misc/common.asr` SHA48a1644e…:
namespace212de4f7/group2666f252, sem pai. Escalas f32 X1,Y3,Z1, com negação deY
no loader, portanto configuração [1,-3,1]. O inicializador da célula lê
e603206f/u32, valor497004c7; o dado por piso pode prevalecer sobre esse padrão.

`decode-native-grid-config.py` lê nove grupos/42 propriedades; a extensão com
contador2/104 bytes permanece opaca.14 corrupções ou bindings inválidos recusados.
`trace-grid-config-source.py` preserva16 janelas novas; auditoria250 janelas,
cinco chamadas novas e os quatro valores por offset, além dos checks anteriores.
Prova: `evidence/native-grid-config-route.md` e JSONs homônimos/config.

O construtor e `5fe100` ligam resource96bit0→cell4abit7 e resource98bit0→bit6;
classe1 depende do sinal de4a. Não foi inventada equivalência entre flags ENTI
e esses bytes. A factory/leitor desses recursos foi resolvida na continuação
abaixo; ainda faltam mapa moderno,
overrides, providers e o relógio do registro. O runtime não mudou; última QA
continua válida só para seus hashes.0/34 casos integrais, zero cadeias default.

Decisão reversível sem Alan: parser especializado no BLUE selecionado, recusa
formato ambíguo e conserva extensão opaca.

### Tipos de célula diretamente do BLUE — continuação R1

Namespace94de9754 no BLUE SHA dc34cd11… de `misc/common.asr` offset831852:
195 grupos,59 descendentes de997288ff.694800 usa110070/1101e0 e chama662030
para registrar ID/ponteiro na tabela141cb1358, consultada por661d40.660770
resolveafe7e835→resource96 e fed53b01→resource98 por10e3a0 com herança;
ausência/tipo errado retorna zero no consumidor. Modo globalfalse seleciona39
filhos diretos, true49 folhas descendentes; modo da partida desconhecido.

`decode-native-cell-types.py` preserva118 valores e fontes herdadas. Dirt
497004c7 tem96true@22390,98false herdado@31091; Corridor2a5b912a herda96false
@31806 e98false@31091. No baseline do construtor, cell4a132→classe1 e4→classe0.
São strings brutas e resultados condicionais, não classificação deduzida de
aparência ou prova de células instanciadas.

Porte isolado dos bits e prefixo5453a0,1424 checks (incluindo1280 combinações
de preservação de bits); continuação dependente de cena fica `requiresScene`.
Auditoria262 janelas,118 valores, sete calls novas, sete definições inválidas
recusadas e cinco asserts de herança. A arena não consome esse porte ainda;
0/34 casos integrais. Prova consolidada em `evidence/native-grid-config-route.md`.
Continuação nativa:5d36ae resolve cella8 e passa metadados de footprint ao
setter6024b0. Este liga48bit7 e grava três slots84/88/8c; slot2 recebe bool
derivado de tipo2 em48bit0. Remoção6026d0 exige ID correspondente e recalcula
bit7 conforme slots diferentes de999. Lookup5f4820 é mapa de donos, não
produtor/refresh de flags. Essas funções estão preservadas no relatório;
o vínculo aos registros específicos das armadilhas ainda falta.
Próximo: footprints/IDs/donos, ENTI moderno e vínculo aos dados de piso,
depois registro/relógio do transporte sem completar providers por suposição.

### Footprints16 e consulta de contato — continuação R1

`decode-native-footprints.py` lê o caminho FNTR155 desde o prefixoB+355/398
até o contador de células e os envelopes16 de658950. Fan16, glove8, bubble8,
soap4, laser16:52 payloads completos, dois envelopes intermediários opacos por
recurso.260 campos conferidos por offset e40 corrupções/ambiguidades recusadas.
Todos osfield4 são0; o flag15 étrue somente nas16 células do FanTrap.
Field8 permanece sem rótulo de comportamento, mesmo quando vale2.

`545456→5d2ff0→5d3140` liga esse flag à busca do objeto em células: origem,
deltasint32, dimensões e mismatch vêm da instância, não do bounding box ou raio.
Porte da busca indexada e classificador completo em `native-grid-transport.js`,
1715 checks com fixtures explícitas, incluindo guards de campos332/7c,
segunda consulta de dono e releitura dos flags após lookup. Não integrado à
Arena, que ainda precisa desses providers vinculados à cena e ao clock.
267 janelas nativas conferidas;0/34 casos completos e zero cadeias default.
Prova consolidada: `evidence/native-grid-config-route.md`/`native-footprints.json`.
Próximo: componentes78/a0 e seus campos332/7c, instâncias/deltas/rotação/overrides,
ENTI moderno/pisos e inputs do registro de transporte. Nenhuma velocidade,
sensor, dano ou duração foi ajustado por tentativa nesta etapa.

### Decisão nativa de estado e duas máscaras de contato — continuação R1

Lente: fidelidade das decisões, usando produtores/consumidores do executável.
Prova: limites temporais e células que passam ou falham, com os25 valores FNTR
extraídos e regras float32, sem calibrar uma cadeia. Reutilizada a prova de
ponteiros/relógio já existente em `native-rules-research.json`.

Component78+332 do classificador pertence ao mesmo controlador de armadilhas
alocado por5d6796→612590. `native-trap-state.js` porta a decisão613d90..613e4c:
override do controller, saída antecipada de estado3, f32(clock−threshold)>stamp
estrito e inversão do predicado em0/1. Esse predicado5cfa60 é do dispositivo/
ambiente, não presença de agente. O retorno é uma solicitação: entrada de1
chama618080 e pode mudar o estado imediatamente; não chamar isso de um estado
por atualização. Ainda não são executados os efeitos de entrada618240.

6175b0 passa XYZ inteiro do ator a613000: duas máscaras de bits independentes
intersectadas com mesmo piso, em vez do raio da arena ou do footprint de bounce.
Portado esse teste com inputs explícitos. O próximo615210 e a seleção616d80
precisam de produtores/binding antes de substituir o sensor reconstruído.

659 verificações passaram no novo porte, incluindo arredondamento que altera
o resultado na luva, limiar zero, igualdade, override, máscaras e guard do
footprint ativo. Auditoria285 janelas,25 valores FNTR e cinco flags18f relidos;
18f étrue nas cinco fontes,18c permaneceunknown. Comandos/evidência em
`evidence/native-grid-config-route.md` e `native-trap-state-qa.json`.
Runtime da arena inalterado nesta fatia; não há nova aprovação/captura ou
execução original.0/34 casos completos e zero cadeias contínuas default.
Próximo: produtores das máscaras/coleção de atores,615210/616d80, efeitos de
entrada618240 e flag18c; depois vincular esses inputs à cena da arena.


## Engine de covis — brief e decisões (02/10/2026)

Brief aceito por Alan nesta data: o protótipo deve permitir criar cenários inteiros como as quatro capturas
que ele enviou, com todas as armadilhas do jogo, labirintos, várias entradas de agentes e níveis de agentes; a
engine deve nascer sofisticada porque vira jogo completo depois.

Lente: Criar e Jogar. Verbo: pintar piso, posicionar e girar armadilhas, definir entradas, objetivos e ondas,
soltar, ler combos e fugas, corrigir a planta. Escala: produto. Plataforma: navegador desktop, mouse e teclado.

Design system da engine: o mesmo do laboratório (piso menta, friso laranja, parede branca, máquinas
laranja/metal). Console escuro com acento laranja; seleção em dourado; zona de efeito em azul, sensor em
amarelo, base válida em verde e inválida em vermelho, sempre com texto do motivo. Corpo em 14 px, rótulos
nunca abaixo de 12 px. Armadilha fechada é placa no piso; ativa é máquina erguida.

Decisões tomadas sem Alan:
1. Engine em arquivos novos; arena e fidelidade intactas.
2. Todas as armadilhas funcionam já, com comportamento em dados e origem marcada (`observed`, `inferred`,
   `assumed`). Tempos de fase vêm do registro do jogo; distância, dano e perícia são nossos.
3. Estados nativos 2/3/4 tratados como montar/agir/desmontar (inferido das durações dos clipes).
4. Desarme por perícia com regra simples e legível (custo fixo por armadilha), nossa.
5. Porta padrão como dispositivo de portal, com tempos nossos.
6. Reflexão em Z na apresentação para desfazer o espelhamento dos modelos.
7. Capturas em `output/` do workspace; envio ao Drive ficou pendente.

Detalhes: `engine/README.md`, `docs/engine/plano.md`, `docs/engine/comparacao.md`.
