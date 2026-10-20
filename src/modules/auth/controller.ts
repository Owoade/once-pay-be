import ServiceDecorator from "@decorators/index";
import { Response, Request } from "express";
import {
    signup_validator,
    signin_validator,
    forgot_password_validator,
    reset_password_validator
} from "@validators/auth";
import auth_service from "./service";
import respond from "@utils/respond";

export class AuthController {
    constructor(){}

    @ServiceDecorator.forRequestPayloadValidation(signup_validator)
    async sign_up(request: Request, response: Response) {
        const payload = request.body;
        const { error, data } = await auth_service.sign_up(payload);

        if (error) {
            return respond(response, {
                status_code: error.code,
                message: error.message,
                data: null,
                status: 'error'
            });
        }

        return respond(response, {
            status_code: 200,
            message: 'Sign up successful',
            data,
            status: 'success'
        });
    }

    @ServiceDecorator.forRequestPayloadValidation(signin_validator)
    async sign_in(request: Request, response: Response) {
        const payload = request.body;
        const { error, data } = await auth_service.login(payload);

        if (error) {
            return respond(response, {
                status_code: error.code,
                message: error.message,
                data: null,
                status: 'error'
            });
        }

        return respond(response, {
            status_code: 200,
            message: 'Sign in successful',
            data,
            status: 'success'
        });
    }

    @ServiceDecorator.forRequestPayloadValidation(forgot_password_validator)
    async forgot_password(request: Request, response: Response) {
        const payload = request.body;
        const { error, data } = await auth_service.forgot_password(payload.email);

        if (error) {
            return respond(response, {
                status_code: error.code,
                message: error.message,
                data: null,
                status: 'error'
            });
        }

        return respond(response, {
            status_code: 200,
            message: data?.message || 'Forgot password request sent',
            data,
            status: 'success'
        });
    }

    @ServiceDecorator.forRequestPayloadValidation(reset_password_validator)
    async reset_password(request: Request, response: Response) {
        const payload = request.body;
        const { error, data } = await auth_service.change_password(payload);

        if (error) {
            return respond(response, {
                status_code: error.code,
                message: error.message,
                data: null,
                status: 'error'
            });
        }

        return respond(response, {
            status_code: 200,
            message: 'Password reset successful',
            data,
            status: 'success'
        });
    }

    async get_google_auth_url(request: Request, response: Response) {
        const { error, data } = await auth_service.get_google_auth_url();

        if (error) {
            return respond(response, {
                status_code: error.code,
                message: error.message,
                data: null,
                status: 'error'
            });
        }

        return respond(response, {
            status_code: 200,
            message: 'Google Auth URL generated',
            data,
            status: 'success'
        });
    }

    async verify_google_auth(request: Request, response: Response) {
        const { code } = request.query;

        if (!code) {
            return respond(response, {
                status_code: 400,
                message: 'Authorization code is missing',
                data: null,
                status: 'error'
            });
        }

        const { error, data } = await auth_service.verify_google_auth(code as string);

        if (error) {
            return respond(response, {
                status_code: error.code,
                message: error.message,
                data: null,
                status: 'error'
            });
        }

        return respond(response, {
            status_code: 200,
            message: 'Google authentication successful',
            data,
            status: 'success'
        });
    }

    async verify_session(request: Request, response: Response) {
        const { session } = request.query;

        if (!session || typeof session !== 'string') {
            return respond(response, {
                status_code: 400,
                message: 'Session token is missing',
                data: null,
                status: 'error'
            });
        }

        const { error, data } = await auth_service.verify_session(session);

        if (error) {
            return respond(response, {
                status_code: error.code,
                message: error.message,
                data: null,
                status: 'error'
            });
        }

        return respond(response, {
            status_code: 200,
            message: 'Session verified',
            data,
            status: 'success'
        });
    }

    async verify_otp(request: Request, response: Response) {
        const { otp } = request.body;

        if (!otp) {
            return respond(response, {
                status_code: 400,
                message: 'OTP is missing',
                data: null,
                status: 'error'
            });
        }

        const { error, data } = await auth_service.verify_otp(otp);

        if (error) {
            return respond(response, {
                status_code: error.code,
                message: error.message,
                data: null,
                status: 'error'
            });
        }

        return respond(response, {
            status_code: 200,
            message: 'OTP verified successfully',
            data,
            status: 'success'
        });
    }
}

export const auth_controller = new AuthController();
