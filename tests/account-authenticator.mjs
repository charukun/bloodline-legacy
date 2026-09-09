// A software test authenticator with real P-256 signing. Production verification
// is exercised without stubbing SimpleWebAuthn or claiming a browser/device test.
import {encodeCBOR} from '@levischuck/tiny-cbor';
import {randomBytes,generateKeyPairSync,sign,createHash} from 'node:crypto';
const hash=value=>createHash('sha256').update(value).digest();
const b64=value=>Buffer.from(value).toString('base64url');
export const token=()=>randomBytes(32).toString('base64url');
export const recoveryCode=()=>randomBytes(24).toString('hex').toUpperCase();
export function authenticator(){
 const {publicKey,privateKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'}),jwk=publicKey.export({format:'jwk'}),id=randomBytes(32);
 const cose=encodeCBOR(new Map([[1,2],[3,-7],[-1,1],[-2,new Uint8Array(Buffer.from(jwk.x,'base64url'))],[-3,new Uint8Array(Buffer.from(jwk.y,'base64url'))]]));
 let userHandle,counter=0;
 return {
  id:b64(id),
  register(options,{origin='https://test.invalid',rpID=new URL(origin).hostname,uv=true,challenge=options.challenge}={}){
   userHandle??=options.user.id;const length=Buffer.alloc(2);length.writeUInt16BE(id.length);
   const authData=Buffer.concat([hash(rpID),Buffer.from([uv?0x45:0x41]),Buffer.alloc(4),Buffer.alloc(16),length,id,cose]);
   return {id:b64(id),rawId:b64(id),type:'public-key',clientExtensionResults:{credProps:{rk:true}},response:{
    clientDataJSON:b64(JSON.stringify({type:'webauthn.create',challenge,origin,crossOrigin:false})),
    attestationObject:b64(encodeCBOR(new Map([['fmt','none'],['attStmt',new Map()],['authData',new Uint8Array(authData)]]))),transports:['internal']}};
  },
  login(options,{origin='https://test.invalid',rpID=new URL(origin).hostname,uv=true,challenge=options.challenge,handle=userHandle,signCount=++counter}={}){
   const count=Buffer.alloc(4);count.writeUInt32BE(signCount);
   const authData=Buffer.concat([hash(rpID),Buffer.from([uv?5:1]),count]);
   const clientData=Buffer.from(JSON.stringify({type:'webauthn.get',challenge,origin,crossOrigin:false}));
   return {id:b64(id),rawId:b64(id),type:'public-key',clientExtensionResults:{},response:{clientDataJSON:b64(clientData),
    authenticatorData:b64(authData),signature:b64(sign('sha256',Buffer.concat([authData,hash(clientData)]),privateKey)),userHandle:handle}};
  }
 };
}
