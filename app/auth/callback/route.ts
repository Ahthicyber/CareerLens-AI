import { NextResponse } from 'next/server';
import { serverClient } from '@/lib/supabase/server';
import { safeNext } from '@/lib/auth';
export async function GET(request:Request){const url=new URL(request.url);const code=url.searchParams.get('code');const client=await serverClient();if(code&&client){try{const{error}=await client.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(safeNext(url.searchParams.get('next')),url.origin));}catch{/* Show a recoverable error without leaking provider details. */}}return NextResponse.redirect(new URL('/login?message=This+sign-in+link+could+not+be+verified.+Please+try+again.',url.origin));}
