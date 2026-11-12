'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <div className="card empty"><h2>Something interrupted this step.</h2><p>Please try loading the workspace again.</p><button className="button primary" onClick={reset}>Try again</button></div>;}
