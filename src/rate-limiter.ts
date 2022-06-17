const MAXIMUM_CONCURRENT_CALLS = 15;

const RateLimiter = (): { requestToken: () => Promise<boolean>, returnToken: () => number} => {

    let availableTokens = MAXIMUM_CONCURRENT_CALLS;

    
    const requestToken = (): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            const intervalId = setInterval(() => {
                if (availableTokens >= 1) {
                    availableTokens--;
                    clearInterval(intervalId);
                    resolve(true);
                }
            }, 150);
        })
    }


    const returnToken = (): number => availableTokens = availableTokens < MAXIMUM_CONCURRENT_CALLS ? availableTokens + 1 : availableTokens;

    return {
        requestToken,
        returnToken
    }
}


export {RateLimiter}