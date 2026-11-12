import {beforeEach,describe,it,expect,vi} from 'vitest';
const {parseMock}=vi.hoisted(()=>({parseMock:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('openai',()=>({default:class{responses={parse:parseMock};}}));
import {analyze} from '../lib/ai/client';
import {answers,setup,feedback,cover,roadmapInput,rawRoadmap} from './career-fixtures';
beforeEach(()=>{vi.clearAllMocks();});
describe('structured career AI service',()=>{
 it('validates exact generated question counts and normalizes IDs',async()=>{parseMock.mockResolvedValue({output_parsed:{questions:answers.map(a=>({id:'untrusted',question:a.question,category:a.category}))}});const result=await analyze('interview-questions',{...setup,consent:true});expect(result).toMatchObject({questions:[{id:'q1'},{id:'q2'},{id:'q3'},{id:'q4'},{id:'q5'}]});expect(parseMock.mock.calls[0][0]).toMatchObject({store:false});});
 it('rejects a provider question-count mismatch',async()=>{parseMock.mockResolvedValue({output_parsed:{questions:answers}});await expect(analyze('interview-questions',{...setup,count:10,consent:true})).rejects.toThrow('Question count');});
 it('rejects duplicated generated question text',async()=>{parseMock.mockResolvedValue({output_parsed:{questions:answers.map(a=>({...a,question:'The same question'}))}});await expect(analyze('interview-questions',{...setup,consent:true})).rejects.toThrow('duplicated');});
 it('computes the interview rubric after structured feedback',async()=>{parseMock.mockResolvedValue({output_parsed:feedback});expect(await analyze('interview-feedback',{setup,answers,consent:true})).toMatchObject({overall:71});});
 it('returns cover-letter metadata from the supplied request',async()=>{parseMock.mockResolvedValue({output_parsed:cover});expect(await analyze('cover-letter',{resume:'x'.repeat(100),jobTitle:'Frontend Developer',company:'Example Company',description:'x'.repeat(100),tone:'Friendly',instructions:'',consent:true})).toMatchObject({tone:'Friendly',company:'Example Company'});});
 it('normalizes generated roadmap tasks to a fresh schedule',async()=>{parseMock.mockResolvedValue({output_parsed:rawRoadmap});expect(await analyze('roadmap',roadmapInput)).toMatchObject({weeks:2,milestones:[{week:1,tasks:[{id:'week-1-task-1'},{id:'week-1-task-2'}]},{week:2}]});});
 it('rejects malformed or refused output without returning a sample',async()=>{parseMock.mockResolvedValue({output_parsed:null});await expect(analyze('roadmap',roadmapInput)).rejects.toThrow();});
});
