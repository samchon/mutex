/**
 * @packageDocumentation
 * @module mutex
 */
//-----------------------------------------------------------
/**
 * @internal
 */
export type Joiner = (() => void) | (() => Promise<void>) | undefined;