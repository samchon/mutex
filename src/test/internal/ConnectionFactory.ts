import { MutexConnector } from "../../MutexConnector";
import { IActivation } from "./IActivation";

export interface ConnectionFactory
{
    (): Promise<MutexConnector<IActivation, null>>;
}