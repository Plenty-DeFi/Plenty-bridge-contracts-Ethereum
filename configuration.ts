type admins = {
    [key: string]: string
}

export function administrator(network: string): string {
    const result: admins = {
        '31337': '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
        '4': '0x6E5aC7678F387006F5d2D80b89b9bfc66a59cF54',
        '1': '0x5b64d8B8459b37e3d1E8AE59D4a6D4fd6d207698'
    };
    if (!result[network]) {
        throw new Error(`Administrator for network ${network} not available`);
    }
    return result[network];
}