import * as cli from './cli';
import * as utils from './utils';
import { WebApi } from 'azure-devops-node-api';
import { ReleaseApi } from 'azure-devops-node-api/ReleaseApi';
import { Release, ReleaseDefinition } from 'azure-devops-node-api/interfaces/ReleaseInterfaces';

interface Result {
    TotalDefinitions: number,
    Releases: number
}

interface ReleaseCriteria {
    minCreatedTime: string,
    maxCreatedTime: string
}

async function run() {

    utils.heading("Start....")
    const project: string = cli.getProject();
    const webApi: WebApi = await cli.getWebApi(process.env.API_URL_VSRM);
    const releaseApi: ReleaseApi = await webApi.getReleaseApi();
    utils.banner('Configuration Release');
    const releaseDefinition: ReleaseDefinition[] = await releaseApi.getReleaseDefinitions(project, undefined, undefined, undefined, undefined, 100000);
    
    const searchCriteria2019: ReleaseCriteria = {
        minCreatedTime: "2019-01-01T00:01:00.007Z",
        maxCreatedTime: "2019-12-31T23:59:20.007Z"
    };

    utils.heading("2019");
    await validator(releaseDefinition, searchCriteria2019, project);

    const searchCriteria2020: any = {
        minCreatedTime: "2020-01-01T00:01:00.007Z",
        maxCreatedTime: "2020-12-31T23:59:20.007Z"
    };

    //utils.heading("2020");
    //await validator(releaseDefinition, searchCriteria2020, project);
}

async function validator(releaseDefinition: ReleaseDefinition[], searchCriteria: ReleaseCriteria, project: string) {

    let releaseByDefinitions: Array<Release[]> = new Array<Release[]>();
    const increase = 200;
    let start = 0;
    let end = increase;

    while (start < releaseDefinition.length) {

        const rateLimitsReleaseDefinition = releaseDefinition.slice(start, end);
        const releaseRequests: Promise<Release[]>[] = rateLimitsReleaseDefinition.map(definition =>
            utils.getRequestWithContinuationToken<Release>(`https://vsrm.dev.azure.com/${process.env.API_ORGANIZATION}/${project}/_apis/release/releases?definitionId=${definition.id}&statusFilter=active&continuationToken={continuationToken}&$top=100000&minCreatedTime=${searchCriteria.minCreatedTime}&maxCreatedTime=${searchCriteria.maxCreatedTime}&api-version=6.1-preview.4`,process.env.API_TOKEN as string ,0)
        );

        const temp: Array<Release[]> = await Promise.all(releaseRequests);
        releaseByDefinitions = releaseByDefinitions.concat(temp);

        start = end;
        end = ((end + increase) >= releaseDefinition.length) ? releaseDefinition.length : end + increase;
    }

    const result: Result = {
        TotalDefinitions: releaseDefinition.length,
        Releases: releaseByDefinitions.reduce((acc, element) => acc + element.length, 0)
    };

    console.log("Search criteria : ", searchCriteria);
    console.log("Results : ", result);
}

run();