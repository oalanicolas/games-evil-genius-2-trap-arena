# Controlador 85, direção da montagem e seletor FNTR

Fonte: bytes de `evilgenius_vulkan.exe`, SHA-256
`c52e656a6bbdfdf4f59aa03bfa0f11425854299e61fb078744e5865847c79042`.
Somente leitura e disassembly; cliente original não executado. O JSON homônimo
preserva as janelas de código/dados, offsets, hashes e registros decodificados.

## Fatos comprovados nesta etapa

1. A factory `59f9e0` aceita tipos 80–85. Tipo 85 aloca 0x50 e usa vtable
   `b0d3e8`. O código realocado registra seu ponteiro em `141a430d8` por
   `1592a5f06`; **não é uma chamada direta**. `101b60..101bfd` lê esse ponteiro,
   chama a factory com o byte do buffer e despacha a desserialização por virtual+10.
   O buffer vem de model+10→+88/+90, sob flag +92bit0; ainda falta ligar seu writer
   ao evento E8. O leitor de tipo85 é `5a21b0`.
2. O prefixo FNTR recuperado anteriormente até B+355 foi continuado pela ordem
   do leitor `652f45..653199`. A array +210 é lida por `4d4e00`, com envelope
   80000001, flag0, tamanho4 e contagem0 em todos os cinco registros. Após os
   campos +1f4,+1f8,+1fc,+200,+204,+208, o u32 em **B+394** alimenta FNTR+1b0.
   O decoder aceita somente a variante plana dos registros selecionados; recusa
   outras codificações e limites inválidos em vez de presumir offsets.

| Registro | FNTR+1b0 | Consulta 0e1f74ce |
|---|---:|---|
| FanTrap | 1 | vetor actor+718 |
| BoxingGlove | 1 | vetor actor+718 |
| BubbleBlower | 1 | vetor actor+718 |
| SoapTrap | 0 | retorna false; não fornece vetor nesta consulta |
| LaserWall | 0 | retorna false; não fornece vetor nesta consulta |

3. A consulta `5a2510`, branch `5a2689`, também suporta opções 2 (delta planar
   normalizado de alvo), 3 (callback do controlador do móvel, virtual+68) e 4
   (actor+724). Retorno false não significa velocidade zero nem ausência de outros
   movimentos. Na fase 06343c19 a rotação primária TRPA é contornada. Nas demais,
   o vetor é rotacionado por TRPA+8b8 quando o recurso existe. Com clip/esqueleto,
   ainda aplica a rotação amostrada do canal extra HCAN. O resultado tem tipo0.
4. actor+718 vem do payload808e+0c; este recebe param+3c. O produtor identificado
   `987590` chama `612d00` com output em param+3c em `98778e`. `612d00` escolhe a
   subestrutura component+10/+1a0 pelo argumento r9b, usa o par inteiro +0c,
   a rotação cardinal record+0c e produz XYZ com Y=0. Exige guard e lookup válidos.
   Assim, esse caminho não fornece uma constante de velocidade global +X.
5. `59ed80..59eea4` invoca controller virtual+48 = `5a29a0`. Este consulta
   virtual+50 = `5a2510` para canais da montagem e cria eventos de vetor:
   tipo0 usa f05c69fc, tipo1 usa d87366dd. `0b8ed0→0b8ae0` entrega por
   receiver virtual+38. Os dois receptores concretos foram identificados nesta
   continuação: **f05c69fc recebe direção para orientação; d87366dd recebe um
   destino de translação**. Nenhum dos dois fornece uma velocidade intrínseca.

## Receptores e deslocamento confirmados diretamente no executável

O vínculo não depende de nomes presumidos: `0b8190` registra o listener pelo hash
retornado pela sua virtual+0. A entrega `0b8ae0` consulta esse hash; `0b9780`
seleciona também pelo identificador do canal event+10/listener+40 e então chama
virtual+38. A auditoria confere os ponteiros das duas vtables e o retorno dos
getters diretamente nos bytes do PE.

| Evento | Vtable | Getter | Receptor virtual+38 | Efeito comprovado |
|---|---|---|---|---|
| f05c69fc | ad3dc0 | 0b6f90 | 0b5980 | XYZ → base 3×3 → quaternion xyzw em listener+90 |
| d87366dd | ad3e60 | 0b7010 | 0b5430 | XYZ → destino em listener+8c/90/94; scalar+24 → +a4 |

Ambos recusam evento nulo, hash incompatível ou listener+3c diferente de zero.
No receptor de direção, distância quadrada menor que `f32(1e-6)` aos três globais
`142235580/584/588` retorna true **sem alterar o estado ou o quaternion**. Os valores
desses globais no runtime ainda não foram comprovados; não presumimos zero.
O receptor normaliza o vetor e chama `15cd90` para formar a base. Esta função usa
`f32(1e-12)` para decidir a base vertical. `086140` converte a matriz em quaternion
por trace/maior diagonal. O vetor não é escrito como impulso ou velocidade.

O começo de orientação (`0b5890`) lê a matriz atual do objeto vinculado ou aplica a
matriz de destino. A atualização (`0b5930`) chama `0b6d80`, um interpolador diferente
do nlerp dos ossos HCAN. A direção do agente no mundo e o vínculo desse objeto com
o investigador ainda precisam ser provados antes de substituir o yaw da arena.

Na translação, `0b54d0` captura a posição inicial. Quando modo+78 é 1, **substitui**
o Y de destino por `f32(Y inicial + scalar do evento)`; não soma esse valor ao Y de
destino já recebido. Quando o progresso já atingiu o fim, chama o setter do objeto
com o destino. Nos demais quadros, `0b5580` calcula:

- Com clipe/canal extra válido e comprimentos diferentes nos extremos:
  `alpha = abs(comprimento atual − inicial) / abs(comprimento final − inicial)`.
  O comprimento vem da posição XYZ amostrada por `0ce210`, com retarget de raiz
  e espelhamento de X condicionado pelo flag original.
- No fallback, `alpha = (progresso − início capturado) / (fim − início capturado)`;
  denominador não positivo retorna false.
- Limita alpha a 0..1 e grava `inicial + alpha × (destino − inicial)` em
  listener+18/1c/20, com operações float32.

Os endpoints channel+8/+c são copiados e limitados a 0..1 por `0b4e60`; modo+50 é
copiado por `0b52a0`. `0b5080` usa uma tabela de **seis estados do listener**, chama
start/update/exit pelas virtuais +68/+70/+78 e usa os mesmos endpoints. Esses seis
estados não são os estados FNTR da armadilha nem provam recuperação do agente.
A conversão do progresso para tempo de jogo e os registros concretos que fornecem
os endpoints ainda faltam. Não tratamos essa faixa como duração em segundos.

## Consequência para a arena

Os números de velocidade autorais de `rules.json` não foram promovidos a dados
nativos. Os receptores genéricos agora têm semântica demonstrada, mas faltam os
registros de canal, inputs do runtime e aplicação dos transforms ao ator. O caminho
original não foi ligado à física da arena. A bolha forçada para +X e a propulsão do piso ainda
são divergências abertas. Nada foi ajustado para preservar artificialmente a cadeia.

A correção separada em `simulation.js` elimina dois atalhos comprováveis no próprio
protótipo: o histórico não concede imunidade permanente por tipo e cinco tipos no
histórico não contam como sequência contínua. A liberação por saída/reentrada do
sensor é uma **regra reconstruída**, não a elegibilidade do cliente original. O
critério de continuidade observa retorno ao estado walk desta simulação; a
recuperação original continua desconhecida. A montagem atual contém duas
recuperações e não comprova a cadeia integral solicitada.

## Próxima rota

Localizar os registros de canal que fornecem +8/+c (endpoints), +50 (modo) e +14
(ID), e os métodos concretos do objeto owner+70→+30 que recebem os transforms.
Isso permitirá transportar a trajetória e seu relógio com inputs do jogo, em vez
de inventar velocidades. Permanecem também o writer model+88/+90/+92 e o produtor
267d5762. Não repetir scans de igualdade E8 ou de hashes literais já inconclusivos.

Prova atual: 28 janelas de código e 11 de dados neste relatório; auditoria global
confere 183 janelas, incluindo as de regras, 760 referências de clipes e os dois
receptores. É análise estática do executável original, não execução do cliente nem
equivalência integral da reconstrução. O runtime da arena não mudou nesta etapa.
