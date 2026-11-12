import { categories, matchSchema } from './ai/schemas';
import type { z } from 'zod';
export const weights = {required:40,experience:25,preferred:15,education:10,alignment:10};
export function weightedScore(input:z.infer<typeof matchSchema>['categories']) { let total=0,weight=0; for(const key of categories) { if(input[key].applicable){total+=input[key].score*weights[key];weight+=weights[key];} } return weight ? Math.round(total/weight) : 0; }
