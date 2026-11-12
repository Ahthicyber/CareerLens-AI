import { NextResponse } from 'next/server';
import { serverClient } from '@/lib/supabase/server';
import { sameOrigin } from '@/lib/auth';
export async function POST(request:Request){if(!sameOrigin(request))return NextResponse.json({error:'Invalid request origin.'},{status:403});const client=await serverClient();if(client){const{error}=await client.auth.signOut();if(error)return NextResponse.json({error:'Could not sign out. Please retry.'},{status:502});}return NextResponse.redirect(new URL('/login',request.url),303);}
