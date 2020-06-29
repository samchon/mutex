/**
 * @packageDocumentation
 * @module mutex
 */
//-----------------------------------------------------------
import { ProviderBase } from "./ProviderBase";
import { GlobalMutexes } from "../global/GlobalMutexes";

/**
 * @internal
 */
export class MutexesProvider extends ProviderBase<GlobalMutexes>
{
    public emplace(name: string): void
    {
        this.global_.emplace(name);
    }

    /* ---------------------------------------------------------
        WRITE
    --------------------------------------------------------- */
    public lock(name: string): Promise<void>
    {
        return this.global_.lock(name, this.acceptor_, this.createDisolver());
    }

    public try_lock(name: string): Promise<boolean>
    {
        return this.global_.try_lock(name, this.acceptor_, this.createDisolver());
    }

    public try_lock_for(name: string, ms: number): Promise<boolean>
    {
        return this.global_.try_lock_for(name, ms, this.acceptor_, this.createDisolver());
    }

    public unlock(name: string): Promise<void>
    {
        return this.global_.unlock(name, this.acceptor_);
    }

    /* ---------------------------------------------------------
        READ
    --------------------------------------------------------- */
    public lock_shared(name: string): Promise<void>
    {
        return this.global_.lock_shared(name, this.acceptor_, this.createDisolver());
    }

    public try_lock_shared(name: string): Promise<boolean>
    {
        return this.global_.try_lock_shared(name, this.acceptor_, this.createDisolver());
    }

    public try_lock_shared_for(name: string, ms: number): Promise<boolean>
    {
        return this.global_.try_lock_shared_for(name, ms, this.acceptor_, this.createDisolver());
    }

    public unlock_shared(name: string): Promise<void>
    {
        return this.global_.unlock_shared(name, this.acceptor_);
    }
}