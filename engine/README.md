# Engine de covis de armadilhas

Editor e simulação para montar covis inteiros (salas, corredores, labirintos), posicionar armadilhas,
definir por onde entram os agentes, de que tipo e nível, e soltar as ondas. Nasceu do laboratório de
armadilhas do Evil Genius 2 e foi desenhada para virar jogo próprio: o núcleo não conhece o EG2.

## Abrir

```sh
python3 prototypes/evil-genius-2-trap-arena/engine/server.py     # http://127.0.0.1:8767/covil.html
```

Só em loopback. Precisa da biblioteca `libraries/evil-genius-2` com as extrações restauradas; o servidor
entrega apenas os arquivos listados em `content/eg2/allow.json`. A arena antiga continua em `/index.html`.

## Camadas

| Pasta | O que é | Regra |
|---|---|---|
| `core/` | Simulação: grade, layout, navegação, armadilhas, agentes, ondas | JavaScript puro, passo fixo de 1/60 s, sem DOM, sem Three.js, sem `Math.random`. Roda em Node. |
| `content/eg2/` | Pacote de conteúdo: 22 armadilhas, porta, 4 tipos de agente, 6 níveis, cenários | Dados. `traps.json`, `agents.json`, `models.json`, `kit.json`, `rigs/`, `clips/` são gerados; `behaviours.json`, `agents.authored.json` e `scenarios/` são nossos. |
| `render/` | Three.js: nível, dispositivos, agentes, efeitos | Lê o estado do núcleo e nunca decide regra. |
| `editor/` + `covil.html` | Ferramentas, paleta, ondas, salvar/abrir | Só edita o documento do cenário. |
| `tools/` | `build_content.py`, `make_scenarios.mjs` | A biblioteca é lida, nunca alterada. |
| `tests/` | `run.mjs` (núcleo) e `editor-qa.mjs` (navegador, GPU real) | Recibos em `evidence/`. |

Um jogo próprio troca o pacote (arte, nomes, números) e reaproveita `core/`, `render/` e `editor/`.
Os assets do EG2 são referência de estudo e não entram em build publicável.

## Como uma armadilha funciona

Uma armadilha é uma interação com tempos do jogo: o agente que entra no **sensor** é **capturado** e levado
por três fases, depois a armadilha **recarrega**.

| Fase | Estado nativo | Clipe do jogo | O que acontece |
|---|---|---|---|
| Montar | 2 | Mount | agente preso; a máquina abre |
| Agir | 3 | Loop | o efeito (sopro, puxão, dano por segundo, afundar…) |
| Desmontar | 4 | Dismount | a máquina fecha; quem ainda está preso é solto |
| Recarga | 5 | — | não dispara |
| Sabotada | 6 | — | depois de um agente desarmar |

O que acontece em cada fase é o programa `ops` da armadilha em `behaviours.json`: `damage`, `dot`, `status`,
`launch`, `push`, `pull`, `suspend`, `slide`, `sink`, `extinguish`, `toll`. Quem é lançado, soprado ou puxado
para dentro do sensor de outra armadilha antes de voltar a andar estende o **combo** (o jogo tem um texto
nativo para isso: empurrar um agente por 3 armadilhas diferentes sem recuperação).

**Perícia:** um agente andando com perícia igual ou maior que o custo da armadilha a desarma, gasta essa
perícia e a deixa sabotada pelo tempo nativo. Cofre falso, amarelinha e pedágio não podem ser desarmados e
drenam perícia: são a preparação para as armadilhas fortes.

**Atributos:** vitalidade zero neutraliza; determinação zero faz o agente desistir e sair pela entrada;
chegar ao objetivo custa um ponto de integridade.

## Origem dos números

Cada bloco de `traps.json` carrega a origem. No editor, a ficha da armadilha mostra `do jogo`, `inferido`
ou `nosso` ao lado de cada valor.

| Origem | O quê |
|---|---|
| `observed` (lido do pacote) | footprint, células (livre, ocupada, parede exigida), custo, os cinco tempos de estado das 22 armadilhas (mesmo trecho do registro FNTR), duração dos clipes, modelos, esqueletos, animações, sons |
| `inferred` | estados 2/3/4/5/6 = montar/agir/desmontar/recarga/sabotada (os tempos 2 e 4 coincidem com Mount e Dismount em seis armadilhas); tempos das 17 armadilhas cujo consumidor não foi rastreado no executável; velocidade de caminhada pelo canal de movimento do clipe; zona 4×8 do ventilador; onde o modelo assenta no footprint |
| `assumed` (nosso) | distância, velocidade de deslocamento, dano, custo de perícia, atributos por nível, multiplicadores por tipo, porta (tempo de arrombar) |

Nada foi calibrado para forçar um combo. Quando a pesquisa de fidelidade provar um valor, ele entra em
`behaviours.json` com a origem trocada; o núcleo não muda.

## Verificar

```sh
node engine/tests/run.mjs            # núcleo: 35 testes, 541 verificações
node engine/tests/editor-qa.mjs      # editor por mouse e teclado reais, headless, GPU real (servidor no ar)
```

`run.mjs` percorre trajetórias inteiras: cada uma das 22 armadilhas dispara, cumpre as três fases com os
tempos nativos, afeta o agente e a rodada termina; combo ventilador→tanque; bolha + ventilador; desarme;
ondas com várias entradas, tipos e níveis; porta; desistência; determinismo; os quatro cenários de referência.
`editor-qa.mjs` monta um covil do zero com as ferramentas públicas, joga, pausa, reinicia, salva, recarrega,
exporta e roda as quatro referências ao vivo. Capturas em `<workspace>/output/eg2-covil-qa/`.

## Regerar o conteúdo

```sh
~/.pyenv/versions/3.12.12/bin/python3.12 engine/tools/build_content.py   # 22 de 22; relatório em content/eg2/report.json
node engine/tools/make_scenarios.mjs                                      # recusa cenário com erro ou sem caminho
```

## Acrescentar

- **Armadilha:** entrada em `TRAPS` de `build_content.py` (modelo, esqueleto, clipes) e em
  `behaviours.json` (sensor, alvos, `ops`); posição do modelo em `render/views.js`; um caso em `tests/run.mjs`.
- **Efeito novo:** um `case` em `#instant` ou `#continuous` de `core/world.js`, com teste.
- **Tipo de agente:** `agents.authored.json` (corpo, cabeça, partes, clipe de caminhada, família A/B/C).
- **Cenário:** no editor (Salvar, Exportar) ou em `make_scenarios.mjs`.

## Convenções de grade

Uma célula = 1 unidade = uma célula de footprint do jogo. `rot` são quartos de volta
(`rotation.y = rot·π/2`); `rot 0` olha para +Z. No footprint, `j = 0` é a fileira da parede e `j` cresce
para a frente; a base guardada é o canto mínimo do retângulo já girado.

Os modelos nativos são Y para baixo. O carregador reflete Y e cada suporte reflete Z: juntos, meia volta em
torno de X. Só com a primeira reflexão tudo saía espelhado (os números da amarelinha ficavam ao contrário).

## Limites

- Regras são nossas, sobre tempos do jogo. Não é o comportamento do Asura; o livro de fidelidade continua
  aberto em `docs/gauntlet-fidelidade-eg2.json` (0 de 34 casos).
- Efeitos visuais (vento, água, fogo, gás, lasers) são autorais: os sistemas de partículas do jogo não
  estão decodificados.
- Dois clipes de reação não decodificam (`Trap_Hopscotch_User_Loop_A_01`, `Trap_Paywall_User_Loop_A_01`):
  o agente usa o clipe vizinho. O filhote não tem clipes de reação.
- Paredes: painel reto nativo em cada aresta, cortado a 1,4 de altura, com topo e rocha autorais. Cantos,
  luminárias e portais de sala do jogo não estão montados.
- Sem economia, pesquisa, lacaios ou câmeras. Editor para desktop com mouse e teclado.
