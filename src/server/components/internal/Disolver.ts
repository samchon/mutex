/**
 * @packageDocumentation
 * @module msv
 */
//-----------------------------------------------------------
import { List } from "tstl/container/List";
import { Joiner } from "./Joiner";

/**
 * @internal
 */
export type Disolver = List.Iterator<Joiner> & { erased_?: boolean };