# Engine de covis de armadilhas

Editor e simulação para montar covis inteiros (salas, corredores, labirintos), posicionar armadilhas,
definir por onde entram os agentes, de que tipo e nível, e soltar as ondas. Nasceu do laboratório de
armadilhas do Evil Genius 2 e foi desenhada para virar jogo próprio: o núcleo não conhece o EG2.

**Vãos e cantos:** os encontros de paredes usam nove variantes nativas (internas, externas e mistas),
escolhidas pela planta. Em **Portais → Vão de porta**, posicione o marco aberto de 4×1 células entre
duas paredes; R gira. Ele não captura nem atrasa agentes. A Espinha tem seis vãos laterais. O marco
acompanha o corte de 1,4 das paredes; **Paredes altas** mostra a verga completa a 3 unidades.

**Ouro:** na aba **Cenário**, ative **Limitar ouro** e defina o orçamento. Gasto, saldo e limite ficam
visíveis junto à paleta, com o preço de cada armadilha. Colocar acima do saldo é recusado; remover
libera o custo inteiro; mover, girar ou desligar não muda o gasto. Reduzir o orçamento abaixo do gasto
preserva a planta, mas impede soltar ondas até ajustá-la. Salvar, importar e desfazer/refazer preservam
a regra. Covis antigos e as referências permanecem sem limite por padrão.

O orçamento cobre apenas armadilhas. Piso, porta e vão ficam fora da conta (não possuem custo de
construção verificado neste pacote). O ouro cobrado no pedágio é um resultado da rodada, sem financiar
a montagem. A regra do orçamento é nossa; os preços vêm do campo de custo dos registros FNTR.

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
node engine/tests/run.mjs            # núcleo: 44 testes, 1.233 verificações
node engine/tests/editor-qa.mjs      # editor por mouse e teclado reais, headless, GPU real (servidor no ar)
```

`run.mjs` percorre trajetórias inteiras: cada uma das 22 armadilhas dispara, cumpre as três fases com os
tempos nativos, afeta o agente e a rodada termina; combo ventilador→tanque; bolha + ventilador; desarme;
ondas com várias entradas, tipos e níveis; porta; desistência; determinismo; os quatro cenários de referência.
`editor-qa.mjs` monta um covil do zero com as ferramentas públicas, joga, pausa, reinicia, salva, recarrega,
exporta e roda as quatro referências ao vivo. Capturas em `<workspace>/output/eg2-covil-qa/`.
Também cobre o ciclo completo de orçamento, importação inválida, vãos e alternância de altura das paredes.

`costSource` guarda offset, bytes e origem do preço de cada armadilha. O decodificador do catálogo
dependia de um marcador float ausente no ventilador: a engine recupera **4.000** no campo `u32` a
112 bytes do fim alinhado do nome. Esse local coincide com os outros 21 registros, mas o consumidor
não foi rastreado para essa recuperação: origem **inferred**. Amarelinha e armadilha de urso têm
**zero** nos bytes originais. Preço desconhecido nunca vira zero; bloqueia orçamento limitado.

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
- Paredes: painéis retos e cantos nativos, cortados a 1,4 de altura, com topo e rocha autorais. Vãos usam
  o marco da porta padrão; luminárias de parede, câmeras e níveis de segurança continuam pendentes.
- Economia restrita ao orçamento de montagem; sem renda, pesquisa ou lacaios. Editor para desktop.
