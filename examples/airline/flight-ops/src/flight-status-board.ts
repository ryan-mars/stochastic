import { Query } from "stochastic";
import { object, string } from "superstruct";
import { FlightStatusModel } from "./flight-status";

// export interface StatusBoardRequest {
//   flightNo: string;
// }
export const StatusBoardRequest = object({
  flightNo: string()
});

// export interface StatusBoardResult {
//   flightNo: string;
//   status: string;
// }
export const StatusBoardResult = object({
  flightNo: string(),
  status: string(),
});

export const StatusBoard = new Query({
  __filename,
  request: StatusBoardRequest,
  results: StatusBoardResult,
  models: [FlightStatusModel],
  
}, async (request, flightStatusModel) => {
  // do stuff
  // TODO: Finish off read model so it has a query strategy signature
  const status = await flightStatusModel();

  return status;
});