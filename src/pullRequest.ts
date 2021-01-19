import * as cli from './cli';
import * as utils from './utils';
import { WebApi } from 'azure-devops-node-api';
import { IGitApi } from 'azure-devops-node-api/GitApi';
import { GitRepository, GitPullRequest, GitCommitRef, GitPullRequestSearchCriteria, PullRequestStatus } from 'azure-devops-node-api/interfaces/GitInterfaces';

interface Result {
    TotalRepositories: number,
    PullRequest: number
}
async function run() {

    utils.heading("Start....")
    const project: string = cli.getProject();
    const webApi: WebApi = await cli.getWebApi();
    const gitApi: IGitApi = await webApi.getGitApi();
    utils.banner('Configuration PullRequest');

    const repositories: GitRepository[] = await (await gitApi.getRepositories(project));

    const searchCriteria: GitPullRequestSearchCriteria = {
        status: PullRequestStatus.Completed
    };

    let commitsByRepository: Array<GitPullRequest[]> = new Array<GitPullRequest[]>();
    const increase = 200;
    let start = 0;
    let end = increase;

    while (start < repositories.length) {

        const rateLimitsRepositories = repositories.slice(start, end);
        const pullRequests: Promise<GitPullRequest[]>[] = rateLimitsRepositories.map(repository =>
            gitApi.getPullRequests(repository.id as string, searchCriteria, project, undefined, 0, 2147483647)
        );

        const temp: Array<GitPullRequest[]> = await Promise.all(pullRequests);
        commitsByRepository = commitsByRepository.concat(temp);

        start = end;
        end = ((end + increase) >= repositories.length) ? repositories.length : end + increase;
    }

    utils.heading("2019")
    resultByFilter(2019, commitsByRepository);
    utils.heading("2020")
    resultByFilter(2020, commitsByRepository);
}


function resultByFilter(year:number, commitsByRepository: Array<GitPullRequest[]> ) {

    const filterYear: Array<GitPullRequest[]> = commitsByRepository.map(entry => 
        entry.filter(pr => pr.closedDate?.getFullYear() == year) );

    const result: Result = {
        TotalRepositories: filterYear.length,
        PullRequest: filterYear.reduce((acc, element) => acc + element.length, 0)
    };

    console.log("Search criteria : ", year);
    console.log("Results : ", result);
}

run();