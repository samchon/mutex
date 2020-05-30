import { HashMap } from "tstl/container/HashMap";
import { Latch } from "tstl/thread/Latch";

export class LatchProvider
{
    private dict_: HashMap<string, Latch>;

    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    public constructor()
    {
        this.dict_ = new HashMap();
    }

    public emplace(name: string, count: number): void
    {
        let it: HashMap.Iterator<string, Latch> = this.dict_.find(name);
        if (it.equals(this.dict_.end()) === true)
            it = this.dict_.emplace(name, new Latch(count)).first;
    }

    /* -----------------------------------------------------------
        ARRIVALS
    ----------------------------------------------------------- */
    public count_down(name: string, n: number): Promise<void>
    {
        return this.dict_.get(name).count_down(n);
    }

    public arrive_and_wait(name: string): Promise<void>
    {
        return this.dict_.get(name).arrive_and_wait();
    }

    /* -----------------------------------------------------------
        WAITORS
    ----------------------------------------------------------- */
    public wait(name: string): Promise<void>
    {
        return this.dict_.get(name).wait();
    }

    public try_wait(name: string): Promise<boolean>
    {
        return this.dict_.get(name).try_wait();
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