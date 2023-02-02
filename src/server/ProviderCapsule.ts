/**
 * @packageDocumentation
 * @module msv
 */
//-----------------------------------------------------------
import { ProviderGroup } from "./ProviderGroup";

/**
 * @internal
 */
export interface ProviderCapsule<T extends object | null> {
    group: ProviderGroup;
    provider: T;
}
