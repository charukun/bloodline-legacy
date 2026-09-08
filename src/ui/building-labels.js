/* Screen positions follow the camera that rendered this frame. HUD content can
 * keep its slower update cadence; these static world anchors must not lag it. */
class BuildingLabels {
 constructor(root){this.root=root;this.nodes=new Map();this.frame=0;}
 clear(){for(const entry of this.nodes.values())entry.node.remove();this.nodes.clear();}
 update(snapshot,renderer){
  if(!snapshot?.player){this.clear();return;}
  const p=snapshot.player,frame=++this.frame;
  for(const label of renderer.labels){
   // Preserve the existing distance and renderer frustum visibility rules.
   if(Math.hypot(label.x-p.x,label.z-p.z)>14)continue;
   const pos=renderer.project(label.x,label.y,label.z);
   if(!pos.visible)continue;
   let entry=this.nodes.get(label);
   if(!entry){
    const node=this.root.ownerDocument.createElement('span');
    node.className='building-label';node.style.left='0';node.style.top='0';
    entry={node};this.nodes.set(label,entry);
   }
   const {node}=entry;
   if(entry.text!==label.text){node.textContent=label.text;entry.text=label.text;}
   // Fractional CSS pixels and a compositor transform avoid integer stepping
   // and per-frame left/top layout. No extra easing or delayed camera is used.
   const transform=`translate3d(${pos.x}px,${pos.y}px,0) translate(-50%,-100%)`;
   if(entry.transform!==transform){node.style.transform=transform;entry.transform=transform;}
   // The legacy HUD replaces its label HTML; reattach the same nodes afterward.
   // This also works with the parallel UI WORK's keyed world-label updates.
   if(node.parentNode!==this.root)this.root.appendChild(node);
   entry.frame=frame;
  }
  for(const [label,entry]of this.nodes){
   if(entry.frame!==frame){entry.node.remove();this.nodes.delete(label);}
  }
 }
}
