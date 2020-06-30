import { List } from "tstl/container/List";
import { Joiner } from "./Joiner";

export type Disolver = List.Iterator<Joiner> & { erased_?: boolean };