export type SavedReport={id:string;kind:string;title:string;date:string;demo:boolean;data:unknown};
export function savedReports():SavedReport[]{try{return JSON.parse(localStorage.getItem('careerlens-reports')||'[]');}catch{return [];}}
export function download(name:string,data:string,type='text/plain'){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
