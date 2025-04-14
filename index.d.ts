export interface SingleLineLog {
    (...args: unknown): void;
    clear(): void;
}

export const stdout: SingleLineLog;
export const stderr: SingleLineLog;
