import type { RequestRedirect as NodeFetchRequestRedirect } from "node-fetch";
import type { RequestType } from "./const";

interface RetryInfo {
    /**
     * Number of unsuccessful attempts so far
     */
    count: number;
}

interface CacheInterface {
    get: (key: string) => Promise<string | undefined>;
    set: (key: string, value: string, expiresIn: number) => Promise<boolean>;
    delete: (key: string) => Promise<boolean>;
    clear: () => Promise<void>;
}

interface RequestInformation {
    method: string;
    url: string;
    body?: string;
    headers: object;
}

type AllPossibleResponses = unknown;

/* eslint-disable max-len */
/**
 * Function that determines **before the request is made** what cache key should be used when reading from/writing to
 * the cache store.
 *
 * If no key is returned then request won't use cache.
 *
 * By default, GET requests are allowed to use cache and the key is calculated by just the url.
 * **You probably don't want default behavior if you are dealing with any authentication, because the headers often
 * used for authentication is ignored**.
 *
 * @TODO suggestion about subpackage that contains nice function that uses `node-object-hash` (verify if works with browsers)
 */
type CacheKeyFn = (reqInfo: RequestInformation) => string;
/* eslint-enable max-len */

/**
 * Function that determines **after response is received** if the response should be cached and for how long.
 *
 * Note - if 0 is returned this is what your cache provider will get passed. It's up to you to know if this means
 * "no cache" (maybe even remove current cache) or "infinite cache". Return `undefined` to skip storing into the
 * cache.
 *
 * By default, only successful results (1xx, 2xx, 3xx response codes) are cached for 5 seconds. Keep in mind that first
 * **cacheKey** function must allow using the cache.
 */
type CachePolicyFn = (reqInfo: RequestInformation, response: AllPossibleResponses) => number | undefined;

interface Options {
    /**
     * Base path, prepended for each API call, usually something like: `https://api.service.com/v1/`
     */
    base?: string;
    /**
     * Expected data format returned from the server
     *
     * - json - will throw if not json response
     * - text - will return response as text
     * - binary - will return response as binary data (Buffer; loaded all at once into memory)
     * - stream - will return response as consumable stream
     */
    type?: RequestType;
    /**
     * How many times request should be retried on error, may be overriden with **retryPolicy**
     */
    retryCount?: number;
    /**
     * Time to wait between retries, can be overriden with **retryPolicy**
     */
    retryInterval?: number;
    /**
     * Function that will decide if request should be retried and how long to wait between retries
     * @param {RetryInfo} retryInfo - information about retries
     * @param {RequestInformation} reqInfo - request information
     * @param {AllPossibleResponses} response - response returned
     */
    retryPolicy?: (retryInfo: RetryInfo, reqInfo: RequestInformation, response: AllPossibleResponses) => number | false;
    /**
     * Timeout for requests in ms, after given time request will be aborted
     */
    timeout?: number;
    /**
     * Total timeout in which all, including retried requests should be fulfilled
     * (this includes wait time between, so timeout set to 100, retryInterval set to 200 and totalTimeout set to 350
     * means that single retry will only have 50ms to finish)
     */
    totalTimeout?: number;
    /**
     * Cache store provider in which requests will be stored and reused
     */
    cache?: CacheInterface | null;
    cacheKey?: CacheKeyFn;
    cachePolicy?: CachePolicyFn;
    fetchOptions?: {
        headers?: object;
        redirect?: NodeFetchRequestRedirect;
    };
    tamperRequest?: RequestTamperFunction;
    tamperResponse?: ResponseTamperFunction;
}

export type {
    Options,
};
