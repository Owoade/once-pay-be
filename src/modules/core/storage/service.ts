import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import s3_client from "./client";
import { R2_BUCKET_NAME } from "src/env";

class StorageService {
    constructor() {}

    async delete_file( key: string ){

        const command = new DeleteObjectCommand({
            Key: key,
            Bucket: R2_BUCKET_NAME
        })

        await s3_client.send( command );
        
    }

    async save_file( buffer: Buffer, file_name: string, content_type: string ): Promise<void> {

        console.log({
            buffer,
            file_name
        })

        const params = {
            Bucket: R2_BUCKET_NAME,
            Body: buffer,
            Key: file_name,
            ContentType: content_type,
        };

        const command = new PutObjectCommand(params);

        await s3_client.send(command);
        
    }
}

const storage_service = new StorageService();

export default storage_service;