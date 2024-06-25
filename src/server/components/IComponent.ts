import { WebSocketAcceptor } from "tgrid";
import { ProviderGroup } from "../ProviderGroup";

/**
 * @internal
 */
export interface IComponent {
  _Insert_acceptor(acceptor: WebSocketAcceptor<any, ProviderGroup, null>): void;
  _Erase_acceptor(
    acceptor: WebSocketAcceptor<any, ProviderGroup, null>,
  ): boolean;
}
