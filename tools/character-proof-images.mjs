// Encode actual browser captures for a compact, directly reviewable GitHub diff.
import fs from 'node:fs/promises';
import {createCanvas,loadImage} from '@napi-rs/canvas';
const directory=new URL('../docs/character/travelers/evidence/',import.meta.url);
export async function encodeCharacterProof(){
 for(const name of ['before-gameplay','after-gameplay','human-close','elf-close','dwarf-close','fox-close','armed','rest']){
  const input=await loadImage(await fs.readFile(new URL(name+'.png',directory)));
  const canvas=createCanvas(input.width,input.height);canvas.getContext('2d').drawImage(input,0,0);
  await fs.writeFile(new URL(name+'.jpg',directory),canvas.toBuffer('image/jpeg',82));
 }
}
if(process.argv[1]&&new URL('file://'+process.argv[1]).href===import.meta.url)await encodeCharacterProof();
