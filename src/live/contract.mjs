// Wire, save and session lifetimes are independent of the displayed build SHA.
export const LiveContract = Object.freeze({protocol:1, snapshot:1, session:1, save:4, minSave:3, graceMs:300000});
export function clientCompatible(client, server) {
  return !!client && client.protocol===server.protocol && client.snapshot===server.snapshot &&
    client.session===server.session && client.minSave<=server.save && client.save>=server.minSave;
}
export function safePlayer(p, room, t) {
  if(!p)return true;
  if(!p.alive)return !!p.recorded;
  return !p.prologue && !p.pendingSkill && !p.combo && !p.chain && !p.autoFight && !p.dash &&
    !p.attackStep && !p.queued && !p.rescueAt && !p.activity && !(p.stun>t) &&
    !(p.hitReactUntil>t) && !(p.hitstopUntil>t) && !(p.speechUntil>t) && !(p.motherUntil>t) &&
    !(p.actionUntil>t) && !(Math.hypot(p.input?.x||0,p.input?.z||0)>.01) &&
    !(room?.actors||[]).some(a=>a.alive && !['guard','villager','dummy'].includes(a.kind) &&
      (!a.neutral||a.aggro) && Math.hypot(a.x-p.x,a.z-p.z)<8);
}
export function safeGame(game) {
  if(game.blockSave||game.saving||game.importing||game.starting||game.ui?.modal)return false;
  if(game.screen!=='game')return true;
  return safePlayer(game.snapshot?.player,game.snapshot,game.snapshot?.t||0);
}
