# Ensaio no cliente — não executado

Este é um procedimento experimental. **Não é uma arena construída, save ou arquivo importável pelo Asura.** Não inventa coordenadas, dimensões ou tuning ausentes da fonte.

## 1. Provar os três controles primeiro

1. Registrar executável original, SHA-256, versão exibida, sistema, GPU e renderer. Se usar CrossOver, registrar versão da camada e backend gráfico. Hash do executável sozinho não comprova qual motor estava renderizando o vídeo.
2. Abrir Sandbox e criar um save exclusivo chamado `EG2 Trap Arena - Base`. Confirmar na interface a disponibilidade das cinco armadilhas. Construir um corredor e um ponto de energia suficiente; observar a conclusão real da construção. Não sobrescrever campanha nem save existente.
3. Salvar e recarregar. Conferir corredor, dispositivos, energia e orientação. Demonstrar mover, girar e ligar/desligar um dispositivo usando os controles realmente configurados na instalação.
4. Convocar `Investigator Attack: Easy` em Side Stories. Registrar onde a onda chega, seu caminho e uma vítima identificável. Não tratar a opção Easy como garantia de quantidade, Skill ou posição de spawn.
5. Testar cada dispositivo isoladamente na rota percorrida. Registrar alcance mostrado, detecção, consequência, recarga e condição de bloqueio. A inspeção por código é complemento; o resultado precisa existir na tela do cliente.

Esta etapa passa somente quando cenário, inimigo e dispositivos foram alterados por uma ação nossa com consequência observada. Se falhar, registrar o ponto preciso e corrigir antes da composição. Não habilitar cinco nomes de UI e chamar isso de cinco efeitos demonstrados.

## 2. Descobrir a geometria e montar a arena

Usar uma área de corredor com um único trajeto observado do inimigo, energia, manutenção e acesso de serviço. Dimensões e distâncias vêm das áreas mostradas no cliente e das trajetórias medidas durante o ensaio, não de unidades de outro motor. Não assumir que uma sala ou corredor vazio atrai inimigos; a chegada é um resultado a conferir.

Antes de juntar tudo, fechar três ensaios sustentados pelos textos:

| Ensaio | Objetivo | Incerteza a resolver |
|---|---|---|
| A — ventilador → luva | Mesma vítima entra na área da luva durante o deslocamento | Distância, orientação e momento do contato |
| B — bolha + piso | Observar qual ordem produz interação e o estado após ela | Flutuação, queda, deslizamento e recuperação |
| C — ventilador → laser | Vítima em deslocamento recebe o efeito do laser | Janela de ativação e interseção do feixe |

Mudar um dispositivo por tentativa. Anotar posição no grid que o cliente apresenta, orientação, atributos da vítima e sequência temporal. Em B, testar as duas ordens se necessário. O combo publicado usa “and”, portanto não fixa uma ordem.

Hipótese inicial para testar após A/B/C: **ventilador → luva → bolha + piso → laser**. A ligação luva→bolha tem suporte em patch oficial; a ligação da saída de bolha/piso com laser permanece desconhecida. A trajetória lançada pela luva pode exigir curva ou retorno; medir no cliente antes de fechar a disposição. Se a composição falhar, testar o arranjo alternativo bolha/piso → ventilador → laser → luva, registrando que também é hipótese. A lista do pedido não impõe ordem temporal.

Não expandir para novas armadilhas ou inimigos enquanto uma composição de cinco não fechar. Não adicionar tubarão à prova para compensar laser/luva faltantes. Uma sequência que só funciona com captura/interrogatório ou acionamento manual deve ser classificada como **ensaio assistido**, com uma segunda prova exigida para a onda autônoma.

## 3. Provar a cadeia inteira e a repetição

Registrar um vídeo contínuo desde antes da chegada até o resultado final. Capturas/vídeo vão para o acervo do Drive, conforme a regra do estúdio; só referências, hashes e anotações entram neste diretório.

Para cada tentativa, registrar:

- Save e configuração inicial; versão e hash do executável; renderer/backend e qualidade visual.
- Onda selecionada; identidade visual/nome, Skill, Vitality e Resolve da vítima, conforme a interface mostrar.
- Cada dispositivo identificado, posição/orientação, energia, durabilidade e recarga inicial.
- Tempo de disparo e tempo do efeito de cada dispositivo; estado/posição da mesma vítima antes/depois; qualquer recuperação, evasão, sabotagem ou intervenção.
- Resultado final e se a vítima continuou no mesmo encadeamento. Cinco armadilhas disparadas em cinco vítimas não passam.
- Corpos e objetos obstruindo a rota; manutenção; ataques de guardas ou henchmen que possam confundir o dano da armadilha.
- Referência do vídeo e tempos relevantes, não apenas screenshots ou log sintético.

Prova principal: uma vítima sofre os cinco efeitos durante uma cadeia contínua de deslocamento/controle; a eventual recuperação que encerre a cadeia invalida essa tentativa. Não exigir morte se os efeitos do original não a produzirem. Registrar o resultado real.

Recarregar o save anterior à onda e repetir uma segunda vez. Duas repetições são o critério mínimo deste experimento, não uma estatística de confiabilidade. Comparar em movimento e preservar acabamento, VFX e som originais. Se só a primeira tentativa funcionar, a repetibilidade permanece pendente.

## O que desbloqueia o passo seguinte

| Porta | Estado em 02/10/2026 | Evidência necessária |
|---|---|---|
| Cliente original acessível | Bloqueada | Processo e imagem em execução com identificação da versão |
| Três controles | Não testada | Construção/recarga, onda e dispositivo exercitados |
| Cinco efeitos isolados | Não testada | Uma observação real por dispositivo |
| Arena salva | Não construída | Save carregável com os cinco posicionados |
| Cadeia integral | Não testada | Vídeo da mesma vítima, cinco efeitos e continuidade |
| Repetição | Não testada | Segunda execução a partir do save de base |

Um modo de tower defense dedicado só entra depois: primeiro decidir o que o Sandbox já consegue controlar e quais funções exigiriam modificação. A pesquisa não autoriza chamar um save experimental de conversão completa do jogo.
