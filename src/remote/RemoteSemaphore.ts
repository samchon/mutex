import { Driver } from "tgrid/components/Driver";
import { SemaphoreProvider } from "../providers/SemaphoreProvider";

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

    public max(): Promise<number>
    {
        return this.controller_.max(this.name_);
    }

    /* -----------------------------------------------------------
        LOCKERS
    ----------------------------------------------------------- */
    public acquire(): Promise<void>
    {
        return this.controller_.acquire(this.name_);
    }

    public try_acquire(): Promise<boolean>
    {
        return this.controller_.try_acquire(this.name_);
    }

    public try_acquire_for(ms: number): Promise<boolean>
    {
        return this.controller_.try_acquire_for(this.name_, ms);
    }

    public try_acquire_until(at: Date): Promise<boolean>
    {
        return this.controller_.try_acquire_until(this.name_, at);
    }

    public release(count: number = 1): Promise<void>
    {
        return this.controller_.release(this.name_, count);
    }
}