import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import axios from 'axios';
import merchant_repo from '@modules/merchant/repo.js';
import cache_repo from '@modules/core/cache/repo.js';
import MerchantModelInterface from '@modules/merchant/type';
import { ServiceMethodReturnType } from '@utils/type';
import { email_service } from '@modules/core/email/plunk';
import { ChangePassword } from './type';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, JWT_SECRET, SSO_PASSWORD } from 'src/env';
import merchant_service from '@modules/merchant/service';
import db from '@db/index';
import { Transaction } from 'sequelize';

dotenv.config();

class AuthService {
    constructor(){}

    async sign_up(payload: Pick<MerchantModelInterface, 'name' | 'email' | 'password'>)
    : Promise<ServiceMethodReturnType<{ message: string }>>
    {
        const { email } = payload;

        const existing_merchant = await merchant_repo.find({ email }, ['id']);
        if (existing_merchant) return { error: { code: 400, message: 'Email already registered' } };

        const salt_rounds = 10;
        const hashed_password = await bcrypt.hash(payload.password!, salt_rounds);

        const cached_payload = {
            ...payload,
            password: hashed_password
        };

        const otp = this.generate_otp();
        await this.save_otp(otp, cached_payload);

        await email_service.send_email(
            email,
            'Verify your account',
            `Your verification code is: ${otp}`
        );

        return {
            data: { message: `OTP has been sent to ${email}` }
        };
    }

    async verify_otp(otp: string)
    : Promise<ServiceMethodReturnType<{ message: string }>>
    {
        const payload = await cache_repo.get(otp);
        if (!payload) return { error: { code: 400, message: 'Invalid or expired OTP' } };

        let merchant: MerchantModelInterface;

        try {
            merchant = JSON.parse(payload);
        } catch (error: any) {
            return { error: { code: 400, message: 'Invalid OTP payload' } };
        }
        merchant.auth_channel = "email-password";
        
        const transaction = await db.transaction();

        try {
            const new_merchant = await merchant_repo.create(merchant, transaction);
            
            cache_repo.delete(otp);
            await merchant_service.generate_api_key(new_merchant.id, transaction);
            await transaction.commit();

            return { data: { message: 'OTP verified successfully' } };
        }
        catch(e){
            console.error(e)
            await transaction.rollback();
            return { error: { code: 500, message: 'Failed to verify OTP' } };
        }

    }

    async login(payload: Pick<MerchantModelInterface, 'email' | 'password'>)
    : Promise<ServiceMethodReturnType<{ name: string, token: string }>>
    {
        const { email, password } = payload;
        const merchant = await merchant_repo.find({ email });

        if (!merchant) return { error: { code: 404, message: 'User not found' } };

        const is_match = await bcrypt.compare(password!, (merchant as any).password);
        if (!is_match) return { error: { code: 401, message: 'Invalid credentials' } };

        const token = jwt.sign({ id: (merchant as any).id }, JWT_SECRET, { expiresIn: '7d' });
        return { data: { name: (merchant as any).name, token } };
    }

    async forgot_password(email: string)
    : Promise<ServiceMethodReturnType<{ message: string }>>
    {
        const merchant = await merchant_repo.find({ email });
        if (!merchant) return { error: { code: 404, message: 'Email not found' } };

        const otp = this.generate_otp();
        await this.save_otp(otp, { email, purpose: 'FORGOT_PASSWORD' });

        await email_service.send_email(
            email,
            'Password Reset Code',
            `Your verification code is: ${otp}`
        );

        return { data: { message: 'Reset code sent to email' } };
    }

    async change_password(payload: ChangePassword)
    : Promise<ServiceMethodReturnType<{ message: string }>>
    {
        const { password, otp } = payload;
        const cached_payload = await cache_repo.get(otp);
        if (!cached_payload) return { error: { code: 400, message: 'Invalid or expired OTP' } };

        let merchant: MerchantModelInterface;
        try {
            merchant = JSON.parse(cached_payload);
        } catch (error: any) {
            return { error: { code: 400, message: 'Invalid OTP payload' } };
        }

        const existing_merchant = await merchant_repo.find({ email: merchant.email }, ['id']);
        if (!existing_merchant) return { error: { code: 404, message: 'User not found' } };

        const new_password = await bcrypt.hash(password, 10);
        await merchant_repo.update({ id: existing_merchant.id }, { password: new_password });
        await cache_repo.delete(otp);

        return { data: { message: 'Password changed successfully' } };
    }

    verify_token(token: string): any {
        try {
            return jwt.verify(token, JWT_SECRET!);
        } catch {
            return null;
        }
    }

    async get_google_auth_url(): Promise<ServiceMethodReturnType<{ url: string }>> {
        const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
        const options = {
            redirect_uri: GOOGLE_REDIRECT_URI || '',
            client_id: GOOGLE_CLIENT_ID || '',
            access_type: 'offline',
            response_type: 'code',
            prompt: 'consent',
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email',
            ].join(' '),
        };

        const qs = new URLSearchParams(options).toString();
        return { data: { url: `${rootUrl}?${qs}` } };
    }

    async verify_google_auth(code: string): Promise<ServiceMethodReturnType<{ token: string, name: string }>> {
        let transaction: Transaction | null = null
        try {
            const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
                code,
                client_id: GOOGLE_CLIENT_ID || '',
                client_secret: GOOGLE_CLIENT_SECRET || '',
                redirect_uri: GOOGLE_REDIRECT_URI || '',
                grant_type: 'authorization_code',
            });

            const { access_token } = tokenResponse.data;

            const userResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${access_token}` },
            });

            const googleUser = userResponse.data;
            const email = googleUser.email.toLowerCase();

            let merchant = await merchant_repo.find({ email });

            if (!merchant) {
                const hashed_sso_password = await bcrypt.hash(SSO_PASSWORD, 10);
                transaction = await db.transaction();
                
                merchant = await merchant_repo.create({
                    name: googleUser.name,
                    email: email,
                    password: hashed_sso_password,
                    auth_channel: 'google'
                } as any, transaction);

                await merchant_service.generate_api_key(merchant.id, transaction);
                await transaction.commit();
            }

            const token = jwt.sign({ id: (merchant as any).id }, JWT_SECRET!, { expiresIn: '7d' });
            return { data: { token, name: merchant.name } };

        } catch (error: any) {
            console.error(error);
            if (transaction) await transaction.rollback();
            return { error: { code: 500, message: error.message || 'Google Auth failed' } };
        }
    }

    private generate_otp() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    private async save_otp(otp: string, payload: any) {
        await cache_repo.set(otp, payload, 5);
    }
}

const auth_service = new AuthService();

export default auth_service;
