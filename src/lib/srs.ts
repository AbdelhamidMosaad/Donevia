
'use client';
import dayjs from 'dayjs';
import type { FlashcardProgress } from './types';

export function initProgress(): FlashcardProgress {
  return {
    repetitions: 0,
    efactor: 2.5,
    intervalDays: 0,
    dueDate: dayjs().toISOString(),
    lastReviewedAt: null,
  };
}

/**
 * Compute next SM-2 progress given previous progress and the user quality (0-5).
 * Returns new progress object { repetitions, efactor, intervalDays, dueDate, lastReviewedAt }
 */
export function sm2Next(progress: Partial<FlashcardProgress> | undefined, quality: number): FlashcardProgress {
  let { repetitions = 0, efactor = 2.5, intervalDays = 0 } = progress || {};

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      intervalDays = 1;
    } else if (repetitions === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * efactor);
    }

    efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (efactor < 1.3) {
      efactor = 1.3;
    }
  }

  const dueDate = dayjs().add(intervalDays, 'day').toISOString();
  return { repetitions, efactor, intervalDays, dueDate, lastReviewedAt: dayjs().toISOString() };
}
