import "dotenv/config";
import data from "./data/consultants.json";
// console.log(process.env.API_KEY);

interface ConsultantRecord {
    shortName: string;
    salary: number;
    manager: string;
}

interface ConsultantsData {
    consultants: Record<string, ConsultantRecord>;
}

// JSON main Loop
const mainLoop = (data: ConsultantsData) => {
    for (const [name, record] of Object.entries(data.consultants)) {
        return console.log(name, record.shortName, record.salary);
    }
}

mainLoop(data);