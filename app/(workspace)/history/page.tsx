import CloudHistory from '@/components/cloud-history';
import { loadCloudReports } from '@/lib/supabase/reports';
import {createHash} from 'node:crypto';
export default async function Page(){const result=await loadCloudReports();const revision=createHash('sha256').update(JSON.stringify([result.error,result.reports])).digest('hex');return <CloudHistory key={revision} initialReports={result.reports} initialError={result.error}/>;}
