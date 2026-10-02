# HCAN22 — leitura estática do código original

Nenhum código do executável foi executado. Fonte: `evilgenius_vulkan.exe`, SHA256 e
trechos com VA, bytes e hashes registrados em `native-animation-code.json`.
Os nomes de funções abaixo são rótulos descritivos, não símbolos recuperados.

## Formato e quantização confirmados

O dispatch compara `HCAN` em `0x1401293fe` e chama o loader em `0x140129498`.
O loader `0x140124f30` exige flag de arquivo `0x20`, aceita versão até22,
e chama `0x1400d4400` para a estrutura comprimida em `0x14012523b`.
O leitor consome: dois u16 de limite de tempo, três u32 de contagens,
descritores de12 bytes, rotações de8 bytes, tempos de rotação de2 bytes,
posições de12 bytes e tempos de posição de2 bytes, nessa ordem.
Os offsets da estrutura em memória, relativos ao subobjeto de canais, são:
descritores `+0x20`, temposQ `+0x28`, valoresQ `+0x30`, temposP `+0x38`, valoresP `+0x40`.

Em `0x1400d4ba7..0x1400d4bc8`, quatro u16 são convertidos para float,
multiplicados pelo vetor em `0x140ad55b0` e somados ao vetor em `0x140ad55a0`.
Os vetores são exatamente `(1/32767,1/32767,1/32767,1/65535)` em f32
e `(-1,-1,-1,0)`. Isso confirma o decoder, inclusive xyzw e w não negativo.

## Amostragem confirmada

`0x1400d4ac0` encontra duas chaves por busca binária. Recebe tempo inteiro no
domínio0..65535; o chamador `0x1400d2bfd` usa `cvtss2si` depois de multiplicar
tempo normalizado por65535 (`0x1400d2be8`). Na configuração padrão de MXCSR,
isso arredonda para inteiro mais próximo com empate para par.

Rotações entre duas chaves: dot, inversão do sinal da segunda quaternion pelo
bit de sinal do dot, interpolação linear, divisão pela norma.
VA `0x1400d4be3..0x1400d4c3d`: **nlerp pelo arco curto**, não slerp.
Quando há uma chave ou tempo0, `0x1400d4c42..68` retorna o quaternion decodificado
sem normalização. Não normalizar arbitrariamente cada chave antes da interpolação.
Posições: interpolação linear com alpha limitado a0..1 em `0x1400d4cf5..0x1400d4d4f`;
uma chave/tempo0 retorna diretamente o float3 em `0x1400d4d56..6c`.

## Bind e deltas confirmados

O loader remapeia flags de arquivo para flags do objeto em `0x1401251b7..1f7`:
`0x200 → bit2`, `0x400 → bit4`, `0x800 → bit8`. O flag0x10 mantém bit0x10.
No consumidor `0x1400d2af0`, a estrutura de pose de bind tem28 bytes por osso:
float3 de posição e float4 de quaternion.

`0x1400d2cbf` testa bit2. Dentro dessa condição, `0x1400d2ccf` testa bit4.
Quando ambos existem, `0x1400d2ce9` chama o produto de quaternions com
RCX=bindQ, R8=sampleQ. O helper `0x1400b2cd0` calcula **Hamilton(bindQ,sampleQ)**.
Por exemplo, o componente x em `0x1400b2d3a..72` é
`aw*bx + bw*ax + ay*bz - az*by`; portanto a ordem é **bind × delta**.
O helper preserva RCX. Em `0x1400d2d00`, `0x1400a2430` recebe esse mesmo bindQ
e rotaciona sampleP pelo quaternion. Em `0x1400d2d26..3f`, soma bindP.

Consequências por flags de arquivo:

| Flags | Quaternion local | Posição local |
|---|---|---|
| sem0x200 | sampleQ | sampleP |
|0x200, sem0x400 | sampleQ | bindP + sampleP |
|0x200 e0x400 | bindQ × sampleQ | bindP + rotate(bindQ,sampleP) |

O caminho principal de montagem de pose em `0x1400cd285..0x1400cd2f3` também
escala sampleP por `length(targetBindP)/nativeBoneLengthScalar` quando o escalar
nativo é maior que f32(0,01). O fator xmm9 é exatamente f32(1), carregado
em `0x1400ccf33` de `0x140b4b224` (bytes `0000803f`). A auditoria de todas as
774 instruções de `0x1400cced0..0x1400cdc07` registra cada acesso a xmm9 no JSON:
não há outra definição antes do uso em `0x1400cd2c7`; o epílogo restaura o registro.
Os escalares carregados com flag1
em `0x1401252b0..c9` são os mesmos floats que o decoder comparou às normas de HSKN.

Equivalente matemático JavaScript para o caso típico do ator:

```js
// qBind/qDelta são xyzw; produtos Hamilton usuais.
const qLocal = qBind.clone().multiply(qDelta); // bind * delta
const pLocal = pDelta.clone().applyQuaternion(qBind).add(pBind);
// Retarget comprovado no caminho de pose, quando aplicável:
const pRetarget = pDelta.clone().multiplyScalar(targetBindLength / sourceBoneLength)
  .applyQuaternion(qBind).add(pBind);
// Interpolação de amostras nativas: não usar slerp.
function nativeNlerp(a, b, alpha) {
  const dot = a.reduce((s, x, i) => s + x * b[i], 0);
  const sign = dot < 0 ? -1 : 1;
  const q = a.map((x, i) => x + alpha * (sign * b[i] - x));
  const n = Math.hypot(...q);
  return q.map(x => x / n);
}
// Uma chave ou tempo quantizado0: retornar o sampleQ original.
```

## Canal adicional e limites

O loader usa flag0x10 para permitir `boneCount+1` canais; o canal final não é
um osso HSKN. Consumidores em `0x1400d32..0x1400d35` exigem bit0x10 e amostram
o índice `boneCount` para derivadas de posição/rotação. Isso comprova o uso
desse canal separado como fonte de movimento do modelo. A fatia R1 abaixo
rastreia a escala, a conversão para o frame do objeto e uma integração de posição.
A aceitação pela navegação/collision e a convenção da câmera continuam fora
do trecho rastreado.

Não há comparação com execução do cliente original. Handedness/conversão de
eixos na renderização e aplicação de todas as flags superiores permanecem
questões de integração. Esta evidência resolve a quantização, nlerp e a ordem
de composição local usada pelo cliente original, sem tuning visual.


## R1 — escala do canal extra e posição do objeto

O escalar adicional da montagem de pose está resolvido: xmm9=1. O limiar em
`0x140b4af08` tem bytes `0ad7233c`, f32 `0.009999999776482582`. A razão de
comprimentos só é aplicada quando `nativeBoneLengthScalar > limiar`.

O canal extra tem sua própria razão de retarget em `0x1400d35d0..0x1400d3642`.
Escolhe índice `i=(runtimeFlags>>5)&1`; usa
`length(targetBindPose[i].p)/sourceScalar[i]` quando há esqueleto, array de
escalares e escalar maior que esse mesmo limiar. Nos outros casos retorna1.
`0x1401252de..0x140125318` define runtime bit0x20 se há pelo menos dois ossos,
scalar[0]<f32(0,1) e scalar[0]<scalar[1]. O índice de referência pode portanto
ser1; não usar sempre o primeiro osso nem um fator arbitrário de velocidade.

A função `0x1400d4d90` deriva a posição do canal extra entre amostras adjacentes:
`Vextra=(P[lo+1]-P[lo]) / ((timeHiBound-timeLoBound)/65535 * duration)`.
Os limites temporais começam nos dois u16 do header do subobjeto HCAN e são
atualizados pela busca binária; nas bordas, não substituir esses limites
arbitrariamente pelos tempos de chaves. `0x140105950` passa a duração da animação,
o float do clip em+8, e suporta mistura de duas animações. `0x1400d32d0` aplica
a razão de retarget; o argumento de reversão nega XYZ, o de espelho nega apenasX.
`0x1400d31f0` também espelha a posiçãoX e os componentesY/Z do quaternion extra.
Esse espelho nativo corresponde a reflexãoX, não a uma reflexãoY da câmera.

A ponte `0x140104840` chama essa derivada em `0x140104907` e obtém o quaternion
extra em `0x140104927`. Em `0x140104934..0x140104a39`, nega os três componentes
XYZ desse quaternion, preservandoW, e rotaciona o vetor: conjugada(Qextra).
Em `0x140104a43..0x140104b20`, aplica o quaternion do objeto em+0x120.
O ramo de trajetória adiciona a velocidade `(fim-início)/duraçãoDaTrajetória`.
O ramo sem objeto de trajetória repete as duas rotações em
`0x140104b7f..0x140104d98`. Não há permuta ou reflexão de eixos nesses trechos.

`0x1401047dd..0x140104815` chama o slot virtual+0xd8 para obter a velocidade,
a armazena em objeto+0x110, guarda a posição anterior em+0xe0 e integra
`objeto[+0x100] += velocidade*dt`. Isso comprova um consumidor de deslocamento
no frame do objeto; não comprova que navegação/collision sempre aceita o resultado.
Outro caminho, `0x1400cc550`, passa a derivada ponderada para o acumulador
`0x1400cb850` em `0x1400cc798`; existem flags de blend/reversão/playback nesse
caminho, e a ligação delas com cada estado de gameplay continua desconhecida.

Equivalente das fórmulas efetivamente presentes nessa ponte:

```js
// xyzw, fórmula quadrática completa nativa; não pressupõe norma exatamente1.
function rotateNative(q, v) {
  const [x, y, z, w] = q, [vx, vy, vz] = v;
  const dot = x*vx + y*vy + z*vz;
  const a = w*w - x*x - y*y - z*z;
  return [
    2*dot*x + 2*w*(y*vz-z*vy) + a*vx,
    2*dot*y + 2*w*(z*vx-x*vz) + a*vy,
    2*dot*z + 2*w*(x*vy-y*vx) + a*vz,
  ];
}
const conjugate = ([x,y,z,w]) => [-x,-y,-z,w];
// Vextra já inclui retarget, reversão e espelho quando esses argumentos existem.
const vBody = rotateNative(conjugate(qExtra), vExtra);
const vObject = rotateNative(qObject, vBody);
const vTotal = vObject.map((v,i) => v + trajectoryVelocity[i]);
const pNext = pObject.map((p,i) => p + dt*vTotal[i]);
```

## R1 — matriz de orientação e limite da prova de eixos

O slot virtual+0xe0 é usado por `0x140102026` para obter a transformação inicial.
Seu resultado de posição vai para objeto+0x100; o quaternion vai para+0x120 em
`0x1401020af`. A tabela candidata em `0x140ad6608` associa+0xd8 a
`0x140104840` e+0xe0 a `0x140104dd0` por ponteiros explícitos, registrados no JSON.
O accessor `0x140104dd0` segue `objeto+0x10 → +0x40 → primeiro ponteiro`.
Nesse transform, virtual+0x10 retorna o float3 da posição, e virtual+0x18 retorna
uma matriz de nove floats convertida por `0x140086140`.

O conversor lê a diagonal em offsets0,16,32. No ramo de trace positivo:
`w=sqrt(m[0]+m[4]+m[8]+1)/2`; os componentesXYZ são
`[m[7]-m[5],m[2]-m[6],m[3]-m[1]]/(4*w)`.
Essa equação é a conversão de matriz3×3 row-major para quaternion xyzw de rotação
ativa. Ela coincide com Hamilton(q,[v,0],conjugate(q)), e não insere troca de
eixos ou reflexão. A tradução das fórmulas foi validada com100 quaternions/vetores
sintéticos e100 matrizes de trace positivo; os erros máximos estão no JSON.
A validação é algébrica em Python, não execução ou equivalência visual do cliente.

Ainda falta resolver a implementação concreta dos slots+0x10/+0x18 desse
scene-transform, verificar se a matriz já acumula os pais e chegar à base
vertical e à view/projection. Portanto **não está provado que uma câmera do Bench
com reflexãoY reproduz a câmera original**. +Z de um walk é deslocamento no
frame nativo da animação; sua direção no frame externo depende de Qextra e
Qobjeto conforme a fórmula comprovada. Não declarar handedness global ou sinal
do eixo vertical a partir da aparência da malha.

Próximo experimento seguro: rastrear a construção/atribuição do ponteiro de
transform em `objeto+0x10 → +0x40`, recuperar os alvos concretos dos slots+0x10 e
+0x18 e seus acessos à matriz global. Manter desconhecido até haver essa prova.
Decoder, amostras/exportações e runtime permaneceram intocados nesta fatia.

## R1 — consumidor concreto de posição e limite da aceitação

A atribuição `0x14075af9e..0x14075afab` instancia a vtable
`0x140b12478`; o bind em `0x14075afb4` passa por `0x1400f95e0`.
Esse thunk salta para código original relocacionado legível em
`0x1433608c0..0x143360a36`: grava `model+0x70=motion`, insere motion na
lista `model+0x40` e grava `motion+0x10=model` em `0x143360a21`.
Não se deve interpretar os bytes após o jump do thunk como a função original.
A associação resolve o owner do accessor, mas não a implementação concreta
virtual+0x10/+0x18 do transform por trás do primeiro ponteiro da cena.

O override `0x14059f000` chama update base `0x1401039e0`, cujo call
`0x140103c44` integra a velocidade extra já provada. Se `motion+0x4c==2`,
o override resolve o ator por entityID em `model+0x40→+0x90`, via
`0x14052c840`; então copia os três floats de `motion+0x100` para cada
registro associado ao ator, stride32, em `0x14059f0a0..0x14059f0b9`.
Não há escala, permuta, projeção ou clamp nessa cópia. A identidade concreta
da subclasse ordinary investigator e o consumidor final desses registros
continuam sem prova; a associação não certifica aceitação de colisão.

Depois do integrador, o update base chama virtual+0xc8 em `0x140103cd5`
quando flags+0x150 bit1 e+0x154 bit3 estão ligados e bit4 está desligado.
Retorno verdadeiro apenas liga bit4; não existe rollback nesse trecho.
O alvo concreto `0x14059f220` é um predicado de interação com controller tag84.
Exige ator+0x464==2, obtém instância por ator+0x650 e consulta **FNTR**
com lookup `0x14065be10`, usando instância+0x138. A associação de tipo vem
literalmente do dispatcher FNTR/reindexação da coleção0x141cb1088, registrada
em `native-rules-research.md`, VAs0x1406849f1/684b29/650bd7/650be1.
Não são campos TRPA: FNTR+0x2c8 possui grupos stride0x40 e slots stride0x88.

Se slot+0x50>0, o predicado retorna verdadeiro quando
`distanceXYZ(actorPosition,actor[+0x65c])² <= slot[+0x50]²`.
O anchor+0x65c/660/664 é salvo ao entrar com estado2 em
`0x14059f873..0x14059f897`. Fora desse limite, exige slot+0x54>0 e
count+0x74>1; helper0x140656d70 testa candidatos, e sucesso chama
0x140657970. Os nomes GUI e função de colisão geral desses campos não estão
provados. Controller84 é construído em0x1405392d0 com vtable0x140b0cc00;
seu callback+0x20, chamado em0x140103d1f, é0x1400576b0 (`ret`). Portanto
esse callback não é um acceptor de movimento demonstrado.

## R1 — conversão FNTR comprova plano XZ e origem de grid

`0x140657dc0..0x140657e9f` transforma float3 local para posição externa,
preservando Y durante rotações discretas do plano XZ. As operações são:

```js
// Pseudocódigo sem nomes semânticos inventados para campos nativos.
function fntrPosition(local, instance, origin, scaleX, scaleZ) {
  let x = local[0]*scaleX, z = local[2]*scaleZ;
  if (instance.at1d4 === 1) [x,z] = [z,-x];
  else if (instance.at1d8 === -1) [x,z] = [-x,-z];
  else if (instance.at1d4 === -1) [x,z] = [-z,x];
  return [x+origin[0], local[1]+origin[1]+instance.at18c, z+origin[2]];
}
```

X/Z escalas são globals writable0x141a1e608/610 (1.0 no arquivo, valor de
runtime desconhecido). Origin é calculada por0x1405b48d0 a partir dos três
inteiros de instância+0x1c8: X=(gridX+0.5)*scaleX,
Z=(gridZ+0.5)*scaleZ. GridY é índice unsigned, normalizado para0 se>=count;
se ainda válido, Y=-float(table[index])-f32(0.01); se inválido, Y=0.
A tabela de inteiros0x141cb0280/count0x141cb028c é BSS preenchido em runtime.
O helper de seleção0x140656d70 também faz a conversão inversa XZ/Y e usa
origem em seu caminho flag1 (0x1406570a8..0x140657266).

Isso comprova que **Y é perpendicular ao plano XZ da interação e recebe
o offset separado+0x18c**. Não comprova sinal para cima/gravity, ordem de
andares, metros nem câmera. Nenhuma observação visual foi usada.
Próximo experimento delimitado: recuperar o consumidor dos registros stride32
ou o concrete transform ligado ao primeiro ponteiro de model+0x40; para
sinal vertical, rastrear os writers da tabela0x141cb0280 e seu enum/ordem.
Os intervalos, bytes e SHA256 do original estão no JSON. Decoder, exports e
runtime permanecem intocados nesta fatia.

## R1 — produtor de actor+0x118: default provado, atualização desconhecida

O construtor0x140751810 mantém ator emrdi e zera r14 em0x140751859.
Após instalar vtable0x140b25ab8 em0x140751863, executa
`0x140751957:4c89b718010000 mov qword ptr[rdi+0x118],r14`.
Isso prova dword inicial0 e também zera+0x11c. **Não prova valor atual
em partida nem que o índice jamais muda.** A identidade semântica de corpo,
arma, sexo ou tipo não é inferida desse default ou dos25 grupos.

Rota1: vtable+0x68 aponta0x140754a50, rotina completa de snapshot preservando
ator original emrsi e snapshot emr15. A auditoria de stores diretos por rsi
não encontra gravação larga110/114 cobrindo118 nem LEAactor118. O call
0x140754f5f para0x14021e8f0 recebe uma base virtual ajustada, não ator inicial:
0x140754f50..f5c soma8+signed(vbtable[+8]). O construtor concreto0x14071d1b0
instala actor+8=0x140b225d0 em0x14071d1c9; essa vbtable tem
[-8,0xaa0,0xac8]. Portanto essa base fica emactor+0xad0.
O helper preserva a base emrbx; seus writes diretos base+0x28/+0x30/+0xd4
ficam fora deactor118. As consequências dos calls virtuais/genéricos ainda
não foram eliminadas: isto é exclusão de stores diretos e de alias de base.

A mesma classe substitui a vtable por0x140b22540; seu slot+68 é0x14071db10.
O override copia snapshot+ac..bb para actor+9d0..9df e snapshot+bc para
actor+a98, e tail-jump0x140754a50. Também não escreve118 diretamente.
Os dois layouts e a proveniência da base estão registrados por bytes/hash.

Rota2: buscamos escapes LEA118 e stores largos em110/114, com alinhamento a
entradas relocacionadas e preservação deREX. A busca é delimitada aos
thunks0x140700000..0x140770000 e janela0x1600 por destino; não é prova de
cobertura total do executável. Não apareceu producer com owner ator provado.
A aparente scalar write0x140740f37 perde seuREX: a instrução alinhada é
0x140740f36:`48898118010000 mov qword ptr[rcx+0x118],rax`.
Rax veio deLEA0x140740f2f (vtable0x140b225e0); ctor0x140740f10 chama base
0x140738da0. É outro layout virtual, não uma assignment do índice do ator.
O candidato703960→1593b1190 apenas zeraqword+118 num inicializador cujo
owner não foi associado ao ator; foi excluído da prova, sem inventar um tipo.

Paramos após as duas rotas sem producer novo. Próxima alternativa segura:
seguir virtual+20=0x140753fc0 com proveniência do ator e escrita indireta por
offset de metadata, ou recuperar tabela de fields que passe destinoactor118
para writer genérico. Permanecem desconhecidos producer nãozero, valor atual
e significado semântico do índice. Runtime, decoder, exports e regras não
foram modificados. Fonte original foi somente lida.

## R1 — virtual +0x20 e metadados da criação: owner delimitado

Fonte original continua com SHA256 c52e656a6bbdfdf4f59aa03bfa0f11425854299e61fb078744e5865847c79042; somente leitura estática. Nenhuma execução original, instalação, mudança de runtime/exports/decoder.

Rota1: vtable ator +0x20=0x140753fc0, thunk `e9abb0d618` para0x1594bf070. Wrapper completo mantém atorRCX emRBX (1594bf091) e registroRDX emR12 (1594bf087). R14 é o objeto retornado por0x140770510 (1594bf0ae). Os stores +40..78 são emR14, **não actor**. Os únicos stores diretos pelo ownerRBX são lockactor+970. O helper completo770510 recebeactor/registro; lê propriedades nativas tag3U32+8 e tag2byte+8, obtém outro objeto por registry do virtualbase+70. Nenhuma escrita direta pelo owner cobre118.

Rota2: virtual+30=75a660→1594c62f0 mantématorRDI e chama75ab40(actor,1) em1594c638f.75ab40 mantématorRDI;649fb0(actor+70) retorna recursoRSI de tipo não provado. Resource+198QWORD é o registro opcional entregue10f6a0 em75ac66. Fields explícitos resource+148→actor1e0,14c/150→440,c0/default1→468,16c→7c,170→80 não atribuem118. Tail75ca10→1594cae80 retématorRBX e altera76c/95c/770, sem store118. Instruções protegidas/selfpatch em1594c6359..6364 e1594caf61..68 são preservadas sem executar ou supor restauração; claims limitados às instruções/calls/owners legíveis.

Ambos770510 e75ab40 constroem o mesmo contexto: vtable0x140b44778 (LEAs770873/75ac25), context+8=actor+20,context+10=retorno scenevirtual88. **Correção de scratch:770873 resolve b44778, não b44678.** Dispatcher10f6a0(key9baf6c35,mode2) enumera propriedades numeradas e chama callbackcontext+10 em10f781; não é um setter por offset de field do ator. Vtable b44778 contém[6628c0,0576b0,96a810,0576b0], logo begin/end são noop.96a810 lê U32property+8 e passaactor+20 como containerRCX para969d60. Este resolve registrob226b991/value, monta descriptor e chama96a020. Container usa heaparray[+0],capacity[+8],count[+c],flagbyte[+10]; entrada = heaparray + count*0x70. As gravações nas entradas pertencem à heap e não podem ser renomeadas comoactor118 por similaridade de offset. Helpers externos/modelbinding ainda não foram eliminados transitivamente.

As duas novas rotas fecham exclusões diretas e proveniência do contexto, **sem producer nãozero/current**. Desconhecidos: assignment118, field/enum serializado, significado corporal/arma/sexo e efeitos indiretos arbitrários. Próximo alvo concreto já associadoaoowner:75aba7 chama757840(actor,0,actor+434);75786b retématorR14 e757876 lêactor+428+EDX*4. Inspecionar essa rotina/callees com owner provado, sem novo raw scanREX nem assumir que seleciona corpo. Janelas completas de thunk/body/callback e a entrada delimitada desse próximo alvo têm bytes e SHA256 no JSON.
