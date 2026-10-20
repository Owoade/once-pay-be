import customer_repo from "./repo.js";
import { CustomerInterface } from "./type.js";

class CustomerService {
    constructor() {}

    async get_customer(payload: Pick<CustomerInterface, "email" | "merchant_id">){

        const { email, merchant_id } = payload;
        const existing_customer = await customer_repo.find({email, merchant_id});

        if(existing_customer)
            return existing_customer;

        const new_customer = await customer_repo.create({email, merchant_id});
        return new_customer;

    }
}  

const customer_service = new CustomerService();
export default customer_service;