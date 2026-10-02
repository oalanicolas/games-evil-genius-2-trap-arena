# Handoff: Evil Genius 2 — fidelidade da arena de armadilhas

**Prioridade:** P1 · **Escopo:** intra_processo · **Tipo:** agent_transfer  
**Data:** 2026-10-02 · **De:** Codex, sessão principal · **Para:** agente sem contexto  
**Handoff anterior:** nenhum · **Estado do artefato:** approved (qualidade documental; não aprovação do jogo)

## Resumo para máquina

```yaml
handoff:
  from: "Codex:01a0fac2-6cf8-7221-98cf-0832629e36ac"
  to: "Agent:next-session"
  date: "2026-10-02"
  scope: "intra_processo"
  type: "agent_transfer"
  priority: "P1"
  parent_handoff: null
  consumed: null
context:
  what_was_done:
    - "Arena Three.js com modelos, caminhada e poses de reação extraídos; comportamento ainda parcialmente autoral."
    - "Porte isolado native-trap-state.js: decisão temporal e interseção de máscaras, com 659 verificações."
    - "Auditoria consolidada de 285 janelas nativas, 25 campos temporais e 34 casos inventariados."
    - "Investigação adicional localizou tabela BLUE e construção de máscaras; pesquisa preservada em evidence/handoff-sensor-research."
  what_remains:
    - "Provar vínculo FNTR+0x508 com grupos BLUE das cinco armadilhas e produtor da máscara dinâmica +0xb8."
    - "Recuperar elegibilidade, seleção de agentes e efeitos de entrada antes de integrar o controlador na arena."
    - "Comparar 34 casos, provar cadeia contínua e obter aceite de Alan."
  files_modified:
    - "native-trap-state.js"
    - "test-native-trap-state.mjs"
    - "trace-grid-config-source.py"
    - "validate-native-sources.py"
    - "build_fidelity_reference.py"
    - "README.md"
    - "game-design.md"
    - "docs/gauntlet-fidelidade-eg2.json"
    - "docs/handoffs/2026-10-02-fidelidade-eg2.md"
  decisions_made:
    - "Alan autorizou reconstrução web isolada e exige obter comportamento diretamente dos arquivos do jogo."
    - "Alan vetou alterar Rabisco e substituir silenciosamente o motor."
    - "Portes incompletos permanecem isolados; nenhuma equivalência total é declarada."
  blockers: []
```

## 1. Contexto crítico

O projeto é `prototypes/evil-genius-2-trap-arena`, um laboratório web Three.js no workspace de jogos de Alan Nicolas. Usa recursos já extraídos de `libraries/evil-genius-2`, que permanece somente leitura. O recorte contém investigador caminhando, ventilador, luva, bolha, piso escorregadio e laser.

**Problema: a arena funciona tecnicamente, mas sensores, seleção, deslocamento e encadeamento ainda divergem do jogo e Alan recusou esse comportamento.**

**Solução: recuperar produtores e consumidores no executável e nos recursos, portar suas regras com provas e integrar só contratos fundamentados, comparando a execução em movimento.**

Fatos em 2026-10-02:

- **VIGENTE:** goal da sessão de origem está **paused**, confirmado por `get_goal` nesta entrega; não complete. Para continuar automaticamente na sessão de origem, Alan usa `/goal resume`. Outra sessão recebe este handoff e trabalha no ledger; não criar goal duplicado sem pedido explícito.
- **VIGENTE:** ledger R0 concluída, R1 em andamento, demais abertas; escritor `codex-eg2-fidelidade`. Placar atual: 7 abertas, 1 em andamento, 1 concluída, zero bloqueadas.
- **VIGENTE:** 0/34 casos fechados com fidelidade; zero cadeias contínuas de cinco efeitos na montagem inicial.
- **VIGENTE:** nenhum cliente original executado. Leitura estática e porte web não são execução Asura.
- **SUPERADO:** pesquisa inicialmente dedicada à execução do cliente original; substituída pela reconstrução web autorizada. Preserve `original-client-investigation.md` como histórico.
- **SUPERADO:** caminhada procedural do baseline; substituída por HCAN extraído. Há trechos antigos dessa descrição na receita do gauntlet; runtime e relatórios recentes prevalecem para fatos, critérios selados continuam obrigatórios.

Decisões de Alan (registradas nesta sessão em 2026-10-02): manter em `prototypes`; abrir funcional no navegador; agente andando e fiel ao jogo; usar biblioteca existente; buscar informações diretamente no jogo em vez de calibrar por tentativa; preservar Rabisco. Não houve autorização para instalar, publicar, trocar motor ou aprovar o resultado pelo usuário.

Leia antes de executar, a partir da raiz do workspace:

- `AGENTS.md` e skill `framework/core/SKILL.md` (game-dev): regras e procedimento; confirme o caminho da skill no catálogo atual.
- `squads/goal-gauntlet/SKILL.md` e `docs/gauntlet-fidelidade-eg2.json` do protótipo: ordem, critérios e escritor único.
- `README.md`, `game-design.md`, `arena-test-plan.md` do protótipo: runtime, divergências, QA e proveniência.
- `evidence/native-grid-config-route.json`, `evidence/native-source-audit.json`, `evidence/native-trap-state-qa.json`: provas existentes e limites.
- `native-trap-state.js`, `native-grid-transport.js`, respectivos testes: contratos já portados, ainda isolados.
- `trace-grid-config-source.py`, `decode-native-grid-config.py`, `decode-native-cell-types.py`, `decode-native-footprints.py`: reutilizar leitores e rastreamento.
- `evidence/handoff-sensor-research/manifest.json` e arquivos ali listados: pesquisa mais recente, ainda não integrada na auditoria geral.
- `framework/core/references/craft-floor.md` imediatamente antes de editar: preservar acabamento e fundamentar contratos.

## 2. Estrutura e glossário

Os caminhos sem prefixo neste documento são relativos ao protótipo; scripts do framework e squads são relativos ao workspace. O protótipo **não tem repositório próprio nem entrada de módulo**; aparece `?? ./` no Git do hub. HEAD do hub: `56c26c1627c37f6c870fd1c01a409d4b0a91d539`, branch `main`. Há alterações em vários outros módulos: são contexto de outras sessões, não mexer nem atribuir a esta. Sem commit/push/deploy deste trabalho. Não havia AGENTS local ou CHANGELOG; AGENTS foi criado nesta passagem apenas para apontar o handoff.

| Termo | Significado |
|---|---|
| Alan | Usuário; decide direção e aceite visual/comportamental. |
| Asura | Motor comercial de EG2; não executado aqui. |
| Reconstrução | Implementação Three.js, inclusive renderer e navegação próprios. |
| FNTR | Definição binária de dispositivo/mobília. |
| BLUE | Tabela binária de namespaces, grupos e propriedades. |
| HCAN | Animação comprimida extraída; 52 clipes decodificados neste recorte. |
| HSKN | Esqueleto nativo; investigador com 81 ossos. |
| TRPA | Tabela de associação/seleção de animações das armadilhas. |
| RSCF | Recurso de modelo convertido pela biblioteca. |
| VA | Endereço virtual do executável; imagem base 0x140000000. |
| f32 | Float32; arredondamento pode alterar fronteiras de tempo. |
| Ledger | Livro selado do gauntlet, com provas e estados das rodadas. |
| Máscara | Grade de bits por célula; não um sensor circular. |
| unknown | Lacuna explícita; impede fechar o caso relevante. |

## 3. Resultado já obtido

O histórico inteiro precede esta passagem; a última fatia de investigação fez leituras e scratch, sem modificar runtime. Esta entrega preserva o scratch para não depender de `/tmp`.

- Investigador: oito influências por vértice, caminhada HCAN, revólveres nos ossos; avanço derivado ~1,147059 unidades/s. Cinco poses loop de reação são extraídas; seleção, relógio e transições ainda reconstruídos.
- Ventilador: sete ossos; Mount 1,2s, Loop 0,8s, Dismount 0,5s extraídos. Agendamento relativo ao acerto e corte de piso Y=0 são reconstruídos.
- `native-grid-transport.js`: classificação/transporte por células, 1.715 verificações; `native-trap-state.js`: 659. Ambos fora da arena.
- Auditoria existente: 222 janelas gerais + 63 de regras = 285; 25 campos temporais; 760 referências TRPA verificadas. Consulte JSON, não trate números como fidelidade.
- Último QA de navegador registrado: fan-cycle 42/42, fan 13/13, walk 35/35, reactions 11/11, controles verdes, zero erros. **Não rerodado nesta entrega.**

Tempos nativos dos estados 2/3/4/5/6, em segundos:

| Dispositivo | 2 | 3 | 4 | 5 | 6 |
|---|---:|---:|---:|---:|---:|
| FanTrap | 0,5 | 4,5 | 0,5 | 50 | 30 |
| BoxingGlove | 3 | 0 | 1,533 | 40 | 30 |
| BubbleBlower | 0,5 | 2 | 1,333 | 50 | 30 |
| SoapTrap | 0,5 | 2,5 | 1 | 40 | 30 |
| LaserWall | 0 | 5 | 0,5 | 40 | 30 |

O teste usa os floats exatos. Expiração é `f32(clock − threshold) > timestamp`, estrita; não trocar por duração decorrida. `predicate5cfa60` é condição do dispositivo/ambiente, não presença de inimigo. A decisão retorna **estado solicitado**, não estado final: entrada 1 em 618240 chama 618080 e pode mudar novamente. Flag FNTR18f é verdadeira nas cinco fontes selecionadas; produtor de 18c desconhecido. Não nomear enums por suposição.

## 4. Pesquisa de sensores: ponto exato de continuidade

Executável disponível em `~/Games/SteamReferences/evil-genius-2/bin/evilgenius_vulkan.exe`, SHA256 `c52e656a6bbdfdf4f59aa03bfa0f11425854299e61fb078744e5865847c79042`. Python existente `~/.pyenv/versions/3.12.12/bin/python3.12` tem pefile/capstone. **Não disassemble a .text protegida inteira.** A seção .reloc contém código relevante; inicie somente em fronteira de instrução. `.pdata` pode delimitar fragmentos, não funções lógicas completas.

Todos os endereços abreviados abaixo recebem prefixo 0x140. Pesquisa preservada em `evidence/handoff-sensor-research/`; manifesto verifica bytes das instruções contra o EXE, mas **não certifica interpretação semântica**. O helper `eg2-receiver-research.py` é reutilizável; importar sem executar seu bloco principal.

**Vínculo comprovado:** 5d6770 constrói componente do dispositivo. 5d680f consulta tabela global141cb12d8 (count141cb12d4), stride0xc8; compara grupoID da entrada com **FNTR+0x508** e 5d6879 grava ponteiro em component[0]. Offset serializado/produtor de 508 ainda não localizado. Portanto nomes BLUE sozinhos não ligam as cinco famílias.

**Loader:** 6746a0..674a6f consulta namespace **94e286b5**, parent **828aa203**, filhos diretos; pula grupos que possuem filhos; chama 674b30 por entrada. BLUE correto: `libraries/evil-genius-2/assets/resources/dfdc575c241fd03e8a77914a9264f4880860e750e65a61b19cff4151637b5f81.bin`, origem `misc/common.asr` offset904356. SHA é o basename, 50.003 bytes; parser existente leu132 grupos. Tail de76 bytes permanece opaco.

**Grupos candidatos, ainda não binding:** LaserWall58e00e06 (4×4, anchor15); BoxingGlove6c1f8e5c (2×4, anchor7), alternativa c272e733; SoapTrap141eec27 (2×2, anchor3); BubbleCannoncf18e73b (2×4, anchor7); JetEnginef4c32a17 (4×8, anchor31), alternativas42d344a9/0482990c/42d335a1. Fan=JetEngine é hipótese.

**674b30 propriedades:** largura keyce9657d8→resource4 u16; profundidadef13b5314→6; anchorIndexc3e1af26→8/a por resto/quociente da largura. Tipo0, defaults1/1/0.

**675170 leitor de células:** arrays basehash42378464 (rotações) e36ca39ee (IDs de grupos), ambos via 10f6a0 modo 2. Esse enumerador formata sufixos de índice, aplica hash31 e consulta propriedade; **ler literal em VA140ad68e8** para provar formato. Não inferir array pelo metadata field4. Falta índice0 é tolerada; falta índice posterior encerra. Chaves observadas começam92680164 ead237c6e, com crescimento hash31 após dois dígitos.

Cada ID válido gera registro stride0xb8 em resource28/count24. IDs zero/ausentes pulam registro, preservando índice para coordenadas. Coordenadas int16: `(index%width−anchorX, floor(index/width)−anchorZ)`. Propriedades herdadas via 10e3a0:

| Flag do registro | Key | Default |
|---|---|---|
| +4 | 0ef69119 | false |
| +5 | 3b0c054e | false |
| +6 | 29586dc5 | false |
| +7 | e60e0509 | true |
| +8 | 2cbedca1 | true |

Tipo bool2; rotação+c u32, ausente0, low16≥4 zera o inteiro. Floats+10/+14 keys9f80d137/9f80d049 default0. 675700 adiciona slots de animação/ações; investigar só se consumidor exigir.

**61a5f0 constrói máscaras estáticas** do layout escolhido por6131c0. Para coordenadas locais A/B e deltas dx/dz: `worldX=originX+B*dx−A*dz`, `worldZ=originZ+A*dx+B*dz`, inteiros32; Y=originY. Flag5→layout18 (componente28); flag4→48; flag6→78; flag7→108; flag8→138. **Não escreve layout+a8 (componente+b8)**. Sensor613000 exige interseção das máscaras b8 e28. Próxima busca: produtor de b8, provavelmente rotas617cc0/61a920, hipótese ainda aberta.

61a4b0 **não combina máscaras**: copia parâmetros do recurso para33c/340/344/348/34c/350 e seleciona ação. 619e90 registra máscaras no mapa do piso. 61ad00 consulta máscara58 e intersecta b8, resolve atores dos buckets do piso; trecho preservado é parcial. Falta fechar essa rota e615210/616d80 (elegibilidade/seleção),618240 (entradas aninhadas),flag18c.

## 5. O que falta e critérios

Agora a arena ainda usa impulso fan4,5/glove4,8/bubble+x1,8/slip4, sensores circulares/cones, latch por entrada, tempos/danos assumidos. Montagem faz cinco acertos com duas recuperações; não cadeia contínua.

Desejado: seleção, tempo, deslocamento, contato, recuperação e falhas de montagem coerentes com fonte; 34/34 casos sem unknown relevante; cinco dispositivos no mesmo agente sem atalhos; aceite de Alan.

Checks existentes a preservar: `node test-native-trap-state.mjs` →659/allPassed; `node test-native-grid-transport.mjs` →1.715; `python3 validate-native-sources.py` →sem assertion, 285 janelas, 25 campos. Rodar no diretório do protótipo com Python acima. Sucesso final: `gauntlet.py placar` →GAUNTLET FECHADO **e** evidência 34/34/aceite; sintaxe verde sozinha não fecha fidelidade.

## 6. Plano e vetos

1. Retomar R1 pelo ledger, assumir escritor somente quando iniciar execução. Consolidar pesquisa no `trace-grid-config-source.py` e relatório existente; adaptar parser BLUE e auditor, provar508 e máscara b8 antes de integrar sensores.
2. Recuperar elegibilidade e entradas; testar fronteiras e casos negativos contra bytes/dados. Manter unknown explícito.
3. Integrar fontes completas, comparar gameplay em movimento; seguir R2–RF na ordem. Não afrouxar livro selado (hash5664948047250f3bdc6641260c652fa5d7eeee1aa996788da53cd5865af8454f).

Vetos: alterar biblioteca/Rabisco; calibrar números para forçar cadeia; confundir animação extraída com motor original; reduzir acabamento para FPS; instalar/commit/push/deploy sem pedido. Não sobrescrever `evidence/native-rules-research.json` (relatório anterior); estender relatórios próprios. Hooks de estilo antigos têm attribution unknown: não ampliar escopo nem tratá-los como regressões. Não há rejeição de aprovação automática pendente.

## 7. Protocolo de partida

Primeiro comando, na raiz do workspace:

```sh
python3 framework/scripts/game.py context prototypes/evil-genius-2-trap-arena --event resume
```

Leia o JSON inteiro; **--brief foi rejeitado nesta versão**. Se precisar, redirecione para scratch e leia por partes. Context confirmou ausência de nó/estudos do protótipo no vault. Depois rode placar, leia skills, marque este handoff consumed no registro e assuma escritor se necessário.

Auto-verificação:

- O original rodou? **Não.** Se responder sim, releia seção1.
- As659 verificações provam sensor funcionando na arena? **Não; fixtures e porte isolados.** Releia3–4.
- Nomes dos grupos provam ligação FNTR? **Não; recuperar508.** Releia4.
- Goal concluído? **Não, pausado; ledger aberto.** Releia1/5.

## 8. Exemplo concreto e ambiente

Para começar a próxima fatia sem calibrar: leia `eg2-property-array10f6a0.asm`; com pefile obtenha bytes do literalVA140ad68e8; prove sufixo e hash31; replique lookup com herança no parser existente; registre offsets/tipos; depois rastreie leitor FNTR até508 e compare IDs das cinco definições. Resultado esperado: referências resolvidas por campo, não por nome, com lacunas explícitas para vínculos ausentes.

Servidor: `python3 prototypes/evil-genius-2-trap-arena/server.py`, loopback 8766; arena `/`, bancada `/native-motion.html`. Verifique antes de iniciar outro. Sessão antiga 3112 e abas antigas não foram verificadas nesta entrega. QA headless realGPU com `--use-angle=metal --ignore-gpu-blocklist`; importar Playwright de `libraries/metal-assault/lab/node_modules/playwright/index.mjs`, channel chrome; não instalar nem escrever cliente CDP. CUA apenas para abrir resultado solicitado; após compaction, rewriteDocumentation antes de continuar CUA.

Mídias estão no Drive, pastaID `1unnAAuktsWmU8PmUaT29x6m4CGfjYLbj`; último acervo 66 arquivos/44 mídias/~17,3MiB, recibos em evidence. Novas capturas/vídeos vão ao Drive; nenhum necessário para este handoff documental. Referências de gameplay e timecodes estão na receita/readme; não chamar vídeo localizado de observado.

## 9. Métricas e estado de entrega

| Métrica | Atual | Meta |
|---|---:|---:|
| Casos de fidelidade fechados | 0/34 | 34/34 |
| Cadeia contínua inicial | 0 | Prova ao vivo com 5 efeitos e negativos |
| Porte de estados | 659 | Preservar verde e integrar binding comprovado |
| Janelas auditadas gerais/regras | 222/63 | Preservar e ampliar somente com evidência |
| Aceite Alan | Ausente | Mensagem explícita após comparação |

Auditoria global `gameops.py audit` concluída: 111 repositórios presentes, 0 não baixados; confirma protótipo sem Git e sem cópia remota. Outros pendentes do hub não pertencem a este escopo. Git/context foram leituras. Nesta passagem foram preservados 10 arquivos de pesquisa e conferidas 2.213 instruções contra bytes do EXE, sem alteração funcional.

## 10. Pendências para Alan

Somente o aceite final do recorte em movimento (R7), quando a comparação estiver pronta. Não pedir decisões já dadas; pesquisa e implementação dentro do escopo podem seguir pelo próximo agente. Não há bloqueio externo comprovado que impeça a próxima leitura estática.

Qualidade documental: checklist completo 10/10; validador estrutural 10/10 PASS na entrega. A aprovação deste documento não certifica fidelidade do protótipo.
