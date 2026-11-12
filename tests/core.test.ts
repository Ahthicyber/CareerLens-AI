import {describe,it,expect} from 'vitest';
import {inputSchema,resumeSchema,matchSchema} from '../lib/ai/schemas';
import {weightedScore} from '../lib/scoring';
import {validatePdf,MAX_FILE_SIZE} from '../lib/validation';
import {demoResume,demoMatch,sampleResume} from '../lib/demo';
describe('resume validation',()=>{
 it('requires substantial text and explicit consent',()=>{expect(inputSchema.safeParse({resume:'short',consent:true}).success).toBe(false);expect(inputSchema.safeParse({resume:sampleResume,consent:false}).success).toBe(false);expect(inputSchema.safeParse({resume:sampleResume,consent:true}).success).toBe(true);});
 it('rejects oversized document text',()=>expect(inputSchema.safeParse({resume:'x'.repeat(24001),consent:true}).success).toBe(false));
});
describe('PDF validation',()=>{
 it('accepts a valid PDF descriptor',()=>expect(()=>validatePdf({name:'resume.PDF',size:1000,type:'application/pdf'})).not.toThrow());
 it('rejects empty, oversized and disguised files',()=>{for(const file of [{name:'resume.pdf',size:0,type:'application/pdf'},{name:'resume.pdf',size:MAX_FILE_SIZE+1,type:'application/pdf'},{name:'resume.exe',size:100,type:'application/pdf'},{name:'resume.pdf',size:100,type:'image/png'}])expect(()=>validatePdf(file)).toThrow();});
});
describe('weighted match rubric',()=>{
 const all=()=>structuredClone(demoMatch.categories);
 it('applies the documented weights',()=>expect(weightedScore(all())).toBe(79));
 it('renormalizes inapplicable categories',()=>{const c=all();c.preferred.applicable=false;expect(weightedScore(c)).toBe(86);});
 it('returns zero if no categories apply',()=>{const c=all();Object.values(c).forEach(v=>v.applicable=false);expect(weightedScore(c)).toBe(0);});
 it('keeps missing evidence as a scored gap',()=>{const c=all();c.required.score=0;expect(weightedScore(c)).toBe(43);});
});
describe('AI output validation and deterministic demo',()=>{
 it('validates sample reports',()=>{expect(resumeSchema.safeParse(demoResume).success).toBe(true);expect(matchSchema.safeParse(demoMatch).success).toBe(true);expect(weightedScore(demoMatch.categories)).toBe(demoMatch.overall);});
 it('rejects malformed and out-of-range outputs',()=>{expect(resumeSchema.safeParse({...demoResume,overall:101}).success).toBe(false);expect(matchSchema.safeParse({summary:'incomplete'}).success).toBe(false);});
});
