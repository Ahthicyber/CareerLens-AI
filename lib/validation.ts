export const MAX_FILE_SIZE=5*1024*1024;
export function validatePdf(file:{name:string;size:number;type:string}) { if(file.size===0)throw new Error('The PDF is empty.'); if(file.size>MAX_FILE_SIZE)throw new Error('Choose a PDF smaller than 5 MB.'); if(!file.name.toLowerCase().endsWith('.pdf') || (file.type && file.type!=='application/pdf'))throw new Error('Only PDF resumes are supported.'); }
