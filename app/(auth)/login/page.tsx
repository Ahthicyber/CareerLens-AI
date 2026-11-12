import AuthForm from '@/components/auth-form';
export default async function Page({searchParams}:{searchParams:Promise<{next?:string;message?:string}>}){const query=await searchParams;return <AuthForm mode="login" next={query.next} initialMessage={query.message}/>;}
