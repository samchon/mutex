/**
 * @packageDocumentation
 * @module ms
 */
//-----------------------------------------------------------
import { HashMap } from "tstl/container/HashMap";
import { SharedTimedMutex } from "tstl/thread/SharedTimedMutex";

/**
 * @hidden
 */
export class MutexProvider
{
    private dict_: HashMap<string, SharedTimedMutex>;

    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    public constructor()
    {
        this.dict_ = new HashMap();
    }

    public emplace(name: string): void
    {
        let it: HashMap.Iterator<string, SharedTimedMutex> = this.dict_.find(name);
        if (it.equals(this.dict_.end()) === true)
            it = this.dict_.emplace(name, new SharedTimedMutex()).first;
    }

    /* -----------------------------------------------------------
        WRITE
    ----------------------------------------------------------- */
    public lock(name: string): Promise<void>
    {
        return this.dict_.get(name).lock();
    }

    public try_lock(name: string): Promise<boolean>
    {
        return this.dict_.get(name).try_lock();
    }

    public try_lock_for(name: string, ms: number): Promise<boolean>
    {
        return this.dict_.get(name).try_lock_for(ms);
    }

    public try_lock_until(name: string, at: Date): Promise<boolean>
    {
        return this.dict_.get(name).try_lock_until(at);
    }

    public unlock(name: string): Promise<void>
    {
        return this.dict_.get(name).unlock();
    }

    /* -----------------------------------------------------------
        READ
    ----------------------------------------------------------- */
    public lock_shared(name: string): Promise<void>
    {
        return this.dict_.get(name).lock_shared();
    }

    public try_lock_shared(name: string): Promise<boolean>
    {
        return this.dict_.get(name).try_lock_shared();
    }

    public try_lock_shared_for(name: string, ms: number): Promise<boolean>
    {
        return this.dict_.get(name).try_lock_shared_for(ms);
    }

    public try_lock_shared_until(name: string, at: Date): Promise<boolean>
    {
        return this.dict_.get(name).try_lock_shared_until(at);
    }

    public unlock_shared(name: string): Promise<void>
    {
        return this.dict_.get(name).unlock_shared();
    }
}