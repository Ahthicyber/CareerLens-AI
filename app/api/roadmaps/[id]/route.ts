import {NextResponse} from 'next/server';
import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import {authenticatedClient} from '@/lib/supabase/server';
import {sameOrigin} from '@/lib/auth';
const input=z.object({taskId:z.string().min(1).max(50),completed:z.boolean()});
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 if(!sameOrigin(request))return NextResponse.json({error:'Invalid request origin.'},{status:403});
 const auth=await authenticatedClient();if(!auth)return NextResponse.json({error:'Sign in to update your roadmap.'},{status:401});
 const{id}=await params;if(!z.string().uuid().safeParse(id).success)return NextResponse.json({error:'Invalid roadmap ID.'},{status:400});
 try{const raw=await request.text();if(raw.length>1000)return NextResponse.json({error:'Request too large.'},{status:413});const parsed=input.safeParse(JSON.parse(raw));if(!parsed.success)return NextResponse.json({error:'Invalid task update.'},{status:400});const{data,error}=await auth.client.rpc('set_roadmap_task_completed',{p_roadmap_id:id,p_task_key:parsed.data.taskId,p_completed:parsed.data.completed});if(error)return NextResponse.json({error:'Task could not be updated. Check that this roadmap exists and the Phase 3 migration is applied.'},{status:503});revalidatePath('/history');revalidatePath('/dashboard');return NextResponse.json({report:data});}catch{return NextResponse.json({error:'Invalid task request.'},{status:400});}
}
