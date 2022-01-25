/*
This library simplify API calls to AWS API GATEWAY to retrieve backblaze2 config
and backblaze2 to get files and presignedUrl.
It should only be used after user sign in.
*/
import { Auth } from 'aws-amplify';
import {S3Client, paginateListObjectsV2, GetObjectCommand, DeleteObjectCommand} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ApiGatewayEndpoint = 'https://6qo3knto43.execute-api.us-west-2.amazonaws.com/prod/';
let client: S3Client;

async function GetAuthHeader(): Promise<{ Authorization: string }> {
    let session = await Auth.currentSession();
    let idToken = session.getIdToken().getJwtToken();
    return {Authorization:idToken};
}

async function PaginateListFiles(path: string) {
    // Deprecated code
    // let result = await fetch(`${ApiGatewayEndpoint}`, {method:'GET', headers: await GetAuthHeader()}).then(res => res.json());
    return paginateListObjectsV2({ client }, { Bucket: "naraku", Prefix: path });
}

async function GetSignedUrl(key: string) {
    let command = new GetObjectCommand({Bucket:'naraku', Key:key});
    let url = await getSignedUrl(client, command, { expiresIn: 7200 });
    return url;
}

async function DeleteFile(key: string) {
    let command = new DeleteObjectCommand({Bucket:'naraku', Key:key});
    await client.send(command);
}

async function GetConfigAndInit() {
    let result = await fetch(`${ApiGatewayEndpoint}/config`, {method:'GET', headers: await GetAuthHeader()}).then(res => res.json());
    client = new S3Client(result);
}

export { PaginateListFiles, GetSignedUrl, GetConfigAndInit, DeleteFile };