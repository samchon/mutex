/**
 * @packageDocumentation
 * @module msv
 */
//-----------------------------------------------------------
import { GlobalBase } from "./GlobalBase";
import { ServerLatch } from "../components/ServerLatch";

/**
 * @internal
 */
export class GlobalLatches extends GlobalBase<ServerLatch, number, void>
{
    protected _Create_component(size: number): ServerLatch
    {
        return new ServerLatch(size);
    }

    protected _Returns({}: ServerLatch): void {}
}