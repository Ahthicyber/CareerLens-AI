import Settings from '@/components/account-settings';
import { authenticatedClient } from '@/lib/supabase/server';
export default async function Page(){const auth=await authenticatedClient();const profile=auth?await auth.client.from('profiles').select('display_name').eq('id',auth.user.id).maybeSingle():null;return <Settings initialName={profile?.data?.display_name||''}/>;}
