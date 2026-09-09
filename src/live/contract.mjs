// Wire, save and session lifetimes are independent of the displayed build SHA.
export const LiveContract = Object.freeze({protocol:1, snapshot:1, session:1, save:4, minSave:3, account:1, graceMs:300000});
export function clientCompatible(client, server) {
  return !!client && client.protocol===server.protocol && client.snapshot===server.snapshot &&
    client.session===server.session && client.minSave<=server.save && client.save>=server.minSave;
}
export function safePlayer(p, room, t) {
  if(!p)return true;
  if(p.legacyChoice?.state==='pending')return false;
  if(!p.alive)return !!p.recorded;
  return !['downed','carried','recovering'].includes(p.lifeState) && !p.rescueTarget && !p.carrierId && !p.traversal && !p.prologue && !p.pendingSkill && !p.combo && !p.chain && !p.autoFight && !p.dash &&
    !p.attackStep && !((room?.kind||room?.room?.kind)==='village'&&p.z>29.5) && !p.queued && !p.rescueAt && !p.activity && !(p.stun>t) &&
    !(p.hitReactUntil>t) && !(p.hitstopUntil>t) && !(p.speechUntil>t) && !(p.motherUntil>t) &&
    !(p.actionUntil>t) && !(Math.hypot(p.input?.x||0,p.input?.z||0)>.01) &&
    !(room?.actors||[]).some(a=>a.alive && !['guard','villager','dummy'].includes(a.kind) &&
      (!a.neutral||a.aggro) && Math.hypot(a.x-p.x,a.z-p.z)<8);
}
export function safeGame(game) {
  if(game.blockSave||game.saving||game.importing||game.starting||game.ui?.modal)return false;
  if(game.ui?.talkFan?.menu||game.ui?.talkFan?.pointer||game.ui?.talkFan?.recognition||game.pointer||game.walkTarget||game.commandBuffer?.length)return false;
  if(Math.hypot(game.pendingMove?.x||0,game.pendingMove?.z||0)>.01)return false;
  if(game.snapshot?.player?.legacyChoice?.state==='pending')return false;
  if(game.screen!=='game')return true;
  return safePlayer(game.snapshot?.player,game.snapshot,game.snapshot?.t||0);
}
