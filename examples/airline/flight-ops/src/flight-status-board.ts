import { Query, Shape } from "stochastic";
import { string } from "superstruct";
import { FlightStatusModel } from "./flight-status";

// export interface StatusBoardRequest {
//   flightNo: string;
// }
export class StatusBoardRequest extends Shape("StatusBoardRequest", {
  flightNo: string(),
}) {}

// export interface StatusBoardResult {
//   flightNo: string;
//   status: string;
// }
export class StatusBoardResult extends Shape("StatusBoardResult", {
  flightNo: string(),
  status: string(),
}) {}

export const StatusBoard = new Query(
  {
    __filename,
    request: StatusBoardRequest,
    results: StatusBoardResult,
    models: [FlightStatusModel],
  },
  async (request, flightStatusModel) => {
    // do stuff
    // TODO: Finish off read model so it has a query strategy signature
    const status = await flightStatusModel();

    return new StatusBoardResult({
      ...status,
    });
  },
);
