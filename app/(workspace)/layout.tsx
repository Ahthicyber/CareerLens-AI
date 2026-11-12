import { DashboardShell } from '@/components/dashboard-shell';
import { authenticatedClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
export default async function Layout({children}:{children:React.ReactNode}){const auth=await authenticatedClient();if(!auth)redirect('/login');return <DashboardShell user={{id:auth.user.id,email:auth.user.email||'Your account'}} demo={false}>{children}</DashboardShell>;}
