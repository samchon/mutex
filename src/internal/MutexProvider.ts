import { HashMap } from "tstl/container/HashMap";
import { SharedTimedMutex } from "tstl/thread/SharedTimedMutex";

export class MutexProvider
{
    private mutexes_: HashMap<string, SharedTimedMutex>;

    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    public constructor()
    {
        this.mutexes_ = new HashMap();
    }

    private _Emplace(name: string): SharedTimedMutex
    {
        let it: HashMap.Iterator<string, SharedTimedMutex> = this.mutexes_.find(name);
        if (it.equals(this.mutexes_.end()) === true)
            it = this.mutexes_.emplace(name, new SharedTimedMutex()).first;

        return it.second;
    }

    /* -----------------------------------------------------------
        WRITE
    ----------------------------------------------------------- */
    public lock(name: string): Promise<void>
    {
        return this._Emplace(name).lock();
    }

    public try_lock(name: string): Promise<boolean>
    {
        return this._Emplace(name).try_lock();
    }

    public try_lock_for(name: string, ms: number): Promise<boolean>
    {
        return this._Emplace(name).try_lock_for(ms);
    }

    public try_lock_until(name: string, at: Date): Promise<boolean>
    {
        return this._Emplace(name).try_lock_until(at);
    }

    public unlock(name: string): Promise<void>
    {
        return this._Emplace(name).unlock();
    }

    /* -----------------------------------------------------------
        READ
    ----------------------------------------------------------- */
    public lock_shared(name: string): Promise<void>
    {
        return this._Emplace(name).lock_shared();
    }

    public try_lock_shared(name: string): Promise<boolean>
    {
        return this._Emplace(name).try_lock_shared();
    }

    public try_lock_shared_for(name: string, ms: number): Promise<boolean>
    {
        return this._Emplace(name).try_lock_shared_for(ms);
    }

    public try_lock_shared_until(name: string, at: Date): Promise<boolean>
    {
        return this._Emplace(name).try_lock_shared_until(at);
    }

    public unlock_shared(name: string): Promise<void>
    {
        return this._Emplace(name).unlock_shared();
    }
}