'use client';
import { createBrowserClient } from '@supabase/ssr';
import { supabaseConfig } from './config';
export function browserClient() {
 const config = supabaseConfig();
 if (!config) {
  throw new Error('Account sign-in is unavailable. The site owner needs to configure Supabase for this deployment.');
 }
 return createBrowserClient(config.url, config.key);
}
