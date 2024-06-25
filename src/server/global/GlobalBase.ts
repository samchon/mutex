import { WebSocketAcceptor } from "tgrid";
import { HashMap } from "tstl";

import { IComponent } from "../components/IComponent";
import { ProviderGroup } from "../ProviderGroup";

/**
 * @internal
 */
export abstract class GlobalBase<ComponentT extends IComponent, Param, Ret> {
  private dict_: HashMap<string, ComponentT> = new HashMap();

  /* ---------------------------------------------------------
        CONSTRUCTORS
    --------------------------------------------------------- */
  protected abstract _Create_component(param: Param): ComponentT;
  protected abstract _Returns(component: ComponentT): Ret;

  public emplace(
    name: string,
    param: Param,
    acceptor: WebSocketAcceptor<any, ProviderGroup, null>,
  ): Ret {
    // eslint-disable-next-line
    const component: ComponentT = this.dict_.take(name, () =>
      this._Create_component(param),
    );
    component._Insert_acceptor(acceptor);
    return this._Returns(component);
  }

  public erase(
    name: string,
    acceptor: WebSocketAcceptor<any, ProviderGroup, null>,
  ): void {
    if (this.dict_.get(name)._Erase_acceptor(acceptor) === true)
      this.dict_.erase(name);
  }

  /* ---------------------------------------------------------
        ACCESSORS
    --------------------------------------------------------- */
  public get(name: string): ComponentT {
    return this.dict_.get(name);
  }
}
