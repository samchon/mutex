import { Driver } from "tgrid/components/Driver";
import { MutexProvider } from "../providers/MutexProvider";

export class RemoteMutex
{
    /**
     * @hidden
     */
    private controller_: Driver.Promisive<MutexProvider>;

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
    private constructor(controller: Driver.Promisive<MutexProvider>, name: string)
    {
        this.controller_ = controller;
        this.name_ = name;
    }

    /**
     * @internal
     */
    public static async create
        (
            controller: Driver.Promisive<MutexProvider>, 
            name: string
        ): Promise<RemoteMutex>
    {
        await controller.emplace(name);
        return new RemoteMutex(controller, name);
    }

    /* -----------------------------------------------------------
        WRITE LOCK
    ----------------------------------------------------------- */
    public lock(): Promise<void>
    {
        return this.controller_.lock(this.name_);
    }
    
    public try_lock(): Promise<boolean>
    {
        return this.controller_.try_lock(this.name_);
    }

    public try_lock_for(ms: number): Promise<boolean>
    {
        return this.controller_.try_lock_for(this.name_, ms);
    }

    public try_lock_until(at: Date): Promise<boolean>
    {
        return this.controller_.try_lock_until(this.name_, at);
    }

    public unlock(): Promise<void>
    {
        return this.controller_.unlock(this.name_);
    }

    /* -----------------------------------------------------------
        READ LOCK
    ----------------------------------------------------------- */
    public lock_shared(): Promise<void>
    {
        return this.controller_.lock_shared(this.name_);
    }
    
    public try_lock_shared(): Promise<boolean>
    {
        return this.controller_.try_lock_shared(this.name_);
    }

    public try_lock_shared_for(ms: number): Promise<boolean>
    {
        return this.controller_.try_lock_shared_for(this.name_, ms);
    }

    public try_lock_shared_until(at: Date): Promise<boolean>
    {
        return this.controller_.try_lock_shared_until(this.name_, at);
    }

    public unlock_shared(): Promise<void>
    {
        return this.controller_.unlock_shared(this.name_);
    }
}