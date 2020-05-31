/**
 * @packageDocumentation
 * @module ms
 */
//-----------------------------------------------------------
import { HashMap } from "tstl/container/HashMap";
import { ConditionVariable } from "tstl/thread/ConditionVariable";

/**
 * @hidden
 */
export class ConditionVariableProvider
{
    private dict_: HashMap<string, ConditionVariable>;

    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    public constructor()
    {
        this.dict_ = new HashMap();
    }

    public emplace(name: string): void
    {
        let it: HashMap.Iterator<string, ConditionVariable> = this.dict_.find(name);
        if (it.equals(this.dict_.end()) === true)
            it = this.dict_.emplace(name, new ConditionVariable()).first;
    }

    /* -----------------------------------------------------------
        WAITORS
    ----------------------------------------------------------- */
    public wait(name: string): Promise<void>
    {
        return this.dict_.get(name).wait();
    }

    public wait_for(name: string, ms: number): Promise<boolean>
    {
        return this.dict_.get(name).wait_for(ms);
    }

    public wait_until(name: string, at: Date): Promise<boolean>
    {
        return this.dict_.get(name).wait_until(at);
    }

    /* -----------------------------------------------------------
        NOTIFIERS
    ----------------------------------------------------------- */
    public notify_one(name: string): Promise<void>
    {
        return this.dict_.get(name).notify_one();
    }

    public notify_all(name: string): Promise<void>
    {
        return this.dict_.get(name).notify_all();
    }
}