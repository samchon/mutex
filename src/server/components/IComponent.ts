/**
 * @packageDocumentation
 * @module msv
 */
//-----------------------------------------------------------
import { WebAcceptor } from "tgrid/protocols/web/WebAcceptor";

/**
 * @internal
 */
export interface IComponent
{
    _Insert_acceptor(acceptor: WebAcceptor<any, any>): void;
    _Erase_acceptor(acceptor: WebAcceptor<any, any>): boolean;
}