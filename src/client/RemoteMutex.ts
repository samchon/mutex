/**
 * @packageDocumentation
 * @module mutex
 */
//-----------------------------------------------------------
import { ISharedTimedLockable } from "tstl/base/thread/ISharedTimedLockable";

import { Driver } from "tgrid/components/Driver";
import { MutexesProvider } from "../server/providers/MutexesProvider";

/**
 * Remote Mutex.
 * 
 * @author Jeongho Nam - https://github.com/samchon
 */
export class RemoteMutex implements ISharedTimedLockable
{
    /**
     * @hidden
     */
    private controller_: Driver.Promisive<MutexesProvider>;

    /**
     * @hidden
     */
    private name_: string;

    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    /**
     * @hidden
     */
    private constructor(controller: Driver.Promisive<MutexesProvider>, name: string)
    {
        this.controller_ = controller;
        this.name_ = name;
    }

    /**
     * @internal
     */
    public static async create
        (
            controller: Driver.Promisive<MutexesProvider>, 
            name: string
        ): Promise<RemoteMutex>
    {
        await controller.emplace(name, undefined);
        return new RemoteMutex(controller, name);
    }

    /* -----------------------------------------------------------
        WRITE LOCK
    ----------------------------------------------------------- */
    /**
     * Write locks the mutex.
     *
     * Monopolies a mutex until be {@link unlock unlocked}. If there're someone who have already
     * {@link lock monopolied} or {@link lock_shared shared} the mutex, the function call would
     * be blocked until all of them to return their acquistions by calling {@link unlock} or
     * {@link unlock_shared} methods.
     *
     * In same reason, if you don't call the {@link unlock} function after your business, the
     * others who want to {@link lock monopoly} or {@link lock_shared share} the mutex would be
     * fall into the forever sleep. Therefore, never forget to calling the {@link unlock} function
     * or utilize the {@link UniqueLock.lock} function instead to ensure the safety.
     */
    public lock(): Promise<void>
    {
        return this.controller_.lock(this.name_);
    }
 
    /**
     * Tries to write lock the mutex.
     *
     * Attempts to monopoly a mutex without blocking. If succeeded to monopoly the mutex
     * immediately, it returns `true` directly. Otherwise there's someone who has already
     * {@link lock monopolied} or {@link lock_shared shared} the mutex, the function gives up the
     * trial immediately and returns `false` directly.
     *
     * Note that, if you succeeded to monopoly the mutex (returns `true`) but do not call the
     * {@link unlock} function after your business, the others who want to {@link lock monopoly}
     * or {@link lock_shared share} the mutex would be fall into the forever sleep. Therefore,
     * never forget to calling the {@link unlock} function or utilize the
     * {@link UniqueLock.try_lock} function instead to ensure the safety.
     *
     * @return Whether succeeded to monopoly the mutex or not.
     */
    public try_lock(): Promise<boolean>
    {
        return this.controller_.try_lock(this.name_);
    }

    /**
     * Tries to write lock the mutex until timeout.
     *
     * Attempts to monopoly a mutex until timeout. If succeeded to monopoly the mutex until the
     * timeout, it returns `true`. Otherwise failed to acquiring the lock in the given time, the
     * function gives up the trial and returns `false`.
     *
     * Failed to acquiring the lock in the given time (returns `false`), it means that there's
     * someone who has already {@link lock monopolied} or {@link lock_shared shared} the mutex and
     * does not return it over the timeout.
     *
     * Note that, if you succeeded to monopoly the mutex (returns `true`) but do not call the
     * {@link unlock} function after your business, the others who want to {@link lock monopoly}
     * or {@link lock_shared share} the mutex would be fall into the forever sleep. Therefore,
     * never forget to calling the {@link unlock} function or utilize the
     * {@link UniqueLock.try_lock_for} function instead to ensure the safety.
     *
     * @param ms The maximum miliseconds for waiting.
     * @return Whether succeeded to monopoly the mutex or not.
     */
    public try_lock_for(ms: number): Promise<boolean>
    {
        return this.controller_.try_lock_for(this.name_, ms);
    }

    /**
     * Tries to write lock the mutex until time expiration.
     *
     * Attemps to monopoly a mutex until time expiration. If succeeded to monopoly the mutex
     * until the time expiration, it returns `true`. Otherwise failed to acquiring the lock in the
     * given time, the function gives up the trial and returns `false`.
     *
     * Failed to acquiring the lock in the given time (returns `false`), it means that there's
     * someone who has already {@link lock monopolied} or {@link lock_shared shared} the mutex and
     * does not return it over the time expiration.
     *
     * Note that, if you succeeded to monopoly the mutex (returns `true`) but do not call the
     * {@link unlock} function after your business, the others who want to {@link lock monopoly}
     * or {@link lock_shared share} the mutex would be fall into the forever sleep. Therefore,
     * never forget to calling the {@link unlock} function or utilize the
     * {@link UniqueLock.try_lock_until} function instead to ensure the safety.
     *
     * @param at The maximum time point to wait.
     * @return Whether succeeded to monopoly the mutex or not.
     */
    public async try_lock_until(at: Date): Promise<boolean>
    {
        let ms: number = at.getTime() - Date.now();
        return await this.try_lock_for(ms);
    }

    /**
     * Write unlocks the mutex.
     *
     * When you call this {@link unlock} method and there're someone who are currently blocked by
     * attempting to {@link lock write} or {@link lock_shared read} lock this mutex, one of them
     * (FIFO; first-in-first-out) would acquire the lock and continues its execution.
     *
     * Otherwise, there's not anyone who is acquiring the {@link lock write lock} of this mutex,
     * the {@link DomainError} exception would be thrown.
     *
     * > As you know, when you succeeded to acquire the `write lock`, you don't have to forget to
     * > calling this {@link unlock} method after your business. If you forget it, it would be a
     * > terrible situation for the others who're attempting to lock this mutex.
     * >
     * > However, if you utilize the {@link UniqueLock}, you don't need to consider about this
     * > {@link unlock} method. Just define your business into a callback function as a parameter
     * > of methods of the {@link UniqueLock}, then this {@link unlock} method would be
     * > automatically called by the {@link UniqueLock} after the business.
     *
     * @throw {@link DomainError} when no one is acquiring the {@link lock write lock}.
     */
    public unlock(): Promise<void>
    {
        return this.controller_.unlock(this.name_);
    }

    /* -----------------------------------------------------------
        READ LOCK
    ----------------------------------------------------------- */
    /**
     * Read locks the mutex.
     *
     * Shares a mutex until be {@link unlock_shared unlocked}. If there're someone who have
     * already {@link lock monopolied} the mutex, the function call would be blocked until all of
     * them to {@link unlock return} their acquisitions.
     *
     * In same reason, if you don't call the {@link unlock_shared} function after your business,
     * the others who want to {@link lock monopoly} the mutex would be fall into the forever
     * sleep. Therefore, never forget to calling the {@link unlock_shared} or utilize the
     * {@link SharedLock.lock} function instead to ensure the safety.
     */
    public lock_shared(): Promise<void>
    {
        return this.controller_.lock_shared(this.name_);
    }
    
    /**
     * Tries to read lock the mutex.
     *
     * Attemps to share a mutex without blocking. If succeeded to share the mutex immediately, it
     * returns `true` directly. Otherwise there's someone who has already {@link lock monopolied}
     * the mutex, the function gives up the trial immediately and returns `false` directly.
     *
     * Note that, if you succeeded to share the mutex (returns `true`) but do not call the
     * {@link unlock_shared} function after your buinsess, the others who want to
     * {@link lock monopoly} the mutex would be fall into the forever sleep. Therefore, never
     * forget to calling the {@link unlock_shared} function or utilize the
     * {@link SharedLock.try_lock} function instead to ensure the safety.
     *
     * @return Whether succeeded to share the mutex or not.
     */
    public try_lock_shared(): Promise<boolean>
    {
        return this.controller_.try_lock_shared(this.name_);
    }

    /**
     * Tries to read lock the mutex until timeout.
     *
     * Attemps to share a mutex until timeout. If succeeded to share the mutex until timeout, it
     * returns `true`. Otherwise failed to acquiring the shared lock in the given time, the
     * function gives up the trial and returns `false`.
     *
     * Failed to acquring the shared lock in the given time (returns `false`), it means that
     * there's someone who has already {@link lock monopolied} the mutex and does not return it
     * over the timeout.
     *
     * Note that, if you succeeded to share the mutex (returns `true`) but do not call the
     * {@link unlock_shared} function after your buinsess, the others who want to
     * {@link lock monopoly} the mutex would be fall into the forever sleep. Therefore, never
     * forget to calling the {@link unlock_shared} function or utilize the
     * {@link SharedLock.try_lock_for} function instead to ensure the safety.
     *
     * @param ms The maximum miliseconds for waiting.
     * @return Whether succeeded to share the mutex or not.
     */
    public try_lock_shared_for(ms: number): Promise<boolean>
    {
        return this.controller_.try_lock_shared_for(this.name_, ms);
    }

    /**
     * Tries to read lock the mutex until time expiration.
     *
     * Attemps to share a mutex until time expiration. If succeeded to share the mutex until time
     * expiration, it returns `true`. Otherwise failed to acquiring the shared lock in the given
     * time, the function gives up the trial and returns `false`.
     *
     * Failed to acquring the shared lock in the given time (returns `false`), it means that
     * there's someone who has already {@link lock monopolied} the mutex and does not return it
     * over the time expiration.
     *
     * Note that, if you succeeded to share the mutex (returns `true`) but do not call the
     * {@link unlock_shared} function after your buinsess, the others who want to
     * {@link lock monopoly} the mutex would be fall into the forever sleep. Therefore, never
     * forget to calling the {@link unlock_shared} function or utilize the
     * {@link SharedLock.try_lock_until} function instead to ensure the safety.
     *
     * @param at The maximum time point to wait.
     * @return Whether succeeded to share the mutex or not.
     */
    public async try_lock_shared_until(at: Date): Promise<boolean>
    {
        let ms: number = at.getTime() - Date.now();
        return await this.try_lock_shared_for(ms);
    }

    /**
     * Read unlocks the mutex.
     *
     * When you call this {@link unlock_shared} method and there're someone who are currently
     * blocked by attempting to {@link lock monopoly} this mutex, one of them
     * (FIFO; first-in-first-out) would acquire the lock and continues its execution.
     *
     * Otherwise, there's not anyone who is acquiring the {@link lock_shared read lock} of this
     * mutex, the {@link DomainError} exception would be thrown.
     *
     * > As you know, when you succeeded to acquire the `read lock`, you don't have to forget to
     * > calling this {@link unlock_shared} method after your business. If you forget it, it would
     * > be a terrible situation for the others who're attempting to lock this mutex.
     * >
     * > However, if you utilize the {@link SharedLock}, you don't need to consider about this
     * > {@link unlock_shared} method. Just define your business into a callback function as a
     * > parameter of methods of the {@link SharedLock}, then this {@link unlock_shared} method
     * > would be automatically called by the {@link SharedLock} after the business.
     */
    public unlock_shared(): Promise<void>
    {
        return this.controller_.unlock_shared(this.name_);
    }
}