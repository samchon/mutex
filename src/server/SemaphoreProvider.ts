/**
 * @packageDocumentation
 * @module ms
 */
//-----------------------------------------------------------
import { HashMap } from "tstl/container/HashMap";
import { Semaphore } from "tstl/thread/Semaphore";

/**
 * @hidden
 */
export class SemaphoreProvider
{
    private dict_: HashMap<string, Semaphore>;
    
    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    public constructor()
    {
        this.dict_ = new HashMap();
    }

    public emplace(name: string, count: number): void
    {
        let it: HashMap.Iterator<string, Semaphore> = this.dict_.find(name);
        if (it.equals(this.dict_.end()) === true)
            it = this.dict_.emplace(name, new Semaphore(count)).first;
    }

    /* -----------------------------------------------------------
        ACCESSORS
    ----------------------------------------------------------- */
    public max(name: string): number
    {
        return this.dict_.get(name).max();
    }

    public acquire(name: string): Promise<void>
    {
        return this.dict_.get(name).acquire();
    }

    public try_acquire(name: string): Promise<boolean>
    {
        return this.dict_.get(name).try_acquire();
    }

    public try_acquire_for(name: string, ms: number): Promise<boolean>
    {
        return this.dict_.get(name).try_acquire_for(ms);
    }

    public try_acquire_until(name: string, at: Date): Promise<boolean>
    {
        return this.dict_.get(name).try_acquire_until(at);
    }

    public release(name: string, count: number): Promise<void>
    {
        return this.dict_.get(name).release(count);
    }
}