/**
 * @packageDocumentation
 * @module msv
 */
//-----------------------------------------------------------
import { ProviderBase } from "./ProviderBase";
import { GlobalSemaphores } from "../global/GlobalSemaphores";

/**
 * @internal
 */
export class SemaphoresProvider extends ProviderBase<GlobalSemaphores, number, number>
{
    public acquire(name: string): Promise<void>
    {
        return this.get(name).acquire(this.acceptor_, this.createDisolver());
    }

    public try_acquire(name: string): Promise<boolean>
    {
        return this.get(name).try_acquire(this.acceptor_, this.createDisolver());
    }

    public try_acquire_for(name: string, ms: number): Promise<boolean>
    {
        return this.get(name).try_acquire_for(ms, this.acceptor_, this.createDisolver());
    }

    public release(name: string, n: number): Promise<void>
    {
        return this.get(name).release(n, this.acceptor_);
    }
}