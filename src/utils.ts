import axiosRetry from 'axios-retry';
import axios from 'axios';

axiosRetry(axios, { retries: 3 });
    
export function banner(title: string): void {
    console.log("=======================================");
    console.log(`\t${title}`);
    console.log("=======================================");
}

export function heading(title: string): void {
    console.log();
    console.log(`> ${title}`);
}

export async function getRequestWithContinuationToken<T>(url: string , personalAccessToken: string, continuationToken: number=0): Promise<T[]> {

    const query = url.replace("{continuationToken}", continuationToken.toString());
    const response = await axios.get(query, {
        auth: {
          username: 'script',
          password: personalAccessToken
        }
      });
    const newContinuationToken: number = response.headers["x-ms-continuationtoken"];
    const data: T[] = response.data.value;

    if(response.status >=300){
        console.log("Fail ---> ", response.status ,response.data);
    }

    if(newContinuationToken){
        return data.concat(await getRequestWithContinuationToken(url, personalAccessToken, newContinuationToken));
    }else{
        return data;
    }
}