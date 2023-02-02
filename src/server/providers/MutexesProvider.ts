/**
 * @packageDocumentation
 * @module msv
 */
//-----------------------------------------------------------
import { GlobalMutexes } from "../global/GlobalMutexes";
import { ProviderBase } from "./ProviderBase";

/**
 * @internal
 */
export class MutexesProvider extends ProviderBase<
    GlobalMutexes,
    undefined,
    void
> {
    /* ---------------------------------------------------------
        WRITE
    --------------------------------------------------------- */
    public lock(name: string): Promise<void> {
        return this.get(name).lock(this.acceptor_, this.createDisolver());
    }

    public try_lock(name: string): Promise<boolean> {
        return this.get(name).try_lock(this.acceptor_, this.createDisolver());
    }

    public try_lock_for(name: string, ms: number): Promise<boolean> {
        return this.get(name).try_lock_for(
            ms,
            this.acceptor_,
            this.createDisolver(),
        );
    }

    public unlock(name: string): Promise<void> {
        return this.get(name).unlock(this.acceptor_);
    }

    /* ---------------------------------------------------------
        READ
    --------------------------------------------------------- */
    public lock_shared(name: string): Promise<void> {
        return this.get(name).lock_shared(
            this.acceptor_,
            this.createDisolver(),
        );
    }
    public try_lock_shared(name: string): Promise<boolean> {
        return this.get(name).try_lock_shared(
            this.acceptor_,
            this.createDisolver(),
        );
    }

    public try_lock_shared_for(name: string, ms: number): Promise<boolean> {
        return this.get(name).try_lock_shared_for(
            ms,
            this.acceptor_,
            this.createDisolver(),
        );
    }

    public unlock_shared(name: string): Promise<void> {
        return this.get(name).unlock_shared(this.acceptor_);
    }
}
