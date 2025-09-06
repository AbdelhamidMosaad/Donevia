
import { atom } from 'jotai';
import type { Notebook, Section, Page } from './types';

export const selectedNotebookAtom = atom<Notebook | null>(null);
export const selectedSectionAtom = atom<Section | null>(null);
export const selectedPageAtom = atom<Page | null>(null);
