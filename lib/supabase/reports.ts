import { authenticatedClient } from './server';
import { reportTables } from '../reports';
import type { SavedReport } from '../storage';
export async function loadCloudReports():Promise<{reports:SavedReport[];error:string;unauthorized?:boolean}>{
 const auth=await authenticatedClient();if(!auth)return {reports:[],error:'Sign in to view your reports.',unauthorized:true};
 const [results,resumes]=await Promise.all([
  Promise.all(Object.entries(reportTables).map(async([kind,table])=>{const{data,error}=await auth.client.from(table).select('id,title,report,is_demo,created_at').eq('user_id',auth.user.id).order('created_at',{ascending:false}).limit(100);return {kind,data,error};})),
  auth.client.from('resumes').select('id,title,extracted_text,created_at').eq('user_id',auth.user.id).order('created_at',{ascending:false}).limit(100)
 ]);
 if(results.some(r=>r.error))return {reports:[],error:'Cloud history is unavailable. Check the Supabase migration has been applied.'};
 if(resumes.error)return {reports:[],error:'Saved resumes could not be loaded. Please refresh or check your connection.'};
 const reports:SavedReport[]=results.flatMap(r=>(r.data||[]).map(row=>({id:row.id,kind:r.kind,title:row.title,date:row.created_at,demo:row.is_demo,data:row.report})));
 reports.push(...(resumes.data||[]).map(row=>({id:row.id,kind:'resume-text',title:row.title,date:row.created_at,demo:false,data:{resumeText:row.extracted_text}})));
 return {reports:reports.sort((a,b)=>b.date.localeCompare(a.date)),error:''};
}
