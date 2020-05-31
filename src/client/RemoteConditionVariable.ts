/**
 * @packageDocumentation
 * @module ms
 */
//-----------------------------------------------------------
import { Driver } from "tgrid/components/Driver";
import { ConditionVariableProvider } from "../server/ConditionVariableProvider";

/**
 * Remote ConditionVariable.
 * 
 * @author Jeongho Nam
 */
export class RemoteConditionVariable
{
    /**
     * @hidden
     */
    private controller_: Driver.Promisive<ConditionVariableProvider>;

    /**
     * @hidden
     */
    private name_: string;

    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    /**
     * @hidden
     */
    private constructor(controller: Driver.Promisive<ConditionVariableProvider>, name: string)
    {
        this.controller_ = controller;
        this.name_ = name;
    }

    /**
     * @internal
     */
    public static async create
        (
            controller: Driver.Promisive<ConditionVariableProvider>, 
            name: string
        ): Promise<RemoteConditionVariable>
    {
        await controller.emplace(name);
        return new RemoteConditionVariable(controller, name);
    }

    /* -----------------------------------------------------------
        WAITORS
    ----------------------------------------------------------- */
    public wait(): Promise<void>
    {
        return this.controller_.wait(this.name_);
    }

    public wait_for(ms: number): Promise<boolean>
    {
        return this.controller_.wait_for(this.name_, ms);
    }

    public wait_until(at: Date): Promise<boolean>
    {
        return this.controller_.wait_until(this.name_, at);
    }

    /* -----------------------------------------------------------
        NOTIFIERS
    ----------------------------------------------------------- */
    public notify_one(): Promise<void>
    {
        return this.controller_.notify_one(this.name_);
    }

    public notify_all(): Promise<void>
    {
        return this.controller_.notify_all(this.name_);
    }
}