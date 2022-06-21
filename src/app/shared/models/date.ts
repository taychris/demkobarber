export class DateModel {
    constructor(
        public id: string,
        public available: boolean,
        public date: string,
        public stateStatus: number,
        public availableTimes: number) {
    }
 }