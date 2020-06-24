/**
 * @packageDocumentation
 * @module ms
 */
//-----------------------------------------------------------
import { Driver } from "tgrid/components/Driver";
import { LatchProvider } from "../server/LatchProvider";

/**
 * Remote Latch.
 * 
 * The `RemoteLatch` class blocks critical sections until the downward counter to be zero. 
 * However, unlike {@link RemoteBarrier} who can reusable that downward counter be reset whenever 
 * reach to the zero, downward of the `Latch` is not reusable but diposable.
 * 
 * @author Jeongho Nam
 */
export class RemoteLatch
{
    /**
     * @hidden
     */
    private controller_: Driver.Promisive<LatchProvider>;

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
    private constructor(controller: Driver.Promisive<LatchProvider>, name: string)
    {
        this.controller_ = controller;
        this.name_ = name;
    }

    /**
     * @internal
     */
    public static async create
        (
            controller: Driver.Promisive<LatchProvider>, 
            name: string,
            count: number
        ): Promise<RemoteLatch>
    {
        await controller.emplace(name, count);
        return new RemoteLatch(controller, name);
    }

    /* -----------------------------------------------------------
        ARRIVALS
    ----------------------------------------------------------- */
    /**
     * Derecements the counter.
     * 
     * Decrements the counter by *n* without blocking. 
     * 
     * If the parametric value *n* is equal to or greater than internal counter, so that the 
     * internal counter be equal to or less than zero, everyone who are {@link wait waiting} for
     * the {@link RemoteLatch} would continue their execution.
     * 
     * @param n Value of the decrement. Default is 1.
     */
    public count_down(n: number = 1): Promise<void>
    {
        return this.controller_.count_down(this.name_, n);
    }
    
    /**
     * Decrements the counter and waits until the counter to be zero.
     * 
     * Decrements the counter by *n* and blocks the section until internal counter to be zero. 
     * 
     * If the parametric value *n* is equal to or greater than internal counter, so that the 
     * internal counter be equal to or less than zero, everyone who are {@link wait waiting} for
     * the {@link RemoteLatch} would continue their execution including this one.
     * 
     * @param n Value of the decrement. Default is 1.
     */
    public arrive_and_wait(): Promise<void>
    {
        return this.controller_.arrive_and_wait(this.name_);
    }

    /* -----------------------------------------------------------
        WAITORS
    ----------------------------------------------------------- */
    /**
     * Waits until the counter to be zero.
     * 
     * Blocks the function calling until internal counter to be reached to the zero. 
     * 
     * If the {@link Latch} already has been reached to the zero, it would be returned 
     * immediately.
     */
    public wait(): Promise<void>
    {
        return this.controller_.wait(this.name_);
    }

    /**
     * Test whether the counter has been reached to the zero.
     * 
     * The {@link try_wait} function tests whether the internal counter has been reached to the 
     * zero.
     * 
     * @return Whether reached to zero or not.
     */
    public try_wait(): Promise<boolean>
    {
        return this.controller_.try_wait(this.name_);
    }

    /**
     * Tries to wait until the counter to be zero in timeout.
     * 
     * Attempts to block the function calling until internal counter to be reached to the zero
     * in timeout. If succeeded to waiting the counter to be reached to the zero, it returns 
     * `true`. Otherwise, the {@link RemoteLatch} fails to reach to the zero in the given time, 
     * the function gives up the waiting and returns `false`.
     * 
     * If the {@link Latch} already has been reached to the zero, it would return `true` directly.
     * 
     * @param ms The maximum miliseconds for waiting.
     * @return Whether succeeded to waiting in the given time.
     */
    public wait_for(ms: number): Promise<boolean>
    {
        return this.controller_.wait_for(this.name_, ms);
    }

    /**
     * Tries to wait until the counter to be zero in time expiration.
     * 
     * Attempts to block the function calling until internal counter to be reached to the zero
     * in time expiration. If succeeded to waiting the counter to be reached to the zero, it 
     * returns `true`. Otherwise, the {@link RemoteLatch} fails to reach to the zero in the given 
     * time, the function gives up the waiting and returns `false`.
     * 
     * If the {@link RemoteLatch} already has been reached to the zero, it would return `true` 
     * directly.
     * 
     * @param at The maximum time point to wait.
     * @return Whether succeeded to waiting in the given time.
     */
    public wait_until(at: Date): Promise<boolean>
    {
        return this.controller_.wait_until(this.name_, at);
    }
}