export default interface UserModelInterface {
    id: number;
    name: string;
    email: string;
    password?: string;
    auth_channel?: string;
    createdAt: string;
    updatedAt: string;
}