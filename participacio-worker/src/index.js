// API compartida per a la cartografia de Puig i Cadafalch.
// Requereix un binding D1 anomenat DB i el secret WEB3FORMS_KEY per als avisos per correu.
const ALLOWED_ORIGIN = "https://jeancabot.github.io";
const OPTIONS = ["simbols","mapa","fitxes","xarxa","ruta"];
function response(body,status=200,origin=ALLOWED_ORIGIN){
 return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8","Access-Control-Allow-Origin":origin,"Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type","Vary":"Origin","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
}
async function totals(db){
 const {results}=await db.prepare("SELECT opcio, COUNT(*) AS n FROM vots GROUP BY opcio").all();
 const counts=Object.fromEntries(OPTIONS.map(id=>[id,0]));
 for(const row of results||[]) if(OPTIONS.includes(row.opcio)) counts[row.opcio]=Number(row.n)||0;
 return counts;
}
const clean=(value,max)=>typeof value==="string"?value.trim().slice(0,max):"";
export default {
 async fetch(request,env){
  const origin=request.headers.get("Origin");
  if(origin && origin!==ALLOWED_ORIGIN)return response({error:"Origen no autoritzat"},403);
  if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":ALLOWED_ORIGIN,"Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type","Vary":"Origin"}});
  if(!env.DB)return response({error:"D1 no configurat"},503);
  const pathname=new URL(request.url).pathname;
  try{
   if(pathname==="/api/vots" && request.method==="GET")return response({counts:await totals(env.DB)});
   if(pathname==="/api/vots" && request.method==="POST"){
    if(Number(request.headers.get("Content-Length")||0)>4096)return response({error:"Cos massa gran"},413);
    const data=await request.json();
    const opcio=data?.opcio;
    const voter=clean(data?.voter,80);
    if(!OPTIONS.includes(opcio)||!/^[0-9a-f-]{36}$/i.test(voter))return response({error:"Dades de vot invàlides"},400);
    // Una preferència per identificador de navegador; es pot canviar i no afegeix un segon vot.
    await env.DB.prepare("INSERT INTO vots (voter, opcio, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(voter) DO UPDATE SET opcio=excluded.opcio,updated_at=excluded.updated_at").bind(voter,opcio).run();
    return response({counts:await totals(env.DB),selected:opcio});
   }
   if(pathname==="/api/propostes" && request.method==="POST"){
    if(Number(request.headers.get("Content-Length")||0)>16000)return response({error:"Cos massa gran"},413);
    const data=await request.json();
    // Camp esquer per a bots; no revelem el criteri de rebuig.
    if(data?.botcheck)return response({ok:true,notified:false});
    const tipus=clean(data?.tipus,40),obra=clean(data?.obra,180),missatge=clean(data?.missatge,5000),font=clean(data?.font,1000),nom=clean(data?.nom,150),correu=clean(data?.correu,200);
    if(!["Correcció","Obra nova","Imatge o ubicació"].includes(tipus)||missatge.length<5)return response({error:"Proposta incompleta"},400);
    if(correu && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correu))return response({error:"Correu incorrecte"},400);
    const result=await env.DB.prepare("INSERT INTO propostes(tipus,obra,missatge,font,nom,correu) VALUES(?,?,?,?,?,?)").bind(tipus,obra,missatge,font,nom,correu).run();
    let notified=false;
    if(env.WEB3FORMS_KEY){
      try{
       const payload={access_key:env.WEB3FORMS_KEY,subject:"[Cartografia Puig i Cadafalch] "+tipus+": "+(obra||"proposta"),from_name:nom||"Cartografia Puig i Cadafalch","Tipus":tipus,"Obra":obra||"—","Missatge":missatge,"Font":font||"—","Nom":nom||"—","Correu":correu||"—"};
       if(correu)payload.replyto=correu;
       const res=await fetch("https://api.web3forms.com/submit",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(payload)});
       if(res.ok)notified=Boolean((await res.json()).success);
      }catch(e){notified=false;}
    }
    return response({ok:true,stored:true,notified,id:result.meta?.last_row_id??null},201);
   }
   if(pathname==="/api/estat" && request.method==="GET")return response({ok:true,service:"puig-cartografia-api"});
   return response({error:"Ruta no trobada"},404);
  }catch(e){return response({error:"No s'ha pogut completar l'operació"},500);}
 }
};
