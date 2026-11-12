import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { inputSchema } from '@/lib/ai/schemas';
import { analyze } from '@/lib/ai/client';
export const runtime='nodejs';
export const maxDuration=60;
export async function POST(request:Request,{params}:{params:Promise<{kind:string}>}) {
 const {kind}=await params;
 if(kind!=='resume'&&kind!=='job-match')return NextResponse.json({error:'Unknown analysis tool.'},{status:404});
 const expected=process.env.AI_ACCESS_TOKEN;
 const provided=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';
 const actualBytes=Buffer.from(provided),expectedBytes=Buffer.from(expected||'');
 if(!expected || actualBytes.length!==expectedBytes.length || !timingSafeEqual(actualBytes,expectedBytes))return NextResponse.json({error:'Live AI requires the access token configured by the project owner. Public demo needs no token.'},{status:401});
 if(!process.env.OPENAI_API_KEY || !process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN)return NextResponse.json({error:'Live AI is not configured. Set OpenAI and Upstash credentials; demo remains available.'},{status:503});
 try {
 if(Number(request.headers.get('content-length'))>70000)return NextResponse.json({error:'Request too large.'},{status:413});
 const raw=await request.text(); if(raw.length>70000)return NextResponse.json({error:'Request too large.'},{status:413});
 let json:unknown;try{json=JSON.parse(raw);}catch{return NextResponse.json({error:'Invalid JSON.'},{status:400});}
 const parsed=inputSchema.safeParse(json); if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0].message},{status:400});
 if(kind==='job-match'&&(!parsed.data.jobTitle||!parsed.data.description||parsed.data.description.length<100))return NextResponse.json({error:'Add a job title and at least 100 characters of job description.'},{status:400});
 const limiter=new Ratelimit({redis:Redis.fromEnv(),limiter:Ratelimit.slidingWindow(10,'1 h'),prefix:'careerlens:ai'});
 const limit=await limiter.limit('owner'); if(!limit.success)return NextResponse.json({error:'Hourly AI limit reached. Try again later.'},{status:429});
 return NextResponse.json({data:await analyze(kind,parsed.data),demo:false},{headers:{'Cache-Control':'no-store'}});
 }catch{return NextResponse.json({error:'Analysis could not be completed. The provider may be unavailable or returned an invalid response. Please retry. No sample data was substituted.'},{status:502});}
}
