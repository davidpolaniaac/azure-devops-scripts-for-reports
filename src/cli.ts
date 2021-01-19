import * as vm from "azure-devops-node-api";
import * as lim from "azure-devops-node-api/interfaces/LocationsInterfaces";

function getEnv(name: string): string {
    let val = process.env[name];
    if (!val) {
        console.error(`${name} env var not set`);
        process.exit(1);
    }
    console.log("var : ", val);
    return val;
}

async function getApi(serverUrl: string): Promise<vm.WebApi> {
    return new Promise<vm.WebApi>(async (resolve, reject) => {
        try {
            let token = getEnv("API_TOKEN");
            let authHandler = vm.getPersonalAccessTokenHandler(token);
            let option = {
                socketTimeout: 2147483647,
                allowRetries: true
            };
            let vsts: vm.WebApi = new vm.WebApi(serverUrl, authHandler, option);
            let connData: lim.ConnectionData = await vsts.connect();
            console.log('Hello', connData.authenticatedUser?.providerDisplayName );
            resolve(vsts);
        }
        catch (err) {
            reject(err);
        }
    });
}

export async function getWebApi(serverUrl?: string): Promise<vm.WebApi> {
    serverUrl = serverUrl || getEnv("API_URL");
    return await getApi(serverUrl);
}

export function getProject(): string {
    return getEnv("API_PROJECT");
}