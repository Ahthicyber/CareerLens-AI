export function safeNext(value:string|null|undefined){
 if(!value||!/^\/(?!\/)/.test(value)||value.includes('\\')||/[\u0000-\u0020]/.test(value))return '/dashboard';
 try{const url=new URL(value,'https://careerlens.invalid');return url.origin==='https://careerlens.invalid'?url.pathname+url.search+url.hash:'/dashboard';}catch{return '/dashboard';}
}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');return !origin||origin===new URL(request.url).origin;}
