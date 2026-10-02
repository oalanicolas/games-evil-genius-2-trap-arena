// Extracted mesh pivot and named HSKN attachment bones. The association is inferred
// from the investigator/revolvers clip and bone names, not a recovered loadout rule.
export function attachInvestigatorRevolvers(bones,cloneModel){
 return ['bn_L_weapon','bn_R_weapon'].map(name=>{
  const bone=bones.find(b=>b.name===name);
  if(!bone)throw Error('Missing native attachment bone '+name);
  const mesh=cloneModel('ohw_ranged_pistolinvestigatorsrevolver');
  mesh.name='extracted-investigator-revolver';bone.add(mesh);
  return {bone:name,object:mesh};
 });
}
