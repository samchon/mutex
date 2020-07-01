/**
 * @packageDocumentation
 * @module mutex
 */
//-----------------------------------------------------------
import { SolidComponent } from "./SolidComponent";

import { List } from "tstl/container/List";
import { WebAcceptor } from "tgrid/protocols/web/WebAcceptor";
import { sleep_for } from "tstl/thread/global";

import { LockType } from "tstl/internal/thread/LockType";
import { Joiner } from "./internal/Joiner";

/**
 * @internal
 */
export class ServerConditionVariable extends SolidComponent<Resolver, {}>
{
    /* ---------------------------------------------------------
        WAITORS
    --------------------------------------------------------- */
    public wait(acceptor: WebAcceptor<any, any>, disolver: List.Iterator<Joiner>): Promise<void>
    {
        return new Promise(resolve =>
        {
            // ENROLL TO THE RESOLVERS
            let it: List.Iterator<Resolver> = this._Insert_resolver({
                handler: resolve,
                lockType: LockType.HOLD,

                acceptor: acceptor,
                disolver: disolver,
                aggregate: {}
            });

            // DISCONNECTION HANDLER
            disolver.value = () => this._Cancel_wait(it);
        });
    }

    public wait_for(ms: number, acceptor: WebAcceptor<any, any>, disolver: List.Iterator<Joiner>): Promise<boolean>
    {
        return new Promise(resolve =>
        {
            // ENROLL TO THE RESOLVERS
            let it: List.Iterator<Resolver> = this._Insert_resolver({
                handler: resolve,
                lockType: LockType.KNOCK,

                acceptor: acceptor,
                disolver: disolver,
                aggregate: {}
            });

            // DISCONNECTION HANDLER
            disolver.value = () => this._Cancel_wait(it);

            // TIME EXPIRATION HANDLER
            sleep_for(ms).then(() =>
            {
                resolve(this._Cancel_wait(it) === false);
            });
        });
    }

    private _Cancel_wait(it: List.Iterator<Resolver>): boolean
    {
        if (it.value.handler === null)
            return false;

        it.value.destructor!();
        this.queue_.erase(it);

        return true;
    }

    /* ---------------------------------------------------------
        NOTIFIERS
    --------------------------------------------------------- */
    public async notify_one(): Promise<void>
    {
        if (this.queue_.empty())
            return;

        // POP THE FIRST ITEM
        let it: List.Iterator<Resolver> = this.queue_.begin();
        this.queue_.erase(it);

        // DO RESOLVE
        this._Notify(it.value, true);
    }

    public async notify_all(): Promise<void>
    {
        if (this.queue_.empty())
            return;

        // COPY RESOLVERS
        let ordinaryResolvers: Resolver[] = [ ...this.queue_ ];
        let copiedResolvers: Resolver[] = ordinaryResolvers.map(resolver => ({ ...resolver }));

        // CLEAR OLD ITEMS
        this.queue_.clear();
        for (let resolver of ordinaryResolvers)
            resolver.destructor!();

        // DO NOTIFY
        for (let resolver of copiedResolvers)
            this._Notify(resolver, false);
    }

    private _Notify(resolver: Resolver, discard: boolean): void
    {
        // RESERVE HANDLER
        let handler = resolver.handler!;

        // DISCARD FOR SEQUENCE
        if (discard === true)
            resolver.destructor!();
        
        // CALL HANDLER
        if (resolver.lockType === LockType.HOLD)
            handler();
        else
            handler(true);
    }
}

/**
 * @internal
 */
type Resolver = SolidComponent.Resolver<Resolver, {}>;