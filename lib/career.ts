import type {z} from 'zod';
import {feedbackSchema,roadmapSchema,roadmapReportSchema,type InterviewAnswer,type InterviewEvaluation} from './ai/career-schemas';
export function evaluateInterview(answers:InterviewAnswer[],evaluation:z.infer<typeof feedbackSchema>):InterviewEvaluation{
 if(evaluation.feedback.length!==answers.length||new Set(evaluation.feedback.map(f=>f.questionId)).size!==answers.length||evaluation.feedback.some(f=>!answers.some(a=>a.id===f.questionId)))throw new Error('Interview feedback did not match the questions.');
 const feedback=answers.map(answer=>{const item=evaluation.feedback.find(f=>f.questionId===answer.id)!;const normalized=answer.answer.trim()?item:{...item,accuracy:0,clarity:0,completeness:0,feedback:'No answer was submitted. Review the example and practice this question.'};return {...normalized,overall:Math.round(normalized.accuracy*.4+normalized.clarity*.3+normalized.completeness*.3)};});
 return {...evaluation,feedback,overall:Math.round(feedback.reduce((n,f)=>n+f.overall,0)/feedback.length)};
}
export function prepareRoadmap(data:z.infer<typeof roadmapSchema>,input:{role:string;hoursPerWeek:number;weeks:number}){
 if(data.milestones.length!==input.weeks||data.milestones.some(m=>m.hours>input.hoursPerWeek))throw new Error('The generated roadmap does not fit the requested time budget.');
 return roadmapReportSchema.parse({...data,...input,milestones:data.milestones.map((m,i)=>({...m,week:i+1,tasks:m.tasks.map((t,j)=>({...t,id:`week-${i+1}-task-${j+1}`,completed:false}))}))});
}
export function roadmapProgress(roadmap:{milestones:{tasks:{completed:boolean}[]}[]}){const tasks=roadmap.milestones.flatMap(m=>m.tasks);return {completed:tasks.filter(t=>t.completed).length,total:tasks.length,percent:tasks.length?Math.round(tasks.filter(t=>t.completed).length/tasks.length*100):0};}
