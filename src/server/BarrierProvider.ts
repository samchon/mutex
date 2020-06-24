/**
 * @packageDocumentation
 * @module ms
 */
//-----------------------------------------------------------
import { HashMap } from "tstl/container/HashMap";
import { Barrier } from "tstl/thread/Barrier";

/**
 * @hidden
 */
export class BarrierProvider
{
    private dict_: HashMap<string, Barrier>;

    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    public constructor()
    {
        this.dict_ = new HashMap();
    }

    public emplace(name: string, count: number): void
    {
        let it: HashMap.Iterator<string, Barrier> = this.dict_.find(name);
        if (it.equals(this.dict_.end()) === true)
            it = this.dict_.emplace(name, new Barrier(count)).first;
    }

    /* -----------------------------------------------------------
        ACCESSORS
    ----------------------------------------------------------- */
    public arrive(name: string, n: number): Promise<void>
    {
        return this.dict_.get(name).arrive(n);
    }

    public arrive_and_drop(name: string): Promise<void>
    {
        return this.dict_.get(name).arrive_and_drop();
    }

    public arrive_and_wait(name: string): Promise<void>
    {
        return this.dict_.get(name).arrive_and_wait();
    }

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
}