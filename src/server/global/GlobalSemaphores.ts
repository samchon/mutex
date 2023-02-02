/**
 * @packageDocumentation
 * @module msv
 */
//-----------------------------------------------------------
import { ServerSemaphore } from "../components/ServerSemaphore";
import { GlobalBase } from "./GlobalBase";

/**
 * @internal
 */
export class GlobalSemaphores extends GlobalBase<
    ServerSemaphore,
    number,
    number
> {
    protected _Create_component(max: number): ServerSemaphore {
        return new ServerSemaphore(max);
    }

    protected _Returns(sema: ServerSemaphore): number {
        return sema.max();
    }
}
