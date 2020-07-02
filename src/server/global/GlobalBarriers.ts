/**
 * @packageDocumentation
 * @module msv
 */
//-----------------------------------------------------------
import { GlobalBase } from "./GlobalBase";
import { ServerBarrier } from "../components/ServerBarrier";

/**
 * @internal
 */
export class GlobalBarriers extends GlobalBase<ServerBarrier, number, void>
{
    protected _Create_component(size: number): ServerBarrier
    {
        return new ServerBarrier(size);
    }

    protected _Returns({}: ServerBarrier): void {}
}