# Eventos HCAN extraídos e vinculados ao leitor original

Cliente original **não executado**. Extração de dados e análise estática do
executável SHA256 `c52e656a6bbdfdf4f59aa03bfa0f11425854299e61fb078744e5865847c79042`.
Nenhuma nova regra de física foi aplicada à reconstrução Three.js nesta etapa.

## Resultado verificável

`decode-hcan-listeners.py` consome integralmente a região **posterior à tabela
nativa de hashes de ossos** de 85 HCAN22: união de 52 clipes da bancada e 70 clipes
referenciados pelos seis TRPA já selecionados. A âncora dos ossos é conferida contra
os nomes HSKN extraídos; metadados anteriores a essa tabela continuam fora deste
parser. Há 35 registros tipados: 28 bases confirmadas pelo leitor comum, dois
canais vetoriais completamente decodificados e sete subclasses mantidas opacas.
Mesmo nas 28 bases, os payloads específicos de outras subclasses ficam opacos.

Os registros não estavam no FNTR: o leitor HCAN `140124f30`, após os nomes e
metadados, lê contagem e array de canais em `140125a60..140125c28`. Os registros
sized/kind2 contêm tipo e tamanho antes do envelope. A factory do tipo `998715d4`
leva à vtable `140ad55c0`, cuja virtual+30 aponta ao leitor `1400d3cf0`. O leitor
base `1400d3850` recupera endpoints, ID, string terminada em zero e alinhada em
blocos de quatro bytes, array de bytes e hash do evento. O subtipo v4 adiciona modo.
Os campos sem consumidor comprovado permanecem `Raw`.

## Ligação concreta ao ventilador

`BounceOff_Mount_A_01` é referenciado por `FanTrap` em **20 entradas serializadas**
do TRPA. Isso comprova o vínculo do recurso; não significa 20 acertos ou execuções.
O clipe dura aproximadamente 1,3s. Não convertemos intervalos em segundos sem
resolver a origem do progresso.

| Canal | ID/hash da string | Evento | Intervalo normalizado bruto | Modo |
|---|---|---|---|---:|
| TrapBouncePosition | 4a28681e | d87366dd, destino de translação | 0 → f32(0,033) | 0 |
| MoveToPinnedPos | 8437e2f0 | d87366dd, destino de translação | f32(0,2) → f32(0,2) | 0 |

O branch `140545259..1405452bc` monta um evento com ID `4a28681e`, hash `d87366dd`
e XYZ selecionados, chamando a entrega `1400b8ed0`. Na mesma rotina,
`1405451d8/1405451e0` grava o destino escolhido em actor+420/424/428.
A consulta `1405a2510`, branch `1405a25bc`, atende `MoveToPinnedPos`: resolve a
instância por `14052b1b0`, copia esse destino e retorna tipo1. Os receptores e
interpolação já comprovados estão em `native-controller85-route.json`.

Falta decodificar a geração dos dois endpoints, os guards do branch, a colisão,
a navegação e o transform concreto do objeto. Não é uma constante de impulso,
nem autorização para substituir as velocidades atuais por números desses canais.
Também não prova quando `BounceOff` é escolhido em uma partida real.

## Gate e reprodução

```sh
python3 decode-hcan-listeners.py
python3 trace-hcan-listener-source.py
python3 validate-native-sources.py
```

Os scripts leem a biblioteca e o executável, escrevendo somente o protótipo.
`native-hcan-listeners-data.json` guarda offsets, hashes, referências e bytes
opacos; `native-hcan-listeners-code.json` guarda 17 janelas de código e sete de
dados com bytes, disassembly e SHA256. A auditoria recompõe os 85 resultados das
fontes e rejeita **360 corrupções de tamanho, contagem, truncamento, kind e encoding**.
Verifica também getter, vtable, factory, chamadas ao leitor base e IDs das strings.
O total agora é **207 janelas nativas** (144 gerais + 63 de regras).

O próximo recorte segue o produtor `545xxx`: origem dos endpoints e vínculo com
a colisão. R1 e goal permanecem ativos, **0/34 casos de fidelidade integral**.
