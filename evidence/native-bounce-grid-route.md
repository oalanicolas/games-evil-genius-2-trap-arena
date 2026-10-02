# Destino de ricochete: grade, movimento e porte isolado

Fonte: disassembly estático do executável original, SHA256
`c52e656a6bbdfdf4f59aa03bfa0f11425854299e61fb078744e5865847c79042`.
Cliente original **não executado**. `native-grid-transport.js` é uma tradução
estreita de operações comprovadas, ainda **sem integração à arena**. Não é um
porte do motor nem uma captura de gameplay original.

## Vínculo novo comprovado

A atualização de movimento em `140543370` resolve um registro por dono do objeto.
Em `140543556` chama a correção lateral `140543c10`; em `140543569` passa o mesmo
vetor, o resultado dessa correção e o registro para `1405449e0`, a rotina que
chega ao evento `TrapBouncePosition` já decodificado no HCAN. Após a consulta,
flags actor+5c1bit0/actor+5c2bit1 podem impedir o ramo de translação normal.
Isso liga produtor, atualização do ator e evento, sem assumir que um intervalo
HCAN seja a velocidade da armadilha.

A rotina de contato consulta posição mais direção vezes um escalar, converte
XZ em coordenadas inteiras da grade, escolhe piso pela tabela nativa e exige
ponteiros e dimensões válidos. O classificador `1405453a0` retorna0/1/2 por bytes
da célula e lookups da cena/móvel. Não atribuimos nomes como chão ou parede aos
valores sem decodificar seus produtores. `1405f4820` consulta uma tabela por
coordenada; não foi comprovado que atualize os bytes da célula.

O fallback examina até nove vizinhas no sentido contrário ao vetor. Enquanto a
classificação for1, conserva a última célula e continua; outra classificação ou
célula inexistente segue para o cálculo de contato. O ramo de móvel também pode
escolher o ponto transformado mais próximo entre uma lista nativa. Seus dados,
alvos de escape e guards completos continuam pendentes.

## O que foi portado

`nativePrestep` reproduz a correção lateral de `543c10`:

- Direção X diferente de zero examina o desvio de Z ao centro da célula; caso
  contrário examina X. Limiar bruto f32(0,05), com vizinha de sinal oposto.
- Coeficiente f32(20), limitado pelo desvio e pelo input bruto de passo, com
  arredondamento float32 por operação. Não foi estabelecida aqui sua unidade.
- Classificação não zero fornece correção; classificação zero consulta escape
  e depois a vizinha na direção do movimento. Célula nula não chama escape.
  Sem resultado retorna vetor zero/false, sem presumir que célula ausente é sólida.

`nativeBoundaryCoordinates` reproduz a aritmética `544f7e..545125`: centros,
ponto intermediário e deslocamento por direção, offsets de altura distintos
f32(0,005)/f32(0,01), escala X/Z explicitamente fornecida e preservação do eixo
transversal quando não houve correção. Não decide qual alvo o controlador usa.
Os dois procedimentos requerem inputs e callbacks; não geram uma cena original.

## A escala não foi fixada por aparência

`1405a71c0` lê namespace hash212de4f7 e grupo2666f252; propriedades float
8b99f777/cdd5fd96/d4aba755 alimentam os globais de escala X/Y/Z, com Y negado.
O arquivo contém defaults1/-1/1, também usados na ausência da configuração.
Isso **não comprova** a escala final do mapa selecionado. A busca limitada dos
cinco hashes literais em483 recursos fnas não encontrou correspondências; não
prova ausência de configuração, pois nomes ou outras representações podem existir.
Não repetir essa busca literal: seguir o lookup tipado e seu recurso de origem.

## Validação e limites

```sh
python3 trace-bounce-grid-source.py
node test-native-grid-transport.mjs
python3 validate-native-sources.py
```

O JSON homônimo preserva17 janelas de código e10 de dados, com offsets, bytes,
disassembly e hashes. A auditoria confere as constantes e três chamadas diretas
independentemente do texto do relatório. Total atualizado:234 janelas nativas,
760 referências TRPA,85 tails HCAN e360 corrupções HCAN recusadas.

19 verificações do porte incluem eixos, limite float32, guard de célula nula,
segunda vizinha, cancelamento por escape, alturas, escala explícita e inputs
inválidos. São testes de uma reconstrução das operações; não executam o cliente
original nem comprovam fidelidade visual. Nenhuma captura nova de movimento foi
produzida, pois os dez hashes do runtime da última QA permanecem idênticos.

Ainda faltam configuração e células nativas selecionadas, providers de móvel e
escape, flags do registro, progresso/relógio e transform concreto do objeto.
A arena mantém suas regras reconstruídas e zero cadeias contínuas no default.
R1 e goal ativos;0/34 casos integralmente comprovados. Próximo: lookup de
configuração e população dos bytes da célula, antes de conectar este porte à cena.
