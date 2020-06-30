/**
 * @packageDocumentation
 * @module mutex
 */
//-----------------------------------------------------------
import { GlobalBase } from "./GlobalBase";
import { ServerSemaphore } from "../components/ServerSemaphore";

/**
 * @internal
 */
export class GlobalSemaphores extends GlobalBase<ServerSemaphore, number, number>
{
    protected _Create_component(max: number): ServerSemaphore
    {
        return new ServerSemaphore(max);
    }

    protected _Returns(sema: ServerSemaphore): number
    {
        return sema.max();
    }
}