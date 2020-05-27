import { Driver } from "tgrid/components/Driver";
import { BarrierProvider } from "../providers/BarrierProvider";

export class RemoteBarrier
{
    /**
     * @hidden
     */
    private controller_: Driver.Promisive<BarrierProvider>;

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
    private constructor(controller: Driver.Promisive<BarrierProvider>, name: string)
    {
        this.controller_ = controller;
        this.name_ = name;
    }

    /**
     * @internal
     */
    public static async create
        (
            controller: Driver.Promisive<BarrierProvider>, 
            name: string,
            count: number
        ): Promise<RemoteBarrier>
    {
        await controller.emplace(name, count);
        return new RemoteBarrier(controller, name);
    }

    /* -----------------------------------------------------------
        ACCESSORS
    ----------------------------------------------------------- */
    public arrive(n: number = 1): Promise<void>
    {
        return this.controller_.arrive(this.name_, n);
    }

    public arrive_and_drop(): Promise<void>
    {
        return this.controller_.arrive_and_drop(this.name_);
    }
    
    public arrive_and_wait(): Promise<void>
    {
        return this.controller_.arrive_and_wait(this.name_);
    }

    public wait(): Promise<void>
    {
        return this.controller_.wait(this.name_);
    }
}