import { MutexConnector } from "mutex-server";

import { IActivation } from "./IActivation";

export interface ConnectionFactory {
  (): Promise<MutexConnector<IActivation>>;
}
