# Evil Genius 2 — experimento de arena no cliente original

Investigação de 02/10/2026. **Resultado parcial: rota plausível identificada; cliente não executado, controle não demonstrado e arena não montada.** Os cinco dispositivos não foram provados em cadeia. Este diretório guarda investigação e procedimento de ensaio, não um jogo executável.

## Decisão de viabilidade

O melhor primeiro experimento é um **save exclusivo de Sandbox no próprio Evil Genius 2**, usando o motor Asura e os menus originais. A Rebellion documenta construção e convocação de inimigos por Side Stories; seus patches também tratam explicitamente de interações entre armadilhas. Isso sustenta a tentativa, não certifica sua execução aqui. [Patch notes oficiais](https://support.rebellion.com/hc/en-gb/articles/360018817717-Patch-Notes).

| Recorte | Veredito nesta investigação |
|---|---|
| Montar defesas e convocar ondas no Sandbox original | Viabilidade documental forte; falta observação local |
| Produzir uma cadeia com as cinco armadilhas | Hipótese plausível; composição inteira e geometria não verificadas |
| Controlar spawn, coordenadas e estatísticas por API | Não demonstrado; nenhum contrato invocável validado |
| Transformar isso em modo dedicado de tower defense | Não demonstrado: economia, ondas, vitória/derrota e UI continuam sendo os do original |
| Executar agora nos hosts conectados | Bloqueado pela ausência de ambiente compatível identificado |

O MacBook e o Mac Studio disponíveis são macOS ARM64. A busca em PATH, Applications, Homebrew e diretórios padrão não identificou Wine, CrossOver ou VM. O segundo host também não tem a fonte na localização pesquisada. Não há host Windows conectado pelo Desktop Commander. Essa é uma inspeção delimitada, não uma afirmação sobre todo disco ou todas as máquinas do usuário.

A base pública da CodeWeavers relata execução do título no Mac com CrossOver 24.0.5. É uma rota candidata, não um teste desta máquina. Usar CrossOver mantém o executável e a lógica do Asura, mas acrescenta tradução de APIs gráficas/Windows; essa camada deve ser registrada na prova. [Registro de compatibilidade](https://www.codeweavers.com/compatibility/crossover/evil-genius-2-world-domination).

## Brief e limites

- Lente: Criar/Operar; escala `jam`, uma arena e uma cadeia completa.
- Verbo: posicionar e orientar dispositivos, convocar uma entrada controlada de inimigos, observar a consequência e repetir após recarga.
- Alvo: o cliente comercial original; nenhuma engine substituta ou implementação de física própria.
- Aceite: antes da arena, demonstrar cenário, inimigo e dispositivo controláveis. Depois, a mesma vítima atravessa os cinco efeitos numa captura contínua, com ordem e estados visíveis, e o resultado se repete após recarga.
- Reuso: cliente, Sandbox, construção, Side Stories e saves. A biblioteca é fonte de consulta somente leitura. Não há razão comprovada para criar motor, editor ou importador de mapa.
- Os documentos antigos da biblioteca excluem execução em seu mandato de extração. O pedido atual autoriza esta investigação separada do cliente; não altera o mandato nem as capacidades declaradas daquela biblioteca.
- Nenhum arquivo de Rabisco ou da biblioteca foi escrito por este trabalho. Não houve commit, push, deploy, compra ou download de cliente/modkit.

## Como controlar — caminho identificado, ainda não demonstrado

| Alvo | Caminho do cliente a testar | Evidência atual | Prova exigida |
|---|---|---|---|
| Cenário | Novo Sandbox, escolher ilha, desenhar corredor pelo Build Menu | Menu HTXT e documentação oficial | Corredor construído, salvo e reaparecendo após Load Game |
| Inimigos | Side Stories → `Investigator Attack: Easy` | `objective` HTXT `/entradas/2646` e título nas proximidades; patch 1.8.0 | Onda convocada chega; tipo e estado da vítima registrados |
| Dispositivos | Build Menu; mover, girar e alternar energia pelos controles configurados | HTXT `inputs`; patch 1.8.0 | Cada uma das cinco detecta e produz seu efeito, com área e orientação visíveis |
| Tempo/repetição | Pausa pela interface; save exclusivo anterior à onda; Load Game | HTXT `inputs` e `menu` | Duas execuções registradas; recarga não implica RNG determinístico |
| Observação | Painéis, indicadores de bloqueio/recarga, registro de eventos e vídeo contínuo | HTXT `eventlog`; patch 1.11.0 | Efeitos sobre a mesma vítima localizados por tempo no vídeo |

O menu contém `Spawn Agent` e `Trap Sandbox`. O executável contém `CommandConsole`, `Spawn Narrative Wave`, `Construct Furniture` e eventos como `EG_TrackedEvent_ActorTrapCombo`. **São strings, não comandos certificados.** Não se deve entregar um script que finja invocá-las. Os arquivos `.scenario`/`.base` existentes são contêineres binários; não há editor/importador funcional validado neste recorte.

Localizadores conferidos diretamente em `bin/evilgenius_vulkan.exe` (offsets de arquivo): `0xafaa10` → `CommandConsole`; `0xb29b48` → `Spawn Narrative Wave`; `0xb29fb0` → `Construct Furniture`; `0xb17988` → `EG_TrackedEvent_ActorTrapCombo`. SHA-256 desse executável: `c52e656a6bbdfdf4f59aa03bfa0f11425854299e61fb078744e5865847c79042`.

Os controles de onda pela interface não provam escolha arbitrária de quantidade, posição de nascimento, atributos ou instante. Caso o Sandbox não ofereça o controle necessário, esse limite deve aparecer antes de prometer um modo de tower defense automatizado.

## As cinco armadilhas e o que a fonte prova

| Pedido | Nome no cliente | Índice em `furniture` | Hash de localização |
|---|---|---:|---:|
| Ventilador | Giant Fan | 700 | 834402172 |
| Luva | Boxing Glove | 694 | 2525443693 |
| Bolha | Bubble Cannon | 696 | 1350430010 |
| Piso escorregadio | Slippery Floor | 728 | 2666312839 |
| Laser | Laser Wall | 714 | 1269889274 |

Esses números são identificadores de **texto**, não de objeto ou spawn. “Laser” foi interpretado como Laser Wall porque há um combo nativo que o cita.

Textos de `menu` lidos novamente do pacote original:

- `/entradas/751`: ventilador → luva.
- `/entradas/757`: bolha + piso escorregadio; o texto não fixa a ordem causal.
- `/entradas/761`: ventilador → laser → tanque de tubarões. Testar apenas o prefixo sem tubarão ainda exige observação.
- `/entradas/815`: empurrar um agente por três armadilhas diferentes sem recuperação.

O patch 1.10.0 documenta correção para vítimas lançadas pela luva serem afetadas por bolha. Isso reforça uma ligação candidata. Não prova que cinco relações isoladas se compõem na arena desejada. Valores de dano, impulso, alcance, fricção, duração e cooldown não foram decodificados nem preenchidos com suposições.

## Procedência

| Classe | O que existe | O que não se pode concluir |
|---|---|---|
| Execução original | Dois executáveis PE x86-64 presentes; tamanho e SHA-1 conferem com o manifesto Steam local | Presença/integridade não significa processo iniciado; execuções nesta investigação: **0** |
| Dado extraído | Nomes, descrições, combos e controles HTXT relidos dos arquivos originais; hashes e índices no recibo | Texto não prova física, acesso a debug ou comportamento no retail |
| Referência externa | Publicações oficiais da Rebellion e relatório de compatibilidade da CodeWeavers | Não constituem QA deste snapshot nesta máquina |
| Inferência | Ordem candidata e procedimento de ensaio em [arena-test-plan.md](arena-test-plan.md) | Não é mapa importável nem cadeia demonstrada |
| Reconstrução | Nenhuma lógica, arte, animação, colisão ou engine reconstruída | Não há simulador alternativo escondido nesta entrega |

Fonte: depots locais identificados pela biblioteca como snapshot `eg2-steam-29478f9a9d91`, manifestos de 04/04/2022. Não se inferiu uma versão de patch só pela data do manifesto; a versão deve ser registrada dentro do cliente ao executá-lo.

## Verificação e continuidade

Da raiz do workspace:

```sh
python3 prototypes/evil-genius-2-trap-arena/probe.py
```

O script lê `EG2_ROOT` (padrão `~/Games/SteamReferences/evil-genius-2`), reutiliza o leitor Asura da biblioteca sem modificá-lo e grava [evidence/static-probe.json](evidence/static-probe.json). Saída zero certifica somente a inspeção estática. `original_execution` permanece `not_tested`; `runtime_readiness` informa o bloqueio. Não há comando falso de jogar.

- Dois executáveis conferidos com o manifesto; seis tabelas relidas da fonte, somando 7.326 entradas e 46 textos selecionados, incluindo os cinco nomes nativos.
- Inspeção estática: `pass`. Ensaio negativo com fonte inexistente: saída 2 e `static_inspection: fail`, sem promover nenhuma capacidade de execução. Links locais do relatório conferidos.
- Inspeção dos hosts em [evidence/host-inventory.json](evidence/host-inventory.json).
- Estado do pedido: investigação/procedência atendidas; demonstração de controle, arena, cadeia e repetição **não atendidas**.
- QA visual, áudio, desempenho e gameplay: `not_assessed`, pois o cliente não rodou.
- Decisões conservadoras: save Sandbox separado; Laser Wall; nenhum número ou atalho de debug inventado; não instalar/ativar avaliação de software comercial nem alterar instalação existente como efeito da pesquisa.

**Condição que falta:** uma sessão acessível do Evil Genius 2 original em Windows, ou em uma instalação compatível de CrossOver com Steam autenticada. Isso destrava a primeira prova; não garante as cinco armadilhas em cadeia.

Próxima ação: executar a etapa 1 do plano no cliente, comprovando controle antes de montar a arena. Continuação pronta: “Retome `prototypes/evil-genius-2-trap-arena` no cliente original acessível. Siga o README e `arena-test-plan.md`: demonstre cenário, inimigos e dispositivos, monte a cadeia das cinco armadilhas e repita após recarga. Registre versão, camada de compatibilidade e vídeo; preserve o Rabisco e não substitua o motor.”
