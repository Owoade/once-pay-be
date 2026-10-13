export default interface MerchantModelInterface {
    id: number;
    name: string;
    email: string;
    password?: string;
    auth_channel?: string;
    api_key: string;
    api_key_id: string;
    createdAt: string;
    updatedAt: string;
}

export interface ApiKeyInterface {
    id: number;
    merchant_id: number;
    key_id: string;
    key: string;
    createdAt?: Date;
    updatedAt?: Date;
}
