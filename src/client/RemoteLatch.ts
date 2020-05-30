import { Driver } from "tgrid/components/Driver";
import { LatchProvider } from "../server/LatchProvider";

export class RemoteLatch
{
    /**
     * @hidden
     */
    private controller_: Driver.Promisive<LatchProvider>;

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
    private constructor(controller: Driver.Promisive<LatchProvider>, name: string)
    {
        this.controller_ = controller;
        this.name_ = name;
    }

    /**
     * @internal
     */
    public static async create
        (
            controller: Driver.Promisive<LatchProvider>, 
            name: string,
            count: number
        ): Promise<RemoteLatch>
    {
        await controller.emplace(name, count);
        return new RemoteLatch(controller, name);
    }

    /* -----------------------------------------------------------
        ARRIVALS
    ----------------------------------------------------------- */
    public count_down(n: number = 1): Promise<void>
    {
        return this.controller_.count_down(this.name_, n);
    }
    
    public arrive_and_wait(): Promise<void>
    {
        return this.controller_.arrive_and_wait(this.name_);
    }

    /* -----------------------------------------------------------
        WAITORS
    ----------------------------------------------------------- */
    public wait(): Promise<void>
    {
        return this.controller_.wait(this.name_);
    }

    public try_wait(): Promise<boolean>
    {
        return this.controller_.try_wait(this.name_);
    }

    public wait_for(ms: number): Promise<boolean>
    {
        return this.controller_.wait_for(this.name_, ms);
    }

    public wait_until(at: Date): Promise<boolean>
    {
        return this.controller_.wait_until(this.name_, at);
    }
}