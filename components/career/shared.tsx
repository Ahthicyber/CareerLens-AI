'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {Button} from '../ui/button';
import {download} from '@/lib/storage';
export async function careerRequest(kind:string,input:unknown){const response=await fetch(`/api/analyze/${kind}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});const body=await response.json();if(!response.ok)throw new Error(body.error||'The request could not be completed.');return body.data;}
export function Consent({checked,onChange}:{checked:boolean;onChange:(value:boolean)=>void}){return <label className="checkbox-label"><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/>I consent to sending these inputs to OpenAI for career guidance. <Link href="/privacy" target="_blank">Privacy notice</Link></label>;}
export function Message({error,status}:{error?:string;status?:string}){return <>{error&&<div className="error" role="alert">{error}</div>}{status&&<div className="notice" role="status">{status}</div>}</>;}
export function ReportActions({kind,title,data,onSaved,text}:{kind:'interview'|'cover-letter'|'roadmap';title:string;data:unknown;onSaved?:(id:string)=>void;text?:string}){const router=useRouter();const[busy,setBusy]=useState(false);const[status,setStatus]=useState('');const[error,setError]=useState('');
 async function save(){setBusy(true);setError('');setStatus('');try{const response=await fetch('/api/reports',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,title:title.slice(0,160),demo:false,data})});const body=await response.json();if(!response.ok)throw new Error(body.error);setStatus('Saved to your account. Open History to revisit it.');onSaved?.(body.id);router.refresh();}catch(e){setError(e instanceof Error?e.message:'Could not save this report.');}finally{setBusy(false);}}
 return <><div className="action-row"><Button disabled={busy} onClick={()=>void save()}>{busy?'Saving…':'Save to account'}</Button><Button variant="outline" onClick={()=>download(`careerlens-${kind}.json`,JSON.stringify(data,null,2),'application/json')}>Export JSON</Button>{text&&<Button variant="outline" onClick={()=>download('careerlens-cover-letter.txt',text)}>Download text</Button>}<Button variant="outline" onClick={()=>window.print()}>Print / PDF</Button><Link className="text-link" href="/history">View History</Link></div><Message error={error} status={status}/></>;
}
