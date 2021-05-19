import { AddRoute, AddFlights, ScheduledFlightsAdded } from "../scheduling/lib/service";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { TextEncoder } from "util";

const lambda = new LambdaClient({});

(async () => {
  const addRoute = new AddRoute({ route: "SFO-MIA" })
  const result1 = await lambda.send(
    new InvokeCommand({
      FunctionName: "Scheduling-SchedulingBoundedContextAddRouteCommand-1REE7CYH6X172",
      Payload: new TextEncoder().encode(JSON.stringify(addRoute)),
    }),
  )
  console.log(result1);


  const addFlights = new AddFlights({
    route: "SFO-MIA",
    flights: [
      {
        day: "2021-06-11",
        flightNo: "PA576",
        arrivalTime: "928p",
        departureTime: "1210p",
      },
      {
        day: "2021-06-11",
        flightNo: "PA872",
        arrivalTime: "502p",
        departureTime: "700a",
      },
    ]
  })

  const result2 = await lambda.send(
    new InvokeCommand({
      FunctionName: "Scheduling-SchedulingBoundedContextAddFlightsComma-18JN8IVHPK4EN",
      Payload: new TextEncoder().encode(JSON.stringify(addFlights)),
    }),
  )
  console.log(result2);


})().then(() => { console.log("done") })

