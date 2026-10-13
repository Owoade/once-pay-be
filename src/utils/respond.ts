import { Response } from "express";
import moment from "moment";

export default function respond( res: Response, config: IConfig ){

    const { message, data, status, status_code } = config
    res.status( status_code )
    res.json({
        status,
        message: message ?? "Operation successsfull",
        data,
        current_time: moment().toISOString()
    })
}

interface IConfig {
    status_code: number,
    data?: any,
    message?: string,
    status: "success" | "error"
}