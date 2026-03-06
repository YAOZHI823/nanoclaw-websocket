# Intent for src/types.ts

Add `isDefault` field to `AdditionalMount` interface.

## Changes

1. Add `isDefault?: boolean` field to `AdditionalMount` interface.
   - This field marks whether a mount is a default mount (system-defined) vs user-defined.
   - User-defined mounts have `isDefault: false` or undefined.
   - Default mounts have `isDefault: true`.

## Invariants

- Keep existing fields in AdditionalMount.
