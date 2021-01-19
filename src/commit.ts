import * as cli from './cli';
import * as utils from './utils';
import { WebApi } from 'azure-devops-node-api';
import { IGitApi } from 'azure-devops-node-api/GitApi';
import { GitRepository, GitQueryCommitsCriteria, GitCommitRef } from 'azure-devops-node-api/interfaces/GitInterfaces';

interface Result {
    TotalRepositories: number,
    Commits: number
}
async function run() {

    utils.heading("Start....")
    const project: string = cli.getProject();
    const webApi: WebApi = await cli.getWebApi();
    const gitApi: IGitApi = await webApi.getGitApi();
    utils.banner('Configuration Commits');
    const repositories: GitRepository[] = await gitApi.getRepositories(project);

    const searchCriteria2019: GitQueryCommitsCriteria = {
        fromDate: '1/1/2019 00:00:00 AM',
        toDate: '12/31/2019 12:00:00 PM'
    };
    utils.heading("2019");
    validator(repositories, searchCriteria2019, gitApi, project);

    const searchCriteria2020: GitQueryCommitsCriteria = {
        fromDate: '1/1/2020 00:00:00 AM',
        toDate: '12/31/2020 12:00:00 PM'
    };
    utils.heading("2020");
    validator(repositories, searchCriteria2020, gitApi, project);
}

async function validator(repositories: GitRepository[], searchCriteria: GitQueryCommitsCriteria, gitApi: IGitApi, project: string) {

    let commitsByRepository: Array<GitCommitRef[]> = new Array<GitCommitRef[]>();
    const increase = 200;
    let start = 0;
    let end = increase;

    while (start < repositories.length) {
        
        const rateLimitsRepositories = repositories.slice(start, end);
        const commitRequests: Promise<GitCommitRef[]>[] = rateLimitsRepositories.map(repository =>
            gitApi.getCommits(repository.id as string, searchCriteria, project, 0, 2147483647)
        );

        const temp: Array<GitCommitRef[]> = await Promise.all(commitRequests);
        commitsByRepository = commitsByRepository.concat(temp);

        start = end;
        end = ((end + increase) >= repositories.length) ? repositories.length : end + increase;

    }

    const result: Result = {
        TotalRepositories: commitsByRepository.length,
        Commits: commitsByRepository.reduce((acc, element) => acc + element.length, 0)
    };

    console.log("Search criteria : ", searchCriteria);
    console.log("Results : ", result);
}

run();