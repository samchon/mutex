import { List } from "tstl";
import { Joiner } from "./Joiner";

/**
 * @internal
 */
export type Disolver = List.Iterator<Joiner> & { erased_?: boolean };
