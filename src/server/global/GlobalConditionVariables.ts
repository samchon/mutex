/**
 * @packageDocumentation
 * @module msv
 */
//-----------------------------------------------------------
import { ServerConditionVariable } from "../components/ServerConditionVariable";
import { GlobalBase } from "./GlobalBase";

/**
 * @internal
 */
export class GlobalConditionVariablaes extends GlobalBase<
    ServerConditionVariable,
    undefined,
    void
> {
    protected _Create_component(): ServerConditionVariable {
        return new ServerConditionVariable();
    }

    protected _Returns({}: ServerConditionVariable): void {}
}
