import ora from 'ora';
import axios, { AxiosResponse } from 'axios';

type ResponseCallbackParams = {
    resp: AxiosResponse<any, any>,
    resolve: (value: any | PromiseLike<any>) => void,
    reject: (reason?: any) => void,
    spinner: ora.Ora
}

const fetchData = (url: string, responseCallback: (params: ResponseCallbackParams) => void, spinnerText?: string, queryParams?: object): Promise<any> => {

    let spinner: ora.Ora;

    if (spinnerText) {
        spinner = ora(spinnerText).start();
    }

    return new Promise<number>((resolve, reject) => {
        axios.get(url, {params: queryParams})
            .then(resp => responseCallback({ resp, resolve, reject, spinner }))
    });
}


const computeCacheKey = (track: string, start: number) => `${track}-${start}`

export {fetchData, ResponseCallbackParams, computeCacheKey}