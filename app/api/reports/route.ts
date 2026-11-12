import { revalidatePath } from 'next/cache';
import { loadCloudReports } from '@/lib/supabase/reports';
import { NextResponse } from 'next/server';
import { authenticatedClient } from '@/lib/supabase/server';
import { reportTables,saveReportSchema,reportScore } from '@/lib/reports';
import { sameOrigin } from '@/lib/auth';
import {evaluateInterview} from '@/lib/career';
export async function GET(){const result=await loadCloudReports();if(result.error)return NextResponse.json({error:result.error},{status:result.unauthorized?401:503});return NextResponse.json({reports:result.reports},{headers:{'Cache-Control':'private, no-store'}});}
export async function POST(request:Request){if(!sameOrigin(request))return NextResponse.json({error:'Invalid request origin.'},{status:403});const auth=await authenticatedClient();if(!auth)return NextResponse.json({error:'Sign in to save a report.'},{status:401});
 try{const raw=await request.text();if(raw.length>100000)return NextResponse.json({error:'Report too large.'},{status:413});const parsed=saveReportSchema.safeParse(JSON.parse(raw));if(!parsed.success)return NextResponse.json({error:'The report is invalid.'},{status:400});
 const item=parsed.data;const score=reportScore(item);const report=item.kind==='job-match'?{...item.data,overall:score}:item.kind==='interview'?{...item.data,evaluation:evaluateInterview(item.data.answers,item.data.evaluation)}:item.data;
 const saved=item.kind==='interview'||item.kind==='roadmap'
  ?await auth.client.rpc('save_career_artifact',{p_kind:item.kind,p_title:item.title,p_report:report,p_is_demo:item.demo})
  :await auth.client.from(reportTables[item.kind]).insert({user_id:auth.user.id,title:item.title,report,is_demo:item.demo,...(item.kind==='cover-letter'?{content:item.data.letter}:{score})}).select('id').single();
 const {error}=saved;const id=item.kind==='interview'||item.kind==='roadmap'?saved.data:saved.data?.id;
 if(error)return NextResponse.json({error:'Could not save. Check the database migrations in SUPABASE_SETUP.md and try again.'},{status:503});revalidatePath('/history');revalidatePath('/dashboard');return NextResponse.json({id},{status:201});
 }catch{return NextResponse.json({error:'Invalid report request.'},{status:400});}}
export async function DELETE(request:Request){if(!sameOrigin(request))return NextResponse.json({error:'Invalid request origin.'},{status:403});const auth=await authenticatedClient();if(!auth)return NextResponse.json({error:'Sign in to delete a report.'},{status:401});
 const url=new URL(request.url);const kind=url.searchParams.get('kind');const id=url.searchParams.get('id');if(!kind||!Object.hasOwn(reportTables,kind)||!id||!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({error:'Invalid report.'},{status:400});
 const{error}=await auth.client.from(reportTables[kind as keyof typeof reportTables]).delete().eq('id',id).eq('user_id',auth.user.id);if(error)return NextResponse.json({error:'Could not delete this report.'},{status:503});revalidatePath('/history');revalidatePath('/dashboard');return NextResponse.json({ok:true});}
