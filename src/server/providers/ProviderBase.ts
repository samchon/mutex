/**
 * @packageDocumentation
 * @module msv
 */
//-----------------------------------------------------------
import { WebAcceptor } from "tgrid/protocols/web/WebAcceptor";
import { HashSet } from "tstl/container/HashSet";
import { List } from "tstl/container/List";
import { OutOfRange } from "tstl/exception/OutOfRange";

import { Joiner } from "../components/internal/Joiner";
import { GlobalBase } from "../global/GlobalBase";

/**
 * @internal
 */
export abstract class ProviderBase<
    GlobalT extends GlobalBase<any, Param, Ret>,
    Param,
    Ret,
> {
    protected readonly global_: GlobalT;
    protected readonly acceptor_: WebAcceptor<any, any>;
    private readonly disolvers_: List<Joiner>;

    private readonly names_: HashSet<string>;
    private readonly remote_name_: string;

    /* ---------------------------------------------------------
        CONSTRUCTORS
    --------------------------------------------------------- */
    public constructor(
        global: GlobalT,
        acceptor: WebAcceptor<any, any>,
        disolvers: List<Joiner>,
        remoteName: string,
    ) {
        this.global_ = global;
        this.acceptor_ = acceptor;
        this.disolvers_ = disolvers;

        this.names_ = new HashSet();
        this.remote_name_ = remoteName;
    }

    public destructor(): void {
        for (const name of this.names_) this.erase(name);
    }

    protected createDisolver(): List.Iterator<Joiner> {
        return this.disolvers_.insert(this.disolvers_.end(), undefined);
    }

    /* ---------------------------------------------------------
        ACCESSORS
    --------------------------------------------------------- */
    public emplace(name: string, param: Param): Ret {
        this.names_.insert(name);
        return this.global_.emplace(name, param, this.acceptor_);
    }

    public erase(name: string): void {
        this.names_.erase(name);
        this.global_.erase(name, this.acceptor_);
    }

    public get(
        name: string,
    ): GlobalT extends GlobalBase<infer ComponentT, Param, Ret>
        ? ComponentT
        : unknown {
        if (this.names_.has(name) === false)
            throw new OutOfRange(
                `Error on ${this.remote_name_}: you've already erased the component.`,
            );

        return this.global_.get(name);
    }
}
