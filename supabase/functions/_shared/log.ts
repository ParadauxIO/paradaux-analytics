import { dateToSimpleTS } from "./time.ts"

const log = (data: any, error: boolean = false): void => {
    if (data == null) return;
    const message = `[${dateToSimpleTS(new Date())}] Analytics: ${JSON.stringify(data)}`;
    error ? console.error(message) : console.log(message);
}

export default log;