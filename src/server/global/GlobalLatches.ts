/**
 * @packageDocumentation
 * @module msv
 */
//-----------------------------------------------------------
import { ServerLatch } from "../components/ServerLatch";
import { GlobalBase } from "./GlobalBase";

/**
 * @internal
 */
export class GlobalLatches extends GlobalBase<ServerLatch, number, void> {
    protected _Create_component(size: number): ServerLatch {
        return new ServerLatch(size);
    }

    protected _Returns({}: ServerLatch): void {}
}
