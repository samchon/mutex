/**
 * @packageDocumentation
 * @module msv
 */
//-----------------------------------------------------------
import { ProviderBase } from "./ProviderBase";
import { GlobalConditionVariablaes } from "../global/GlobalConditionVariables";

/**
 * @internal
 */
export class ConditionVariablesProvider extends ProviderBase<GlobalConditionVariablaes, undefined, void>
{
    public wait(name: string): Promise<void>
    {
        return this.get(name).wait(this.acceptor_, this.createDisolver());
    }

    public wait_for(name: string, ms: number): Promise<boolean>
    {
        return this.get(name).wait_for(ms, this.acceptor_, this.createDisolver());
    }

    public notify_one(name: string): Promise<void>
    {
        return this.get(name).notify_one();
    }

    public notify_all(name: string): Promise<void>
    {
        return this.get(name).notify_all();
    }
}