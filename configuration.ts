type admins = {
    [key: string]: string
}

export function administrator(network: string): string {
    const result: admins = {
        '31337': '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
        '4': '0xdEf14B5432cE3e06c98E65725c1324A0fe710DA0'
    };
    if (!result[network]) {
        throw new Error(`Administrator for network ${network} not available`);
    }
    return result[network];
}