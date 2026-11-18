import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { inputSchema } from '@/lib/ai/schemas';
import { analyze } from '@/lib/ai/client';
import { authenticatedClient } from '@/lib/supabase/server';
import { sameOrigin } from '@/lib/auth';
import {careerInputs,type CareerFeature} from '@/lib/ai/career-schemas';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(request:Request,{params}:{params:Promise<{kind:string}>}) {
 const {kind:rawKind}=await params;
 if(rawKind!=='resume'&&rawKind!=='job-match'&&!Object.hasOwn(careerInputs,rawKind))return NextResponse.json({error:'Unknown analysis tool.'},{status:404});
 const kind=rawKind as 'resume'|'job-match'|CareerFeature;
 if(!sameOrigin(request))return NextResponse.json({error:'Invalid request origin.'},{status:403});
 const auth=await authenticatedClient();
 if(!auth)return NextResponse.json({error:'Sign in to use live AI. Public demo needs no account.'},{status:401});
 if(!process.env.GROQ_API_KEY || !process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN)return NextResponse.json({error:'Live AI is not configured. Set Groq and Upstash credentials; demo remains available.'},{status:503});
 try {
 if(Number(request.headers.get('content-length'))>70000)return NextResponse.json({error:'Request too large.'},{status:413});
 const raw=await request.text(); if(raw.length>70000)return NextResponse.json({error:'Request too large.'},{status:413});
 let json:unknown;try{json=JSON.parse(raw);}catch{return NextResponse.json({error:'Invalid JSON.'},{status:400});}
 const schema=kind==='resume'||kind==='job-match'?inputSchema:careerInputs[kind];
 const parsed=schema.safeParse(json); if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0].message},{status:400});
 if(kind==='job-match'){const job=inputSchema.parse(parsed.data);if(!job.jobTitle||!job.description||job.description.length<100)return NextResponse.json({error:'Add a job title and at least 100 characters of job description.'},{status:400});}
 const limiter=new Ratelimit({redis:Redis.fromEnv(),limiter:Ratelimit.slidingWindow(10,'1 h'),prefix:'careerlens:ai'});
 const limit=await limiter.limit(auth.user.id); if(!limit.success)return NextResponse.json({error:'Hourly AI limit reached. Try again later.'},{status:429});
 const usage=await auth.client.from('usage_events').insert({user_id:auth.user.id,feature:kind.startsWith('interview-')?'interview':kind});
 if(usage.error)return NextResponse.json({error:'Usage tracking is unavailable. Apply the database migration before using live AI.'},{status:503});
 return NextResponse.json({data:await analyze(kind,parsed.data),demo:false},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Analysis could not be completed. The provider may be unavailable or returned an invalid response. Please retry. No sample data was substituted.'},{status:502});}
}
