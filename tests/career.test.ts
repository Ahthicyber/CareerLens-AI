import {describe,it,expect} from 'vitest';
import {answers,feedback,setup,roadmap,rawRoadmap,roadmapInput,cover,interview} from './career-fixtures';
import {evaluateInterview,prepareRoadmap,roadmapProgress} from '../lib/career';
import {questionInputSchema,feedbackInputSchema,coverInputSchema,roadmapInputSchema,roadmapReportSchema} from '../lib/ai/career-schemas';
import {saveReportSchema,reportScore} from '../lib/reports';
describe('interview rubric and validation',()=>{
 it('weights component scores and computes the session average deterministically',()=>{const result=evaluateInterview(answers,feedback);expect(result.overall).toBe(71);expect(result.feedback[0].overall).toBe(71);});
 it('scores blank answers zero even when the provider scores them positively',()=>{const result=evaluateInterview(answers.map((a,i)=>i===0?{...a,answer:'  '}:a),feedback);expect(result.feedback[0].overall).toBe(0);expect(result.overall).toBe(57);});
 it('rejects duplicate, omitted and unknown question feedback',()=>{for(const data of [{...feedback,feedback:feedback.feedback.slice(1)},{...feedback,feedback:feedback.feedback.map(f=>({...f,questionId:'q1'}))},{...feedback,feedback:feedback.feedback.map((f,i)=>i===0?{...f,questionId:'other'}:f)}])expect(()=>evaluateInterview(answers,data)).toThrow();});
 it('requires consent, valid counts and matching unique answers',()=>{expect(questionInputSchema.safeParse({...setup,count:7,consent:true}).success).toBe(false);expect(questionInputSchema.safeParse({...setup,consent:false}).success).toBe(false);expect(feedbackInputSchema.safeParse({setup,answers:answers.slice(1),consent:true}).success).toBe(false);expect(feedbackInputSchema.safeParse({setup,answers,consent:true}).success).toBe(true);});
 it('recomputes a saved score instead of trusting a client overall value',()=>{const item=saveReportSchema.parse({kind:'interview',title:'Practice',demo:false,data:{...interview,evaluation:{...interview.evaluation,overall:100}}});expect(reportScore(item)).toBe(71);});
});
describe('roadmap constraints and progress',()=>{
 it('requires realistic study limits and consent',()=>{expect(roadmapInputSchema.safeParse({...roadmapInput,hoursPerWeek:0}).success).toBe(false);expect(roadmapInputSchema.safeParse({...roadmapInput,weeks:25}).success).toBe(false);});
 it('rejects the wrong number of weeks and over-budget milestones',()=>{expect(()=>prepareRoadmap(rawRoadmap,{role:'Frontend Developer',hoursPerWeek:5,weeks:3})).toThrow();expect(()=>prepareRoadmap(rawRoadmap,{role:'Frontend Developer',hoursPerWeek:2,weeks:2})).toThrow();});
 it('assigns deterministic unique task keys and resets provider completion claims',()=>{const result=prepareRoadmap({...rawRoadmap,milestones:rawRoadmap.milestones.map(m=>({...m,tasks:m.tasks.map(t=>({...t,id:'duplicate',completed:true}))}))},{role:'Frontend Developer',hoursPerWeek:5,weeks:2});expect(result.milestones[0].tasks[0]).toMatchObject({id:'week-1-task-1',completed:false});expect(roadmapReportSchema.safeParse(result).success).toBe(true);});
 it('calculates progress from task completion',()=>{expect(roadmapProgress(roadmap).percent).toBe(0);const copy=structuredClone(roadmap);copy.milestones[0].tasks[0].completed=true;expect(roadmapProgress(copy)).toEqual({completed:1,total:4,percent:25});});
});
describe('cover letter input and saving',()=>{
 it('requires real supplied content and consent',()=>{expect(coverInputSchema.safeParse({resume:'too short',consent:true}).success).toBe(false);expect(saveReportSchema.safeParse({kind:'cover-letter',title:'My letter',demo:false,data:cover}).success).toBe(true);});
 it('does not invent a score for cover letters or roadmaps',()=>{for(const [kind,data] of [['cover-letter',cover],['roadmap',roadmap]])expect(reportScore(saveReportSchema.parse({kind,title:'Saved item',demo:false,data}))).toBeNull();});
});
