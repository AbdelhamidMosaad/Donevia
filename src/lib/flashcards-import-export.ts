
'use client';

import type { Deck, FlashcardToolCard } from '@/lib/types';

export function exportDeckToJSON(deck: Deck, cards: FlashcardToolCard[]): string {
  // We don't export timestamps to avoid issues on import
  const exportableDeck = { name: deck.name, description: deck.description };
  const exportableCards = cards.map(({ front, back }) => ({ front, back }));
  return JSON.stringify({ deck: exportableDeck, cards: exportableCards }, null, 2);
}

export function importDeckFromJSON(jsonStr: string): { deck: Partial<Deck>, cards: Partial<FlashcardToolCard>[] } | null {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed.deck || !parsed.cards || !Array.isArray(parsed.cards)) {
      throw new Error("Invalid format: 'deck' and 'cards' array are required.");
    }
    return parsed;
  } catch (e) {
    console.error("Failed to parse JSON:", e);
    return null;
  }
}
