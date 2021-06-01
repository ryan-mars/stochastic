import { AddRoute, AddFlights } from "../scheduling/lib/service"
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda"
import { TextEncoder } from "util"

const lambda = new LambdaClient({})

;(async () => {
  const addRoute = new AddRoute({ route: "SFO-MIA" })
  const addRouteResult = await lambda.send(
    new InvokeCommand({
      FunctionName: "Scheduling-AddRouteCommand",
      Payload: new TextEncoder().encode(JSON.stringify(addRoute)),
    }),
  )
  console.log(JSON.stringify({ addRouteResult }, null, 2))

  const addFlights = new AddFlights({
    route: "SFO-MIA",
    origin: "SFO",
    destination: "MIA",
    flights: [
      {
        day: "2021-06-11",
        flightNo: "PA576",
        arrivalTime: "928p",
        departureTime: "1210p",
        aircraft: "787-10",
        seats: 318,
      },
      {
        day: "2021-06-11",
        flightNo: "PA872",
        arrivalTime: "502p",
        departureTime: "700a",
        aircraft: "787-10",
        seats: 318,
      },
    ],
  })

  const addFlightsResult = await lambda.send(
    new InvokeCommand({
      FunctionName: "Scheduling-AddFlightsCommand",
      Payload: new TextEncoder().encode(JSON.stringify(addFlights)),
    }),
  )
  console.log(JSON.stringify({ addFlightsResult }, null, 2))
})().then(() => {
  console.log("done")
})
