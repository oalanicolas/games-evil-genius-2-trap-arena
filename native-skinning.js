import * as THREE from 'three';

export function nativeEightWeights(material){
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <skinning_pars_vertex>','#include <skinning_pars_vertex>\n#ifdef USE_SKINNING\nattribute vec4 skinIndexExtra;\nattribute vec4 skinWeightExtra;\n#endif');
  const matrices='\nmat4 boneMatEX = getBoneMatrix(skinIndexExtra.x);\nmat4 boneMatEY = getBoneMatrix(skinIndexExtra.y);\nmat4 boneMatEZ = getBoneMatrix(skinIndexExtra.z);\nmat4 boneMatEW = getBoneMatrix(skinIndexExtra.w);\n';
  shader.vertexShader=shader.vertexShader.replace('#include <skinbase_vertex>',THREE.ShaderChunk.skinbase_vertex.replace('#endif',matrices+'#endif'));
  const normal='skinMatrix += skinWeightExtra.x * boneMatEX;\nskinMatrix += skinWeightExtra.y * boneMatEY;\nskinMatrix += skinWeightExtra.z * boneMatEZ;\nskinMatrix += skinWeightExtra.w * boneMatEW;\n';
  shader.vertexShader=shader.vertexShader.replace('#include <skinnormal_vertex>',THREE.ShaderChunk.skinnormal_vertex.replace('skinMatrix = bindMatrixInverse',normal+'skinMatrix = bindMatrixInverse'));
  const extra='skinned += boneMatEX * skinVertex * skinWeightExtra.x;\nskinned += boneMatEY * skinVertex * skinWeightExtra.y;\nskinned += boneMatEZ * skinVertex * skinWeightExtra.z;\nskinned += boneMatEW * skinVertex * skinWeightExtra.w;\n';
  shader.vertexShader=shader.vertexShader.replace('#include <skinning_vertex>',THREE.ShaderChunk.skinning_vertex.replace('transformed = ( bindMatrixInverse',extra+'transformed = ( bindMatrixInverse'));
 };
 material.customProgramCacheKey=()=> 'eg2-native-eight-skin-lanes-v1';return material;
}

