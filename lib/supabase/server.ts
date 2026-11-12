import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseConfig } from './config';
export async function serverClient(){
 const config=supabaseConfig();if(!config)return null;
 const store=await cookies();
 return createServerClient(config.url,config.key,{cookies:{getAll:()=>store.getAll(),setAll(values){try{values.forEach(({name,value,options})=>store.set(name,value,options));}catch{/* Server Components cannot write cookies; proxy refreshes them. */}}}});
}
export async function authenticatedClient(){
 const client=await serverClient();if(!client)return null;
 try{const {data,error}=await client.auth.getUser();if(error||!data.user)return null;return {client,user:data.user};}catch{return null;}
}
