# Comparação com as referências do pedido

## Continuação — vãos, cantos e ouro (02/10/2026)

Referências efetivamente vistas: lados esquerdos de `compare-1-espinha.png` (imagens 1 e 4),
`compare-2-labirinto.png` (imagem 2) e `compare-3-corredores.png` (imagem 3), preservados no diretório
de QA anterior. As novas montagens são `compare-final-{espinha,labirinto,corredores}.png`;
`before-after-*.png` usa as capturas de perspectiva antes/depois, na mesma janela de 1600×1000.
Todos esses caminhos partem de `<workspace>/output/eg2-covil-qa/`. Revisão do agente, sem aceite de Alan.

1. **Cantos:** os encontros agora têm os painéis internos/externos e as peças de duas pontas do jogo.
   Rodapés e faixa laranja acompanham a curva, sem duplicar painéis retos. Pivôs Y diferentes foram
   assentados pelo limite inferior de cada modelo. Os corredores em L mantêm planta, armadilhas e rota.
2. **Vãos:** as seis salas da Espinha têm marco aberto, ombreiras e soleira nativos. Foi reservado um
   trecho de uma célula para cada marco, aumentando a largura total de 28 para 30 células sem sobrepor
   as armadilhas. O vão livre visual é aproximadamente 3,3 unidades dentro do footprint de 4.
   A referência tem acessos mais estreitos e ferragens/luzes diferentes; não é reprodução exata.
3. **Corte da parede:** a primeira tentativa manteve os marcos inteiros a 3 unidades e encobriu as
   máquinas. Corrigido: o marco acompanha o corte de 1,4; o modo de paredes altas conserva a verga
   original. Conferido em `detail-doorway-low.png` e `detail-doorway-high.png`.
4. **Em movimento:** as quatro plantas completaram as ondas na GPU Metal. Na Espinha, 18 agentes
   tiveram desfecho e o combo chegou a 4; os vãos não disparam, capturam ou exigem arrombamento.
   Capturas `12-*-em-jogo.png` preservam máquinas ativas e passagem dos agentes.
5. **Orçamento:** `03b-orcamento-exato.png` mostra 76.000 gastos e saldo zero. O covil montado pelo
   teste contém cinco armadilhas, uma porta e um vão. Recusar compra não altera planta/histórico;
   remoção, undo/redo, exportação, recarga e importação conservam o cálculo. Não há referência visual
   para este HUD: ele segue o editor existente.
6. **Diferenças restantes:** rocha, topo cortado, sombras e efeitos de água/vento continuam autorais;
   não há mobília de parede, luz de nível de segurança ou ambientes externos do covil original.
   Não houve redução de resolução, sombras, modelos ou animações para acelerar o gate.

Na revisão do editor também foram corrigidos o aviso de saldo que permanecia após ajustar o limite e
o resultado da rodada anterior que reaparecia ao trocar de cenário. A importação teve sua espera de
QA corrigida para verificar o documento depois da leitura assíncrona.

## Comparação anterior (histórico, antes desta continuação)

02/10/2026. Capturas da engine tiradas pelo `engine/tests/editor-qa.mjs` e por roteiro equivalente, em Chrome
headless na GPU real (ANGLE Metal, Apple M3 Max). Montagens lado a lado em
`<workspace>/output/eg2-covil-qa/compare-*.png` (fora do git). Revisão do agente; **não é aceite de Alan**.

## 1. Espinha de pisos escorregadios (imagens 1 e 4) — `compare-1-espinha.png`

Igual: piso verde-menta com friso laranja; paredes brancas grossas sobre rocha; corredor central com pisos
escorregadios; sala com dois ventiladores de um lado e tanque + ímã do outro; ventilador ativo como tambor
laranja erguido soprando para o corredor; tanque aberto com água e tubarões; agente dentro da água; faixa
inferior espelhada.

Diferenças:
1. As salas da referência têm vãos de porta estreitos para o corredor; as nossas são abertas na largura toda.
2. A referência tem luminárias, alto-falantes e painéis nas paredes; aqui não há mobília de parede.
3. O vento da referência são vórtices azulados densos; o nosso são anéis claros (efeito autoral).
4. O piso escorregadio ativo da referência solta espuma roxa em jato; o nosso é uma poça lilás com bolhas.
5. O ímã ativo da referência tem anéis rosa nos polos; os nossos anéis correm pela zona inteira.
6. Rocha: tom e rachaduras autorais, mais lisos que os do jogo.

## 2. Labirinto de corredores (imagem 2) — `compare-2-labirinto.png`

Igual: corredores longos em serpentina, portas a cada trecho, armadilhas de piso e de parede ao longo do
caminho, vista inclinada com paredes cortadas.

Diferenças:
1. A referência está dentro de um covil maior (cassino ao fundo, HUD do jogo); o nosso é só o labirinto.
2. As portas da referência têm luz vermelha de nível de segurança; a nossa é a porta padrão sem luz.
3. A referência tem corredores de larguras variadas; os nossos têm 4 células para caber laser e porta.

## 3. Corredores em L (imagem 3) — `compare-3-corredores.png`

Igual: corredores em L, pisos escorregadios redondos, rebatedores triangulares com estrela **rentes ao piso
quando fechados**, ventilador, ímã e tanque fechados como placas, parede branca com faixa laranja e rodapé escuro.

Diferenças:
1. Altura das paredes: a referência corta por volta de 1,2; a nossa em 1,4 (ajustável: Paredes altas).
2. A referência tem portais de sala com luz e câmeras; não montados.
3. Sombra de contato mais suave no jogo; a nossa é sombra direcional simples.

## Corrigido depois de olhar as capturas

- Modelos espelhados (números da amarelinha ao contrário): reflexão em Z no suporte de cada modelo.
- Ventilador soprando para trás: a saída do jato fica no +Z do modelo nativo.
- Rebatedor parado 0,8 acima do piso: pose de ligação do osso do rebatedor tirada do clipe Loop.
- Painel das abelhas deitado e de costas; bloco de gelo fixo no raio congelante (agora só no agente congelado).
- Piso preto (normais), campo de distância cortando diagonais (float32), agente em fuga preso atrás de porta,
  troca de cenário que não trocava o mundo, registro de eventos ilegível.
