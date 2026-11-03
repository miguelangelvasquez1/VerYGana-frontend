import { z } from 'zod';

import { FORMALIZATION_TEXTS } from '@/lib/labels/formalizationCommitment';

export const REFUSAL_REASON_MAX = 1000;

// El motivo es opcional; el recorte lo hace `confirmRefusal`.
export const refusalReasonSchema = z.object({
  reason: z.string().max(REFUSAL_REASON_MAX, FORMALIZATION_TEXTS.reasonMax),
});

export type RefusalReasonFormValues = z.infer<typeof refusalReasonSchema>;
