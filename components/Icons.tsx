// This file resolves a TypeScript compilation error caused by a filename casing conflict
// between 'icons.tsx' and 'Icons.tsx'. By re-exporting from the correct file,
// we ensure module consistency.
export * from './icons';
