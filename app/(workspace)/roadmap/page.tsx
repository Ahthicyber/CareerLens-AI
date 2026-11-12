import Roadmap from '@/components/career/roadmap';
import {authenticatedClient} from '@/lib/supabase/server';
import {roadmapReportSchema} from '@/lib/ai/career-schemas';
import {z} from 'zod';
export default async function Page({searchParams}:{searchParams:Promise<{id?:string}>}){const {id}=await searchParams;if(!id)return <Roadmap/>;if(!z.string().uuid().safeParse(id).success)return <Roadmap initialError="Invalid saved roadmap link."/>;const auth=await authenticatedClient();if(!auth)return null;const {data,error}=await auth.client.from('career_roadmaps').select('report').eq('id',id).eq('user_id',auth.user.id).maybeSingle();const parsed=roadmapReportSchema.safeParse(data?.report);if(error||!parsed.success)return <Roadmap initialError="This roadmap is unavailable or belongs to a different account."/>;return <Roadmap key={id} initialId={id} initialReport={parsed.data}/>;}
