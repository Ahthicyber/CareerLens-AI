vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
import {describe,it,expect,vi,beforeEach} from 'vitest';
import {safeNext,sameOrigin} from '../lib/auth';
const {authMock,fromMock,queryMock,rpcMock}=vi.hoisted(()=>({authMock:vi.fn(),fromMock:vi.fn(),queryMock:{select:vi.fn(),eq:vi.fn(),order:vi.fn(),limit:vi.fn(),insert:vi.fn(),single:vi.fn(),delete:vi.fn()},rpcMock:vi.fn()}));
vi.mock('../lib/supabase/server',()=>({authenticatedClient:authMock}));
import {GET,POST,DELETE} from '../app/api/reports/route';
import {DELETE as deleteAccount} from '../app/api/account/route';
import {demoResume,demoMatch} from '../lib/demo';
import {saveReportSchema,reportScore} from '../lib/reports';
import {revalidatePath} from 'next/cache';
import {interview,roadmap,cover} from './career-fixtures';
import {PATCH as updateRoadmap} from '../app/api/roadmaps/[id]/route';
beforeEach(()=>{vi.clearAllMocks();fromMock.mockReturnValue(queryMock);Object.values(queryMock).forEach(fn=>fn.mockReturnValue(queryMock));queryMock.limit.mockResolvedValue({data:[],error:null});queryMock.single.mockResolvedValue({data:{id:'report-a'},error:null});queryMock.eq.mockReturnValue(queryMock);authMock.mockResolvedValue({user:{id:'user-a'},client:{from:fromMock,rpc:rpcMock,auth:{signOut:vi.fn()}}});rpcMock.mockResolvedValue({error:null});});
describe('safe navigation',()=>{it('allows only internal redirects',()=>{for(const value of ['https://evil.invalid','//evil.invalid','/\\evil.invalid','/path\nLocation: evil','/\t/evil.invalid'])expect(safeNext(value)).toBe('/dashboard');expect(safeNext('/history')).toBe('/history');});it('blocks foreign request origins',()=>expect(sameOrigin(new Request('https://app.example/api/reports',{headers:{origin:'https://evil.invalid'}}))).toBe(false));});
describe('report authorization',()=>{
 it('saves interview and roadmap children through atomic RPCs',async()=>{rpcMock.mockResolvedValue({data:'artifact-id',error:null});for(const[kind,data]of [['interview',interview],['roadmap',roadmap]]){const response=await POST(new Request('http://localhost/api/reports',{method:'POST',body:JSON.stringify({kind,title:'Career artifact',demo:false,data})}));expect(response.status).toBe(201);expect((await response.json()).id).toBe('artifact-id');expect(rpcMock).toHaveBeenCalledWith('save_career_artifact',expect.objectContaining({p_kind:kind}));}});
 it('stores editable cover text without a nonexistent score column',async()=>{const response=await POST(new Request('http://localhost/api/reports',{method:'POST',body:JSON.stringify({kind:'cover-letter',title:'Letter',demo:false,data:cover})}));expect(response.status).toBe(201);expect(queryMock.insert).toHaveBeenCalledWith(expect.objectContaining({content:cover.letter}));expect(queryMock.insert.mock.calls[0][0]).not.toHaveProperty('score');});
 it('loads saved resume text alongside reports in date order',async()=>{
  queryMock.limit.mockResolvedValueOnce({data:[{id:'report-1',title:'Resume report',created_at:'2026-11-12T10:00:00Z',is_demo:true,report:demoResume}],error:null});
  for(let i=0;i<4;i++)queryMock.limit.mockResolvedValueOnce({data:[],error:null});
  queryMock.limit.mockResolvedValueOnce({data:[{id:'resume-1',title:'My saved resume',created_at:'2026-11-12T11:00:00Z',extracted_text:'My resume text'}],error:null});
  const response=await GET();const body=await response.json();
  expect(response.status).toBe(200);expect(body.reports).toHaveLength(2);
  expect(body.reports[0]).toMatchObject({id:'resume-1',kind:'resume-text',data:{resumeText:'My resume text'}});
  expect(body.reports[1]).toMatchObject({id:'report-1',kind:'resume',demo:true});
 });
 it('invalidates history and dashboard after a successful report save',async()=>{
  const response=await POST(new Request('http://localhost/api/reports',{method:'POST',body:JSON.stringify({kind:'resume',title:'Saved report',demo:true,data:demoResume})}));
  expect(response.status).toBe(201);expect(revalidatePath).toHaveBeenCalledWith('/history');expect(revalidatePath).toHaveBeenCalledWith('/dashboard');
 });
 it('requires authentication for reading, writing and deleting',async()=>{authMock.mockResolvedValue(null);expect((await GET()).status).toBe(401);expect((await POST(new Request('http://localhost/api/reports',{method:'POST',body:'{}'}))).status).toBe(401);expect((await DELETE(new Request('http://localhost/api/reports',{method:'DELETE'}))).status).toBe(401);expect(fromMock).not.toHaveBeenCalled();});
 it('scopes every history query to authenticated ownership',async()=>{const response=await GET();expect(response.status).toBe(200);expect(queryMock.eq.mock.calls).toEqual(Array(6).fill(['user_id','user-a']));});
 it('ignores supplied ownership and writes the verified user',async()=>{const response=await POST(new Request('http://localhost/api/reports',{method:'POST',body:JSON.stringify({kind:'resume',title:'My resume',demo:false,data:demoResume,user_id:'victim'})}));expect(response.status).toBe(201);expect(queryMock.insert).toHaveBeenCalledWith(expect.objectContaining({user_id:'user-a'}));});
 it('rejects invalid report data before writing',async()=>{const response=await POST(new Request('http://localhost/api/reports',{method:'POST',body:JSON.stringify({kind:'resume',title:'Broken',demo:false,data:{}})}));expect(response.status).toBe(400);expect(queryMock.insert).not.toHaveBeenCalled();});
 it('scopes deletion by both report id and caller',async()=>{await DELETE(new Request('http://localhost/api/reports?kind=resume&id=00000000-0000-4000-8000-000000000001',{method:'DELETE'}));expect(queryMock.eq).toHaveBeenCalledWith('user_id','user-a');expect(queryMock.eq).toHaveBeenCalledWith('id','00000000-0000-4000-8000-000000000001');});
 it('reports unapplied migration errors',async()=>{queryMock.limit.mockResolvedValue({error:{message:'missing table'}});expect((await GET()).status).toBe(503);});
 it('recalculates saved match scores instead of trusting a client overall score',()=>{const parsed=saveReportSchema.parse({kind:'job-match',title:'Match',demo:false,data:{...demoMatch,overall:100}});expect(reportScore(parsed)).toBe(79);});
});
describe('roadmap updates',()=>{
 const url='http://localhost/api/roadmaps/00000000-0000-4000-8000-000000000009';
 const params={params:Promise.resolve({id:'00000000-0000-4000-8000-000000000009'})};
 it('requires a verified session',async()=>{authMock.mockResolvedValue(null);expect((await updateRoadmap(new Request(url,{method:'PATCH',body:'{}'}),params)).status).toBe(401);expect(rpcMock).not.toHaveBeenCalled();});
 it('validates input before calling the ownership-enforced RPC',async()=>{const response=await updateRoadmap(new Request(url,{method:'PATCH',body:JSON.stringify({taskId:'week-1-task-1',completed:true})}),params);expect(response.status).toBe(200);expect(rpcMock).toHaveBeenCalledWith('set_roadmap_task_completed',{p_roadmap_id:'00000000-0000-4000-8000-000000000009',p_task_key:'week-1-task-1',p_completed:true});});
 it('keeps invalid task updates out of the database',async()=>{const response=await updateRoadmap(new Request(url,{method:'PATCH',body:JSON.stringify({taskId:'',completed:'true'})}),params);expect(response.status).toBe(400);expect(rpcMock).not.toHaveBeenCalled();});
});
describe('account deletion',()=>{
 it('requires explicit confirmation',async()=>{const r=await deleteAccount(new Request('http://localhost/api/account',{method:'DELETE',body:JSON.stringify({confirmation:'yes'})}));expect(r.status).toBe(400);expect(rpcMock).not.toHaveBeenCalled();});
 it('calls a self-only RPC without accepting a target user',async()=>{const r=await deleteAccount(new Request('http://localhost/api/account',{method:'DELETE',body:JSON.stringify({confirmation:'DELETE',user_id:'victim'})}));expect(r.status).toBe(200);expect(rpcMock).toHaveBeenCalledWith('delete_own_account');});
});
