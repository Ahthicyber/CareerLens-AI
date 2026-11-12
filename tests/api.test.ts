import {beforeEach,describe,it,expect,vi} from 'vitest';
vi.mock('@upstash/redis',()=>({Redis:{fromEnv:()=>({})}}));
const {limit,analyzeMock}=vi.hoisted(()=>({limit:vi.fn(),analyzeMock:vi.fn()}));
vi.mock('@upstash/ratelimit',()=>({Ratelimit:class{static slidingWindow(){return{};}limit=limit;}}));
vi.mock('../lib/ai/client',()=>({analyze:analyzeMock}));
import {POST} from '../app/api/analyze/[kind]/route';
import {POST as extract} from '../app/api/extract/route';
import {sampleResume,demoResume} from '../lib/demo';
const call=(body:unknown={},token='test-secret',kind='resume')=>POST(new Request('http://localhost/api/analyze/'+kind,{method:'POST',headers:{authorization:'Bearer '+token},body:JSON.stringify(body)}),{params:Promise.resolve({kind})});
beforeEach(()=>{vi.stubEnv('AI_ACCESS_TOKEN','test-secret');vi.stubEnv('OPENAI_API_KEY','test');vi.stubEnv('UPSTASH_REDIS_REST_URL','https://example.invalid');vi.stubEnv('UPSTASH_REDIS_REST_TOKEN','test');limit.mockResolvedValue({success:true});analyzeMock.mockResolvedValue(demoResume);});
describe('live endpoint gate and errors',()=>{
 it('rejects unauthorized requests',async()=>expect((await call({},'wrong')).status).toBe(401));
 it('rejects non-ASCII invalid tokens without a server error',async()=>expect((await call({},'ééééééééééé')).status).toBe(401));
 it('fails closed when not configured',async()=>{vi.stubEnv('OPENAI_API_KEY','');expect((await call()).status).toBe(503);});
 it('rejects unsupported tools',async()=>expect((await call({},'test-secret','unknown')).status).toBe(404));
 it('validates input before provider requests',async()=>expect((await call({resume:'short',consent:true})).status).toBe(400));
 it('enforces persistent usage limits',async()=>{limit.mockResolvedValue({success:false});expect((await call({resume:sampleResume,consent:true})).status).toBe(429);});
 it('returns provider failures without replacing them with demo data',async()=>{analyzeMock.mockRejectedValue(new Error('provider failure'));const r=await call({resume:sampleResume,consent:true});expect(r.status).toBe(502);expect((await r.json()).data).toBeUndefined();});
 it('returns validated live results from service',async()=>{const r=await call({resume:sampleResume,consent:true});expect(r.status).toBe(200);expect((await r.json()).demo).toBe(false);});
});
describe('extraction errors',()=>{
 it('rejects missing file',async()=>{const r=await extract(new Request('http://localhost/api/extract',{method:'POST',body:new FormData()}));expect(r.status).toBe(400);});
 it('rejects fake PDF bytes',async()=>{const body=new FormData();body.set('file',new File(['not a pdf'],'resume.pdf',{type:'application/pdf'}));const r=await extract(new Request('http://localhost/api/extract',{method:'POST',body}));expect(r.status).toBe(400);expect((await r.json()).error).toContain('valid PDF');});
});
