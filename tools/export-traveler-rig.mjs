// Authoring input: use the actual target bind hierarchy, not a second rig definition.
import {motionRuntime} from '../tests/skill-motion-harness.mjs';
const api=await motionRuntime(null,null,true);
console.log(JSON.stringify([0,1,2,3].map(race=>{
 const a=api.Travelers.prepare(race);
 return {race,bind:a.bind,names:a.names,parents:a.parents,body:a.body};
})));
