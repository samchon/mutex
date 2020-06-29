/**
 * @packageDocumentation
 * @module mutex
 */
//-----------------------------------------------------------
import { WebAcceptor } from "tgrid/protocols/web/WebAcceptor";
import { List } from "tstl/container/List";
import { Joiner } from "../components/internal/Joiner";

import { GlobalGroup } from "../global/GlobalGroup";
import { MutexesProvider } from "./MutexesProvider";

/**
 * @internal
 */
export class ProviderGroup
{
    private readonly disolvers_: List<Joiner>;

    public readonly mutexes: MutexesProvider;
    
    public constructor(group: GlobalGroup, acceptor: WebAcceptor<any, any>)
    {
        this.disolvers_ = new List();
        this.mutexes = new MutexesProvider(group.mutexes, acceptor, this.disolvers_);
    }

    public async destructor(): Promise<void>
    {
        for (let joiner of this.disolvers_)
            if (joiner)
                await joiner();
    }
}