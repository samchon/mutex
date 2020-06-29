/**
 * @packageDocumentation
 * @module mutex
 */
//-----------------------------------------------------------
import { WebAcceptor } from "tgrid/protocols/web/WebAcceptor";
import { HashMap } from "tstl/container/HashMap";
import { List } from "tstl/container/List";

import { Joiner } from "../components/internal/Joiner";
import { ServerMutex } from "../components/ServerMutex";

/**
 * @internal
 */
export class GlobalMutexes
{
    private dict_: HashMap<string, ServerMutex> = new HashMap();

    public emplace(name: string): void
    {
        let it: HashMap.Iterator<string, ServerMutex> = this.dict_.find(name);
        if (it.equals(this.dict_.end()) === true)
            it = this.dict_.emplace(name, new ServerMutex()).first;
    }

    /* ---------------------------------------------------------
        WRITE
    --------------------------------------------------------- */
    public lock(name: string, acceptor: WebAcceptor<any, any>, disolver: List.Iterator<Joiner>): Promise<void>
    {
        return this.dict_.get(name).lock(acceptor, disolver);
    }

    public try_lock(name: string, acceptor: WebAcceptor<any, any>, disolver: List.Iterator<Joiner>): Promise<boolean>
    {
        return this.dict_.get(name).try_lock(acceptor, disolver);
    }

    public try_lock_for(name: string, ms: number, acceptor: WebAcceptor<any, any>, disolver: List.Iterator<Joiner>): Promise<boolean>
    {
        return this.dict_.get(name).try_lock_for(ms, acceptor, disolver);
    }

    public unlock(name: string, acceptor: WebAcceptor<any, any>): Promise<void>
    {
        return this.dict_.get(name).unlock(acceptor);
    }

    /* ---------------------------------------------------------
        READ
    --------------------------------------------------------- */
    public lock_shared(name: string, acceptor: WebAcceptor<any, any>, disolver: List.Iterator<Joiner>): Promise<void>
    {
        return this.dict_.get(name).lock_shared(acceptor, disolver);
    }

    public try_lock_shared(name: string, acceptor: WebAcceptor<any, any>, disolver: List.Iterator<Joiner>): Promise<boolean>
    {
        return this.dict_.get(name).try_lock_shared(acceptor, disolver);
    }

    public try_lock_shared_for(name: string, ms: number, acceptor: WebAcceptor<any, any>, disolver: List.Iterator<Joiner>): Promise<boolean>
    {
        return this.dict_.get(name).try_lock_shared_for(ms, acceptor, disolver);
    }

    public unlock_shared(name: string, acceptor: WebAcceptor<any, any>): Promise<void>
    {
        return this.dict_.get(name).unlock_shared(acceptor);
    }
}