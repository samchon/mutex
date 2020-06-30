import { HashMap } from "tstl/container/HashMap";
import { WebAcceptor } from "tgrid/protocols/web/WebAcceptor";

import { IComponent } from "../components/IComponent";

export abstract class GlobalBase<ComponentT extends IComponent, Param, Ret>
{
    private dict_: HashMap<string, ComponentT> = new HashMap();

    /* ---------------------------------------------------------
        CONSTRUCTORS
    --------------------------------------------------------- */
    protected abstract _Create_component(param: Param): ComponentT;
    protected abstract _Returns(component: ComponentT): Ret;

    public emplace(name: string, param: Param, acceptor: WebAcceptor<any, any>): Ret
    {
        let it: HashMap.Iterator<string, ComponentT> = this.dict_.find(name);
        if (it.equals(this.dict_.end()) === true)
            it = this.dict_.emplace(name, this._Create_component(param)).first;
        it.second._Insert_acceptor(acceptor);

        return this._Returns(it.second);
    }

    public erase(name: string, acceptor: WebAcceptor<any, any>): void
    {
        if (this.dict_.get(name)._Erase_acceptor(acceptor) === true)
            this.dict_.erase(name);
    }

    /* ---------------------------------------------------------
        ACCESSORS
    --------------------------------------------------------- */
    public get(name: string): ComponentT
    {
        return this.dict_.get(name);
    }
}