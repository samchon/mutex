/**
 * @packageDocumentation
 * @module msv
 */
//-----------------------------------------------------------
import { ProviderBase } from "./ProviderBase";
import { GlobalLatches } from "../global/GlobalLatches";

/**
 * @internal
 */
export class LatchesProvider extends ProviderBase<GlobalLatches, number, void>
{
    public wait(name: string): Promise<void>
    {
        return this.get(name).wait(this.acceptor_, this.createDisolver());
    }

    public try_wait(name: string): Promise<boolean>
    {
        return this.get(name).try_wait();
    }

    public wait_for(name: string, ms: number): Promise<boolean>
    {
        return this.get(name).wait_for(ms, this.acceptor_, this.createDisolver());
    }

    public count_down(name: string, n: number): Promise<void>
    {
        return this.get(name).count_down(n);
    }

    public arrive_and_wait(name: string): Promise<void>
    {
        return this.get(name).arrive_and_wait(this.acceptor_, this.createDisolver());
    }
}