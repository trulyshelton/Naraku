/*
This library simplify API calls to AWS API GATEWAY to retrieve file list and presigned uri.
It should only be used after user sign in.
*/
import { Auth } from 'aws-amplify';

const ApiGatewayEndpoint = 'https://6qo3knto43.execute-api.us-west-2.amazonaws.com/prod/';

async function GetAuthHeader(): Promise<{ Authorization: string }> {
    let session = await Auth.currentSession();
    let idToken = session.getIdToken().getJwtToken();
    return {Authorization:idToken};
}

async function ListFiles() {
    let result = await fetch(`${ApiGatewayEndpoint}`, {method:'GET', headers: await GetAuthHeader()}).then(res => res.json());
    return result;
}

async function GetSignedUrl(key: string) {
    let result = await fetch(`${ApiGatewayEndpoint}/${encodeURI(key)}`, {method:'GET', headers: await GetAuthHeader()}).then(res => res.json());
    return result;
}

export { ListFiles, GetSignedUrl };