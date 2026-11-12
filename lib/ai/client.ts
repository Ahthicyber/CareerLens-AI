import 'server-only';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { resumeSchema, matchSchema } from './schemas';
import { basePrompt, prompts } from './prompts';
import { weightedScore } from '../scoring';
export async function analyze(kind:'resume'|'job-match',input:unknown) {
 const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY,timeout:45000,maxRetries:1});
 const schema=kind==='resume'?resumeSchema:matchSchema;
 const response=await client.responses.parse({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',store:false,input:[{role:'system',content:basePrompt+'\n'+prompts[kind]},{role:'user',content:JSON.stringify({untrustedDocumentData:input})}],text:{format:zodTextFormat(schema,'career_report')},max_output_tokens:5000});
 const result=schema.parse(response.output_parsed);
 return kind==='job-match'?{...matchSchema.parse(result),overall:weightedScore(matchSchema.parse(result).categories)}:result;
}
