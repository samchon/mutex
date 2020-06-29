/**
 * @packageDocumentation
 * @module mutex
 */
//-----------------------------------------------------------
import { WebAcceptor } from "tgrid/protocols/web/WebAcceptor";
import { List } from "tstl/container/List";
import { Joiner } from "../components/internal/Joiner";

/**
 * @internal
 */
export abstract class ProviderBase<GlobalComponents extends object>
{
    protected readonly global_: GlobalComponents;
    protected readonly acceptor_: WebAcceptor<any, any>;
    protected readonly disolvers_: List<Joiner>;

    public constructor(global: GlobalComponents, acceptor: WebAcceptor<any, any>, disolvers: List<Joiner>)
    {
        this.global_ = global;
        this.acceptor_ = acceptor;
        this.disolvers_ = disolvers;
    }

    protected createDisolver(): List.Iterator<Joiner>
    {
        return this.disolvers_.insert(this.disolvers_.end(), undefined);
    }
}