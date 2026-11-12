import { NextResponse } from 'next/server';
import { validatePdf } from '@/lib/validation';
export const runtime='nodejs';
export const maxDuration=30;
export async function POST(request:Request){
 try{
 if(Number(request.headers.get('content-length'))>5*1024*1024+20000)return NextResponse.json({error:'Choose a PDF smaller than 5 MB.'},{status:413});
 const form=await request.formData();const file=form.get('file');
 if(!(file instanceof File))return NextResponse.json({error:'Choose a PDF file.'},{status:400});
 validatePdf(file);const bytes=Buffer.from(await file.arrayBuffer());
 if(bytes.subarray(0,5).toString()!=='%PDF-')throw new Error('This file is not a valid PDF.');
 const {PDFParse}=await import('pdf-parse');const parser=new PDFParse({data:bytes});
 try{const result=await parser.getText(); if(result.total>25)throw new Error('Use a resume of 25 pages or fewer.');if(result.text.trim().length<100)throw new Error('This PDF has too little readable text. Image-only PDFs need OCR; paste your resume text instead.');if(result.text.length>24000)throw new Error('Resume text exceeds 24,000 characters. Paste a shorter version.');return NextResponse.json({text:result.text},{headers:{'Cache-Control':'no-store'}});}finally{await parser.destroy();}
 }catch(error){const message=error instanceof Error?error.message:'';return NextResponse.json({error:/5 MB|Only PDF|empty|valid PDF|25 pages|readable text|24,000/.test(message)?message:'Unable to read this PDF. It may be corrupted or encrypted. Try an unencrypted text PDF, or paste the text.'},{status:400});}
}
