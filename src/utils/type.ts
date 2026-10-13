export interface ServiceMethodReturnType <T> {
    error?: {
        code: number,
        message: string,
    };
    data?: T;
}