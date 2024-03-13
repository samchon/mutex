import { WebAcceptor } from "tgrid";

/**
 * @internal
 */
export interface IComponent {
  _Insert_acceptor(acceptor: WebAcceptor<any, any>): void;
  _Erase_acceptor(acceptor: WebAcceptor<any, any>): boolean;
}
