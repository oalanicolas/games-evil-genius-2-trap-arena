# Comparação com as referências do pedido

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
