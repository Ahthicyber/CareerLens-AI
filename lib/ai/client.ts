import 'server-only';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { resumeSchema, matchSchema } from './schemas';
import { basePrompt, prompts } from './prompts';
import { weightedScore } from '../scoring';
import {questionsSchema,feedbackSchema,coverSchema,roadmapSchema,questionInputSchema,feedbackInputSchema,coverInputSchema,roadmapInputSchema,type CareerFeature} from './career-schemas';
import {careerPrompts} from './career-prompts';
import {evaluateInterview,prepareRoadmap} from '../career';
export async function analyze(kind:'resume'|'job-match'|CareerFeature,input:unknown) {
 const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY,timeout:45000,maxRetries:1});
 const schemas={resume:resumeSchema,'job-match':matchSchema,'interview-questions':questionsSchema,'interview-feedback':feedbackSchema,'cover-letter':coverSchema,roadmap:roadmapSchema};
 const schema=schemas[kind];
 const prompt=kind==='resume'||kind==='job-match'?prompts[kind]:careerPrompts[kind];
 const response=await client.responses.parse({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',store:false,input:[{role:'system',content:basePrompt+'\n'+prompt},{role:'user',content:JSON.stringify({untrustedDocumentData:input})}],text:{format:zodTextFormat(schema,'career_report')},max_output_tokens:kind==='roadmap'?14000:kind==='interview-feedback'?10000:5000},{signal:AbortSignal.timeout(50000)});
 const result=schema.parse(response.output_parsed);
 if(kind==='job-match')return {...matchSchema.parse(result),overall:weightedScore(matchSchema.parse(result).categories)};
 if(kind==='interview-questions'){const setup=questionInputSchema.parse(input);const questions=questionsSchema.parse(result);if(questions.questions.length!==setup.count)throw new Error('Question count did not match.');if(new Set(questions.questions.map(q=>q.question.trim().toLowerCase())).size!==setup.count)throw new Error('Generated questions were duplicated.');return {questions:questions.questions.map((q,i)=>({...q,id:`q${i+1}`}))};}
 if(kind==='interview-feedback')return evaluateInterview(feedbackInputSchema.parse(input).answers,feedbackSchema.parse(result));
 if(kind==='cover-letter'){const data=coverInputSchema.parse(input);return {...coverSchema.parse(result),tone:data.tone,jobTitle:data.jobTitle,company:data.company};}
 if(kind==='roadmap'){const data=roadmapInputSchema.parse(input);return prepareRoadmap(roadmapSchema.parse(result),{role:data.role,hoursPerWeek:data.hoursPerWeek,weeks:data.weeks});}
 return result;
}
