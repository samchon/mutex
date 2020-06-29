/**
 * @packageDocumentation
 * @module mutex
 */
//-----------------------------------------------------------

import { GlobalMutexes } from "./GlobalMutexes";

/**
 * @internal
 */
export class GlobalGroup
{
    public mutexes: GlobalMutexes = new GlobalMutexes();
}