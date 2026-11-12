import { z } from 'zod';
import { matchSchema,resumeSchema } from './ai/schemas';
import { weightedScore } from './scoring';
import {interviewReportSchema,coverReportSchema,roadmapReportSchema} from './ai/career-schemas';
import {evaluateInterview} from './career';
export const reportTables={resume:'resume_analyses','job-match':'job_matches',interview:'interview_sessions','cover-letter':'cover_letters',roadmap:'career_roadmaps'} as const;
export const saveReportSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('resume'),title:z.string().trim().min(1).max(160),demo:z.boolean(),data:resumeSchema}),
 z.object({kind:z.literal('job-match'),title:z.string().trim().min(1).max(160),demo:z.boolean(),data:matchSchema}),
 z.object({kind:z.literal('interview'),title:z.string().trim().min(1).max(160),demo:z.boolean(),data:interviewReportSchema}),
 z.object({kind:z.literal('cover-letter'),title:z.string().trim().min(1).max(160),demo:z.boolean(),data:coverReportSchema}),
 z.object({kind:z.literal('roadmap'),title:z.string().trim().min(1).max(160),demo:z.boolean(),data:roadmapReportSchema})
]);
export function reportScore(report:z.infer<typeof saveReportSchema>){if(report.kind==='resume')return report.data.overall;if(report.kind==='job-match')return weightedScore(report.data.categories);if(report.kind==='interview')return evaluateInterview(report.data.answers,report.data.evaluation).overall;return null;}
