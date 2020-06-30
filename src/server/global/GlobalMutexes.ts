/**
 * @packageDocumentation
 * @module mutex
 */
//-----------------------------------------------------------
import { GlobalBase } from "./GlobalBase";
import { ServerMutex } from "../components/ServerMutex";

/**
 * @internal
 */
export class GlobalMutexes extends GlobalBase<ServerMutex, undefined, void>
{
    protected _Create_component(): ServerMutex
    {
        return new ServerMutex();
    }

    protected _Returns({}: ServerMutex): void {}
}