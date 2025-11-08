// This file is intentionally left blank to resolve a build-time file casing conflict
// between 'icons.tsx' and 'Icons.tsx'. All icon imports should now point to 'Icons.tsx'.

// FIX: To resolve the file casing conflict (TS1149), this file now re-exports from the canonical 'Icons.tsx' file.
// This ensures that even if both files are included in the compilation, they are treated as the same module.
export * from './Icons.tsx';