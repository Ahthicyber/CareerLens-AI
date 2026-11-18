import 'server-only';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { resumeSchema, matchSchema } from './schemas';
import { basePrompt, prompts } from './prompts';
import { weightedScore } from '../scoring';
import {questionsSchema,feedbackSchema,coverSchema,roadmapSchema,questionInputSchema,feedbackInputSchema,coverInputSchema,roadmapInputSchema,type CareerFeature} from './career-schemas';
import {careerPrompts} from './career-prompts';
import {evaluateInterview,prepareRoadmap} from '../career';
export async function analyze(kind:'resume'|'job-match'|CareerFeature,input:unknown) {
 const client=new OpenAI({
  apiKey:process.env.GROQ_API_KEY,
  baseURL:'https://api.groq.com/openai/v1',
  timeout:45000,
  maxRetries:0,
 });
 const schemas={resume:resumeSchema,'job-match':matchSchema,'interview-questions':questionsSchema,'interview-feedback':feedbackSchema,'cover-letter':coverSchema,roadmap:roadmapSchema};
 const schema=schemas[kind];
 const prompt=kind==='resume'||kind==='job-match'?prompts[kind]:careerPrompts[kind];
 const response=await client.chat.completions.parse({
  model:process.env.GROQ_MODEL||'openai/gpt-oss-120b',
  messages:[
   {role:'system',content:basePrompt+'\n'+prompt},
   {role:'user',content:JSON.stringify({untrustedDocumentData:input})},
  ],
  response_format:zodResponseFormat(schema,'career_report'),
  reasoning_effort:'low',
  max_completion_tokens:kind==='roadmap'?14000:kind==='interview-feedback'?10000:5000,
 });
 const result=schema.parse(response.choices[0]?.message.parsed);
 if(kind==='job-match')return {...matchSchema.parse(result),overall:weightedScore(matchSchema.parse(result).categories)};
 if(kind==='interview-questions'){const setup=questionInputSchema.parse(input);const questions=questionsSchema.parse(result);if(questions.questions.length!==setup.count)throw new Error('Question count did not match.');if(new Set(questions.questions.map(q=>q.question.trim().toLowerCase())).size!==setup.count)throw new Error('Generated questions were duplicated.');return {questions:questions.questions.map((q,i)=>({...q,id:`q${i+1}`}))};}
 if(kind==='interview-feedback')return evaluateInterview(feedbackInputSchema.parse(input).answers,feedbackSchema.parse(result));
 if(kind==='cover-letter'){const data=coverInputSchema.parse(input);return {...coverSchema.parse(result),tone:data.tone,jobTitle:data.jobTitle,company:data.company};}
 if(kind==='roadmap'){const data=roadmapInputSchema.parse(input);return prepareRoadmap(roadmapSchema.parse(result),{role:data.role,hoursPerWeek:data.hoursPerWeek,weeks:data.weeks});}
 return result;
}
