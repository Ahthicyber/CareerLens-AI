import { createServerClient } from '@supabase/ssr';
import { NextResponse,type NextRequest } from 'next/server';
import { supabaseConfig } from '@/lib/supabase/config';
export async function proxy(request:NextRequest){
 let response=NextResponse.next({request});const config=supabaseConfig();if(!config)return response;
 const client=createServerClient(config.url,config.key,{cookies:{getAll:()=>request.cookies.getAll(),setAll(values){values.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});values.forEach(({name,value,options})=>response.cookies.set(name,value,options));}}});
 try{await client.auth.getClaims();}catch{/* Protected pages and APIs independently reject unverifiable sessions. */}
 response.headers.set('Cache-Control','private, no-store');
 return response;
}
export const config={matcher:['/dashboard/:path*','/resume/:path*','/job-match/:path*','/interview/:path*','/cover-letter/:path*','/roadmap/:path*','/history/:path*','/settings/:path*','/auth/:path*','/api/:path*','/login','/signup','/reset-password','/update-password']};
