# Engine de covis de armadilhas — plano

02/10/2026 · pedido de Alan na sessão Claude Code (game-dev): o protótipo deve permitir montar cenários
inteiros como as quatro capturas de Evil Genius 2 que ele enviou, com todas as armadilhas do jogo,
labirintos, várias entradas de agentes e níveis de agentes. A engine nasce para virar um jogo completo depois.

## Brief

- **Fantasia:** o gênio do mal que desenha o covil e assiste aos agentes caírem nas armadilhas.
- **Lente:** Criar (montar o covil) e Jogar (soltar ondas e ler o resultado).
- **Verbo:** pintar piso → posicionar e girar armadilhas → definir entradas, objetivos e ondas → soltar →
  ler combos e fugas → corrigir a planta → repetir.
- **Escala:** produto. **Plataforma:** navegador desktop, Three.js, mouse e teclado.
- **Prova de conclusão:** as plantas das referências montadas no editor, salvas e rejogáveis; onda com
  entradas e níveis diferentes atravessando o labirinto; combos contados; tudo conferido em movimento por
  script headless na GPU real e por capturas lado a lado com as referências.
- **Permanece:** a arena `index.html`, o laboratório de fidelidade e seus recibos não mudam de arquivo nem de
  hash. O livro `docs/gauntlet-fidelidade-eg2.json` continua pausado e intocado.

## Referências vistas (as quatro imagens do pedido)

1. Espinha vertical de pisos escorregadios e bolha, com salas laterais: dois ventiladores de um lado, tanque de
   tubarões e ímã do outro; estados fechado (placa no piso com ícone) e ativo (máquina erguida).
2. Labirinto de corredores longos com portas e armadilhas a cada trecho.
3. Corredores em L com pisos escorregadios, rebatedores triangulares, ventilador, ímã e tanque fechado.

Três características que a cena precisa mostrar: piso verde-menta com friso laranja; paredes brancas grossas com
topo claro sobre rocha marrom; armadilhas como placas no piso quando fechadas e máquinas quando ativas.

## Arquitetura

| Camada | Pasta | Regra |
|---|---|---|
| Núcleo | `engine/core/` | JavaScript puro, passo fixo, determinístico, sem DOM nem Three.js; roda em Node. |
| Conteúdo | `engine/content/eg2/` | Dados: armadilhas, agentes, kit de sala, cenários. Gerado por `engine/tools/build_content.py` a partir da biblioteca (somente leitura) e de `behaviours.json`. |
| Apresentação | `engine/render/` | Three.js: nível, armadilhas, agentes, efeitos. Lê o estado do núcleo, nunca decide regra. |
| Editor | `engine/editor/` + `covil.html` | Ferramentas, paleta, ondas, salvar/abrir. |

O núcleo não conhece Evil Genius 2: recebe um pacote de conteúdo. Um jogo próprio troca o pacote
(arte, nomes, números) sem tocar no núcleo. Os assets do EG2 são referência de estudo, servidos só em
loopback; não entram em build publicável.

## Origem dos números

Vocabulário único: `observed` (lido do pacote), `inferred` (derivado, com a evidência nomeada),
`external_reference` (documentação pública), `assumed` (nosso). Cada bloco de `traps.json` carrega a origem.

- `observed`: footprint, células (livre, ocupada, parede exigida), custo, cinco tempos de estado por armadilha
  (lidos nas 22, mesmo trecho do registro FNTR), durações dos clipes, velocidade da caminhada.
- `inferred`: estado 2/3/4/5/6 = montar/laço/desmontar/recarga/sabotada (os tempos 2 e 4 coincidem com a
  duração dos clipes Mount e Dismount em pelo menos seis armadilhas); zona do ventilador 4×8.
- `assumed`: distâncias, velocidades de deslocamento, dano, atributos por nível, custo de perícia para desarmar.
  Não são valores do jogo; ficam em dados para serem trocados quando a pesquisa de fidelidade provar os reais.

## Rodadas

| # | Entrega | Critério observável |
|---|---|---|
| E1 | Conteúdo das 22 armadilhas, kit e agentes | `build_content.py` sai 0; 22 de 22 com footprint, células e tempos; relatório lista o que falta por armadilha |
| E2 | Núcleo | `node engine/tests/run.mjs` verde: grade, navegação, 22 programas, combos, ondas, determinismo, salvar/abrir |
| E3 | Apresentação | planta com paredes automáticas, armadilhas fechadas/ativas e agentes animados abre sem erro na GPU real |
| E4 | Editor | pintar, posicionar, girar, entradas, objetivos, ondas, validar, salvar, exportar; tudo pelo input público |
| E5 | Cenários de referência | três plantas das imagens montadas, comparadas lado a lado, onda atravessando |
| E6 | Entrega | documentos, QA em movimento, pendências |

## Decisões tomadas sem Alan

1. Engine nova em arquivos novos (`engine/`, `covil.html`); a arena e o laboratório de fidelidade ficam como estão.
2. Todas as armadilhas funcionam já, com comportamento em dados e origem marcada; a pesquisa de fidelidade
   troca os valores `assumed` quando fechar cada produtor. Nada foi calibrado para forçar cadeia.
3. Handoff de fidelidade lido como contexto e não marcado como consumido: a R1 de fidelidade não foi retomada.
4. Servidor próprio na porta 8767; o da 8766 pertence a outra sessão e não foi encerrado.
5. Sem commit, push ou deploy: o protótipo não tem repositório e nada disso foi pedido.

## Estado em 02/10/2026 (fim da sessão)

| # | Estado | Prova |
|---|---|---|
| E1 | concluída | `engine/content/eg2/report.json`: 22 de 22 com footprint, células, tempos, modelo e programa; 17 com esqueleto e clipes do dispositivo; 21 com clipes de reação; 18 com som; 201 clipes, 32 esqueletos |
| E2 | concluída | `node engine/tests/run.mjs` → 35 de 35, 541 verificações (`engine/evidence/core-tests.json`) |
| E3 | concluída | `covil.html` abre sem erro de console ou rede; renderer `ANGLE Metal, Apple M3 Max` |
| E4 | concluída | `node engine/tests/editor-qa.mjs` → 28 de 28 por mouse e teclado reais (`engine/evidence/editor-qa.json`) |
| E5 | concluída pelo agente, sem aceite | 4 cenários em `engine/content/eg2/scenarios/`; comparação numerada em `docs/engine/comparacao.md` |
| E6 | concluída | `engine/README.md`, este plano, seção nova no `README.md` e no `game-design.md` |

Os testes anteriores do laboratório seguem verdes e os arquivos da arena não foram alterados:
`test-native-trap-state.mjs` 659, `test-native-grid-transport.mjs` 1.715, `test-simulation.mjs` PASS.

## Pendências para Alan

1. **Aceite visual e de jogo.** Abrir `http://127.0.0.1:8767/covil.html`, soltar as ondas das quatro referências e
   montar um covil. Só a aprovação dele fecha a E5.
2. **Números nossos.** Dano, distância, velocidade de deslocamento, custo de perícia e atributos por nível estão em
   `behaviours.json` e `agents.authored.json`, marcados `assumed`. Dizer se a direção é manter números próprios
   (jogo próprio) ou esperar a pesquisa de fidelidade.
3. **Capturas no Drive.** As capturas estão em `output/eg2-covil-qa/` (fora do git) e não foram enviadas ao acervo.
4. **Repositório.** O protótipo continua sem Git; nada foi commitado.

## Próximo recorte sugerido na sessão anterior (executado abaixo)

Vãos de porta e cantos nativos nas paredes, mobília de parede (luminárias, câmeras), níveis de porta, e a
primeira regra de economia (custo das armadilhas, que já vem do jogo) para virar desafio com orçamento.

## Continuação autorizada em 02/10/2026 — vãos, cantos e orçamento

Lente Criar/Jogar, escala produto. Reutilizar cantos internos/externos e marco de porta nativos;
substituir painéis nos encontros, oferecer vão aberto no editor e montar os acessos das salas da Espinha.
Depois, orçamento configurável por covil: custo de construção somado por armadilha, saldo visível,
recusa de compra acima do saldo, remoção libera verba e mover/girar não cobra novamente. Salvar,
abrir, importar, desfazer e refazer preservam a regra. Covis antigos continuam sem limite até configurá-lo.

Hipótese: ver o saldo durante a montagem permite escolher entre quantidade e potência sem interromper
o ciclo pintar → armar → soltar → revisar. Os custos vêm do pacote; o limite de cada desafio é nosso.
Não incluir portas, piso ou marcos na conta das armadilhas sem custo decodificado. Prova: ambos os
gates verdes, testes de limite exato/excesso/remoção/persistência, quatro referências até o fim e
capturas comparadas às imagens anteriores e às referências em `docs/engine/comparacao.md`.

### Entrega verificada desta continuação

| Pedido | Artefato e prova | Estado |
|---|---|---|
| Cantos com peças do jogo | `render/shell.js` seleciona nove modelos nativos, incluindo cantos duplos/mistos; 511 plantas pequenas rotacionadas conferem a topologia; capturas antes/depois lidas | implementado |
| Vãos de porta | `Doorway` no pacote/editor, marco `door_standard_frame`, seis acessos na Espinha; passagem nas quatro rotações sem captura e QA por mouse | implementado |
| Ouro por covil | `core/economy.js`, `rules.goldBudget`, controles e preços no editor; limite exato, excesso, zeros, custo desconhecido, remoção, mover, undo/redo, salvar/importar | implementado |
| Gates | `node engine/tests/run.mjs`: **44/44, 1.233 verificações**; `node engine/tests/editor-qa.mjs`: **45/45**, zero erros de console/rede, Chrome headless, ANGLE Metal Apple M3 Max | passaram |
| Comparação | `docs/engine/comparacao.md`, montagens `compare-final-*.png`, `before-after-*.png` e detalhes baixo/alto | revisão do agente, sem aceite humano |

Gasto de montagem exibido nas referências (limite configurável, inicialmente desligado):
Espinha **372.000**; Labirinto **480.000**; Corredores em L **192.000**; Galeria **604.000**.
No gate ao vivo, os 51 agentes das quatro referências tiveram desfecho: Espinha 18, Labirinto 15,
Corredores 13, Galeria 5. O covil construído pelo mouse completou mais 8 agentes com limite de 76.000.
Recibos: `engine/evidence/core-tests.json` e `engine/evidence/editor-qa.json`.

Decisões tomadas sem Alan:

1. Portas e marcos ficam fora do orçamento de armadilhas; não foi inventado preço para eles.
2. Preço do ventilador recuperado como 4.000 no FNTR, com origem `inferred`; dois preços nativos zero
   foram preservados. O gate relê os bytes dos 22 custos. Biblioteca permanece somente leitura.
3. O vão acompanha a altura de corte das paredes para conservar a leitura da ação. A montagem do
   marco e o footprint são inferidos, não reconstituição comprovada das regras do Asura.
4. Sem commit, push ou deploy nesta sessão. Os 54 arquivos de arena/fidelidade e documentos raiz
   protegidos (exceto `.gitignore`) mantiveram seus hashes. A alteração concorrente de `.gitignore`
   foi preservada e não pertence a este recorte.

O pedido de vãos, cantos e orçamento está implementado. Permanecem para uma rodada futura a mobília
de parede e os níveis de segurança das portas; o aceite visual continua sendo de Alan.
