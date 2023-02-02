/**
 * @packageDocumentation
 * @module msv
 */
//-----------------------------------------------------------
import { ServerMutex } from "../components/ServerMutex";
import { GlobalBase } from "./GlobalBase";

/**
 * @internal
 */
export class GlobalMutexes extends GlobalBase<ServerMutex, undefined, void> {
    protected _Create_component(): ServerMutex {
        return new ServerMutex();
    }

    protected _Returns({}: ServerMutex): void {}
}
