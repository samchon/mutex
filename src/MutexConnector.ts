import { Driver } from "tgrid/components/Driver";
import { SharedTimedMutex } from "tstl/thread/SharedTimedMutex";
import { WebConnector } from "tgrid/protocols/web/WebConnector";

import { MutexProvider } from "./internal/MutexProvider";

export class MutexConnector
{
    private connector_: WebConnector<MutexProvider> = new WebConnector();

    public async connect(url: string): Promise<void>
    {
        await this.connector_.connect(url);
    }

    public async close(): Promise<void>
    {
        await this.connector_.close();
    }

    public getMutex(name: string): SharedTimedMutex
    {
        let controller: Driver<MutexProvider> = this.connector_.getDriver();

        return <SharedTimedMutex>{
            // WRITE
            lock: () => controller.lock(name),
            try_lock: () => controller.try_lock(name),
            try_lock_for: ms => controller.try_lock_for(name, ms),
            try_lock_until: at => controller.try_lock_until(name, at),
            unlock: () => controller.unlock(name),

            // READ
            lock_shared: () => controller.lock_shared(name),
            try_lock_shared: () => controller.try_lock_shared(name),
            try_lock_shared_for: ms => controller.try_lock_shared_for(name, ms),
            try_lock_shared_until: at => controller.try_lock_shared_until(name, at),
            unlock_shared: () => controller.unlock_shared(name),
        };
    }
}