/**
 * @packageDocumentation
 * @module mutex
 */
//-----------------------------------------------------------
import { WebConnector } from "tgrid/protocols/web/WebConnector";
import { Driver } from "tgrid/components/Driver";
import { ProviderGroup } from "./server/providers/ProviderGroup";

import { RemoteMutex } from "./client/RemoteMutex";

/**
 * Mutex server connector for client.
 * 
 * @type Header Type of the *header* who containing the activation info.
 * @author Jeongho Nam - https://github.com/samchon
 */
export class MutexConnector<Header extends object>
{
    /**
     * @hidden
     */
    private connector_: WebConnector<Header, null>;

    /**
     * @hidden
     */
    private controller_: Driver<ProviderGroup>;

    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    /**
     * Initializer Constructor.
     * 
     * @param header Additional data for the activation.
     */
    public constructor(header: Header)
    {
        this.connector_ = new WebConnector(header, null);
        this.controller_ = this.connector_.getDriver();
    }

    /**
     * Connect to a remote `mutex-server`.
     * 
     * Try connection to the remote `mutex-server` with its *address* and waiting for the server
     * to accept the trial through the *headers*. If the `mutex-server` rejects your connection,
     * then exception would be thrown.
     * 
     * After the connection and your business (using remote critical sections) has been 
     * completed, please don't forget closing the connection in time to prevent waste of the 
     * server resource.
     * 
     * @param url URL address to connect.
     * @param headers Additional data for the activation.
     */
    public connect(url: string): Promise<void>
    {
        return this.connector_.connect(url);
    }

    /**
     * Close connection.
     * 
     * Close connection with the remote `mutex-server`.
     */
    public async close(): Promise<void>
    {
        await this.connector_.close();
    }

    /* -----------------------------------------------------------
        ACCESSORS
    ----------------------------------------------------------- */
    /**
     * Get server url.
     */
    public get url(): string | undefined
    {
        return this.connector_.url;
    }

    /**
     * Get connection state.
     */
    public get state(): WebConnector.State
    {
        return this.connector_.state;
    }

    /**
     * Get header.
     */
    public get header(): Header
    {
        return this.connector_.header;
    }

    /* -----------------------------------------------------------
        THREAD COMPONENTS
    ----------------------------------------------------------- */
    /**
     * Get remote mutex.
     * 
     * @param name An identifier name to be created or search for.
     * @return A {@link RemoteMutex} object.
     */
    public getMutex(name: string): Promise<RemoteMutex>
    {
        return RemoteMutex.create(this.controller_.mutexes, name);
    }
}