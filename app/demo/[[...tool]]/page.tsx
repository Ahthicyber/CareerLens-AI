import { notFound } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard-shell';
import Overview from '@/components/overview';
import Analyzer from '@/components/analyzer';
import PhasePreview from '@/components/phase-preview';
import History from '@/components/history';
import Settings from '@/components/account-settings';
export default async function Page({params}:{params:Promise<{tool?:string[]}>}){const {tool}=await params;if(tool&&tool.length>1)notFound();const page=tool?.[0]||'dashboard';let content:React.ReactNode;
 if(page==='dashboard')content=<Overview/>;
 else if(page==='resume'||page==='job-match')content=<Analyzer kind={page}/>;
 else if(page==='interview'||page==='cover-letter'||page==='roadmap')content=<PhasePreview kind={page}/>;
 else if(page==='history')content=<History/>;
 else if(page==='settings')content=<Settings/>;
 else notFound();
 return <DashboardShell user={null} demo>{content}</DashboardShell>;
}
