import type { Driver } from "tgrid/components/Driver";
import type { SemaphoresProvider } from "../server/providers/SemaphoresProvider";
import { Semaphore } from "tstl/thread/Semaphore";

/**
 * Remote Semaphore.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export class RemoteSemaphore
{
    /**
     * @hidden
     */
    private controller_: Driver.Promisive<SemaphoresProvider>;

    /**
     * @hidden
     */
    private name_: string;

    /**
     * @hidden
     */
    private max_: number;

    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    /**
     * @hidden
     */
    private constructor(controller: Driver.Promisive<SemaphoresProvider>, name: string, max: number)
    {
        this.controller_ = controller;
        this.name_ = name;
        this.max_ = max;
    }

    /**
     * @internal
     */
    public static async create
        (
            controller: Driver.Promisive<SemaphoresProvider>, 
            name: string,
            count: number
        ): Promise<RemoteSemaphore>
    {
        let max: number = await controller.emplace(name, count);
        return new RemoteSemaphore(controller, name, max);
    }

    /**
     * Number of maximum sections lockable.
     */
    public async max(): Promise<number>
    {
        return this.max_;
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
    public async try_acquire_until(at: Date): Promise<boolean>
    {
        let ms: number = at.getTime() - Date.now();
        return await this.try_acquire_for(ms);
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
    export import get_lockable = Semaphore.get_lockable;
}