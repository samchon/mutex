/**
 * @packageDocumentation
 * @module ms
 */
//-----------------------------------------------------------
import { Driver } from "tgrid/components/Driver";
import { SemaphoreProvider } from "../server/SemaphoreProvider";

import { ITimedLockable } from "tstl/internal/thread/ITimedLockable";
import { Semaphore } from "tstl/thread/Semaphore";

/**
 * Remote Semaphore
 * 
 * @author Jeongho Nam
 */
export class RemoteSemaphore
{
    /**
     * @hidden
     */
    private controller_: Driver.Promisive<SemaphoreProvider>;

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
    private constructor(controller: Driver.Promisive<SemaphoreProvider>, name: string)
    {
        this.controller_ = controller;
        this.name_ = name;
    }

    /**
     * @internal
     */
    public static async create
        (
            controller: Driver.Promisive<SemaphoreProvider>, 
            name: string,
            count: number
        ): Promise<RemoteSemaphore>
    {
        await controller.emplace(name, count);
        return new RemoteSemaphore(controller, name);
    }

    /**
     * Number of maximum sections lockable.
     */
    public max(): Promise<number>
    {
        return this.controller_.max(this.name_);
    }

    /* -----------------------------------------------------------
        LOCKERS
    ----------------------------------------------------------- */
    /**
	 * Acquire a section until be released.
	 */
    public acquire(): Promise<void>
    {
        return this.controller_.acquire(this.name_);
    }

    /**
	 * Try acquire a section.
	 * 
	 * @return Whether succeeded to acquire or not.
	 */
    public try_acquire(): Promise<boolean>
    {
        return this.controller_.try_acquire(this.name_);
    }

    /**
     * Try acquire a section until timeout.
     * 
     * @param ms The maximum miliseconds for waiting.
     * @return Whether succeded to acquire or not.
     */
    public try_acquire_for(ms: number): Promise<boolean>
    {
        return this.controller_.try_acquire_for(this.name_, ms);
    }

    /**
     * Try acquire a section until time expiration.
     * 
     * @param at The maximum time point to wait.
     * @return Whether succeded to acquire or not.
     */
    public try_acquire_until(at: Date): Promise<boolean>
    {
        return this.controller_.try_acquire_until(this.name_, at);
    }

    /**
     * Release a section
     * 
     * @param count Number of sections to be released
     */
    public release(count: number = 1): Promise<void>
    {
        return this.controller_.release(this.name_, count);
    }
}

export namespace RemoteSemaphore
{
    export function get_lockable(semaphore: RemoteSemaphore): ITimedLockable
    {
        return Semaphore.get_lockable(semaphore);
    }
}