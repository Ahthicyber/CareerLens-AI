import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:{default:'CareerLens AI — Your next chapter',template:'%s | CareerLens AI'},description:'Your next career move, powered by AI. Resume insights and evidence-based job matching.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;}
