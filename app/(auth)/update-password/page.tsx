import { redirect } from 'next/navigation';
import { authenticatedClient } from '@/lib/supabase/server';
import AuthForm from '@/components/auth-form';
export default async function Page(){if(!await authenticatedClient())redirect('/reset-password');return <AuthForm mode="update"/>;}
