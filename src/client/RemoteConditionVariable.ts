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
    /**
     * Wait until be notified.
     * 
     * Blocks the function call until the condition variable wakes it up.
     */
    public wait(): Promise<void>;

    /**
     * Wait until predicator returns true.
     * 
     * Blocks the function call until the condition variable wakes it up when the *predicator*
     * function returns `false`. Otherwise the *predicator* function returns `true`, the 
     * waiting would be completed directly.
     * 
     * Equivalent to: 
     * 
     * ```typescript
    while (await predicator() === false)
        await this.wait();
     * ```
     * 
     * @param predicator A predicator function determines the completion.
     */
    public wait(predicator: Predicator): Promise<void>;

    public async wait(predicator?: Predicator): Promise<void>
    {
        if (predicator === undefined)
            return await this.controller_.wait(this.name_);
        
        while (await predicator() === false)
            await this.controller_.wait(this.name_);
    }

    /**
     * Tries to wait until be notified in timeout.
     * 
     * Blocks the function call until the condition variable wakes it up in timeout.
     * 
     * @param ms The maximum miliseconds for waiting.
     * @param predicator A predicator function determines the completion.
     * @return Whether awaken by notification or timeout.
     */
    public wait_for(ms: number): Promise<boolean>;

    /**
     * Tries to wait until predicator returns true in timeout.
     * 
     * Blocks the function call until the condition variable wakes it up when the *predicator*
     * function returns `false` in timeout. Otherwise the *predicator* function returns `true`, 
     * the waiting would be completed directly.
     * 
     * Equivalent to:
     * 
     * ```typescript
    let at: Date = new Date(Date.now() + ms);
    return await this.wait_until(at, predicator);
     * ```
     * 
     * @param at The maximum time point to wait.
     * @param predicator A predicator function determines the completion.
     * @return Returned value of the *predicator*.
     */
    public wait_for(ms: number, predicator: Predicator): Promise<boolean>;

    public async wait_for(ms: number, predicator?: Predicator): Promise<boolean>
    {
        let at: Date = new Date(Date.now() + ms);
        return await this.wait_until(at, predicator!);
    }

    /**
     * Tries to wait until be notified in time expiration.
     * 
     * Blocks the function call until the condition variable wakes it up in time expiration.
     * 
     * @param at The maximum time point to wait.
     * @return Whether awaken by notification or time expiration.
     */
    public wait_until(at: Date): Promise<boolean>;

    /**
     * Tries to wait until predicator returns true in time expiration.
     * 
     * Blocks the function call until the condition variable wakes it up when the *predicator*
     * function returns `false` in time expiration. Otherwise the *predicator* function returns 
     * `true`, the waiting would be completed directly.
     * 
     * Equivalent to:
     * 
     * ```typescript
    while (await predicator() === false)
        if (await this.controller_.wait_until(this.name_, at) === false)
            return await predicator();
    return trre
     * ```
     * 
     * @param at The maximum time point to wait.
     * @param predicator A predicator function determines the completion.
     * @return Returned value of the *predicator*.
     */
    public wait_until(at: Date, predicator: Predicator): Promise<boolean>;

    public async wait_until(at: Date, predicator?: Predicator): Promise<boolean>
    {
        if (predicator === undefined)
            return await this.controller_.wait_until(this.name_, at);

        while (await predicator() === false)
            if (await this.controller_.wait_until(this.name_, at) === false)
                return await predicator();
        
        return true;
    }

    /* -----------------------------------------------------------
        NOTIFIERS
    ----------------------------------------------------------- */
    /**
     * Notify, wake only one.
     */
    public notify_one(): Promise<void>
    {
        return this.controller_.notify_one(this.name_);
    }

    /**
     * Notify, wake all
     */
    public notify_all(): Promise<void>
    {
        return this.controller_.notify_all(this.name_);
    }
}

type Predicator = () => boolean | Promise<boolean>;