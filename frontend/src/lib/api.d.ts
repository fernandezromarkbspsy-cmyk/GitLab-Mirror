export declare class ApiError extends Error {
    readonly status: number;
    constructor(message: string, status: number);
}
export declare function api<T = unknown>(path: string, init?: RequestInit): Promise<T>;
