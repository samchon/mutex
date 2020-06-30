import { GlobalBase } from "./GlobalBase";
import { ServerConditionVariable } from "../components/ServerConditionVariable";

export class GlobalConditionVariablaes extends GlobalBase<ServerConditionVariable, undefined, void>
{
    protected _Create_component(): ServerConditionVariable
    {
        return new ServerConditionVariable();
    }

    protected _Returns({}: ServerConditionVariable): void {}
}