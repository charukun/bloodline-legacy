import fs from 'node:fs/promises';
import path from 'node:path';

/** Embed once, so the hosted game and the downloadable HTML use identical UI. */
export async function buildLineage(root) {
 const asset = async (name, mime) => 'data:'+mime+';base64,'+(await fs.readFile(path.join(root,'public/assets',name))).toString('base64');
 let css=await fs.readFile(path.join(root,'src/ui/lineage/view.css'),'utf8');
 for(const [key,name,mime] of [
  ['PAPER','parchment.png','image/png'],['CLOTH','cloth-panel.png','image/png'],
  ['PEOPLE','lineage/race-illustrations.png','image/png']
 ]) css=css.replaceAll('__'+key+'__',await asset(name,mime));
 const films=await Promise.all([0,1,2,3].map(async i=>({
  src:await asset('lineage/memory-'+i+'.mp4','video/mp4'),
  poster:await asset('lineage/poster-'+i+'.jpg','image/jpeg')
 })));
 const font=await asset('lineage/ledger-serif.ttf','font/ttf');
 const fontLicense=await fs.readFile(path.join(root,'public/assets/lineage/OFL.txt'),'utf8');
 return {
  data:{html:await fs.readFile(path.join(root,'src/ui/lineage/view.html'),'utf8'),css,films},
  // Font faces are registered at document scope for use inside Shadow DOM.
  fontCSS:`/* ${fontLicense} */\n@font-face{font-family:BloodlineLedger;src:url('${font}') format('truetype');font-display:swap}`
 };
}
