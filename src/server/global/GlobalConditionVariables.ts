/**
 * @packageDocumentation
 * @module msv
 */
//-----------------------------------------------------------
import { GlobalBase } from "./GlobalBase";
import { ServerConditionVariable } from "../components/ServerConditionVariable";

/**
 * @internal
 */
export class GlobalConditionVariablaes extends GlobalBase<ServerConditionVariable, undefined, void>
{
    protected _Create_component(): ServerConditionVariable
    {
        return new ServerConditionVariable();
    }

    protected _Returns({}: ServerConditionVariable): void {}
}