import {beforeEach,describe,it,expect,vi} from 'vitest';
vi.mock('@upstash/redis',()=>({Redis:{fromEnv:()=>({})}}));
const {limit,analyzeMock,authMock,insertMock}=vi.hoisted(()=>({limit:vi.fn(),analyzeMock:vi.fn(),authMock:vi.fn(),insertMock:vi.fn()}));
vi.mock('../lib/supabase/server',()=>({authenticatedClient:authMock}));
vi.mock('@upstash/ratelimit',()=>({Ratelimit:class{static slidingWindow(){return{};}limit=limit;}}));
vi.mock('../lib/ai/client',()=>({analyze:analyzeMock}));
import {POST} from '../app/api/analyze/[kind]/route';
import {POST as extract} from '../app/api/extract/route';
import {sampleResume,demoResume} from '../lib/demo';
import {setup,answers,roadmapInput} from './career-fixtures';
const call=(body:unknown={},token='test-secret',kind='resume')=>POST(new Request('http://localhost/api/analyze/'+kind,{method:'POST',headers:{authorization:'Bearer '+token},body:JSON.stringify(body)}),{params:Promise.resolve({kind})});
beforeEach(()=>{vi.clearAllMocks();insertMock.mockResolvedValue({error:null});authMock.mockResolvedValue({user:{id:'user-a'},client:{from:()=>({insert:insertMock})}});vi.stubEnv('AI_ACCESS_TOKEN','test-secret');vi.stubEnv('OPENAI_API_KEY','test');vi.stubEnv('UPSTASH_REDIS_REST_URL','https://example.invalid');vi.stubEnv('UPSTASH_REDIS_REST_TOKEN','test');limit.mockResolvedValue({success:true});analyzeMock.mockResolvedValue(demoResume);});
describe('live endpoint gate and errors',()=>{
 it('routes the three new tools through shared verified-user quota and usage tracking',async()=>{for(const [kind,input,usageFeature] of [['interview-questions',{...setup,consent:true},'interview'],['interview-feedback',{setup,answers,consent:true},'interview'],['cover-letter',{resume:sampleResume,jobTitle:'Frontend Developer',company:'Example',description:'x'.repeat(100),tone:'Professional',instructions:'',consent:true},'cover-letter'],['roadmap',roadmapInput,'roadmap']] as const){const response=await call(input,'',kind);expect(response.status).toBe(200);expect(analyzeMock).toHaveBeenCalledWith(kind,input);expect(insertMock).toHaveBeenCalledWith({user_id:'user-a',feature:usageFeature});}});
 it('rejects unauthenticated requests',async()=>{authMock.mockResolvedValue(null);expect((await call()).status).toBe(401);});
 it('rejects cross-origin requests',async()=>{const response=await POST(new Request('http://localhost/api/analyze/resume',{method:'POST',headers:{origin:'https://evil.invalid'},body:'{}'}),{params:Promise.resolve({kind:'resume'})});expect(response.status).toBe(403);});
 it('fails closed when not configured',async()=>{vi.stubEnv('OPENAI_API_KEY','');expect((await call()).status).toBe(503);});
 it('rejects unsupported tools',async()=>expect((await call({},'test-secret','unknown')).status).toBe(404));
 it('validates input before provider requests',async()=>expect((await call({resume:'short',consent:true})).status).toBe(400));
 it('enforces persistent usage limits',async()=>{limit.mockResolvedValue({success:false});expect((await call({resume:sampleResume,consent:true})).status).toBe(429);});
 it('returns provider failures without replacing them with demo data',async()=>{analyzeMock.mockRejectedValue(new Error('provider failure'));const r=await call({resume:sampleResume,consent:true});expect(r.status).toBe(502);expect((await r.json()).data).toBeUndefined();});
 it('fails closed if usage tracking fails',async()=>{insertMock.mockResolvedValue({error:{message:'not installed'}});const r=await call({resume:sampleResume,consent:true});expect(r.status).toBe(503);expect(analyzeMock).not.toHaveBeenCalled();});
 it('returns validated live results from service',async()=>{const r=await call({resume:sampleResume,consent:true});expect(r.status).toBe(200);expect((await r.json()).demo).toBe(false);expect(limit).toHaveBeenCalledWith('user-a');expect(insertMock).toHaveBeenCalledWith({user_id:'user-a',feature:'resume'});});
});
describe('extraction errors',()=>{
 it('rejects missing file',async()=>{const r=await extract(new Request('http://localhost/api/extract',{method:'POST',body:new FormData()}));expect(r.status).toBe(400);});
 it('rejects fake PDF bytes',async()=>{const body=new FormData();body.set('file',new File(['not a pdf'],'resume.pdf',{type:'application/pdf'}));const r=await extract(new Request('http://localhost/api/extract',{method:'POST',body}));expect(r.status).toBe(400);expect((await r.json()).error).toContain('valid PDF');});
});
