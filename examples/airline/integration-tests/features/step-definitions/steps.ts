import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda"
import { DataTable } from "@cucumber/cucumber"
import faker, { datatype } from "faker"
import { CancelFlightIntent } from "operations/lib/service"
import { Temporal } from "proposal-temporal"
import { BookReservationIntent } from "reservations/lib/service"
import { AddFlights, AddRoute, AirportCode, AirportTZ } from "scheduling"
import { promisify, TextEncoder } from "util"

const { customAlphabet } = require("nanoid")
const alphabet = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const nanoid = customAlphabet(alphabet, 8)

const { Given, When, Then, World } = require("@cucumber/cucumber")

// TODO: Move this properly to SSM
const commands = {
  AddRoute: `Scheduling-AddRouteCommand`,
  AddFlights: "Scheduling-AddFlightsCommand",
  BookReservation: "Reservations-bookReservation",
  CancelFlight: "Operations-CancelFlight",
}
const lambda = new LambdaClient({})

const invoke = (name: string, payload: Object) => {
  return lambda.send(
    new InvokeCommand({
      FunctionName: name,
      Payload: new TextEncoder().encode(JSON.stringify(payload)),
    }),
  )
}

const sample = (arr: any[]) => {
  return arr[Math.floor(Math.random() * arr.length)]
}

Given(
  "the following the schedule for {string} on {string} and {string}:",
  async function (this: typeof World, route: string, day1: string, day2: string, schedule: DataTable) {
    this.schedule = schedule
    this.days = [day1, day2]

    const [origin, destination] = route.split("-") as (keyof typeof AirportCode)[]
    // TODO: Save pk's in world so we can clean up after this test

    try {
      await invoke(commands.AddRoute, new AddRoute({ route }))
    } catch (error) {
      console.error(error)
      throw new Error(error)
    }

    const addFlightsToRoute = (this.addFlightsToRoute = schedule.hashes().map(row => {
      if (row.Frequency !== "Daily") {
        throw 'Only written for "Daily" at the moment'
      }
      return new AddFlights({
        route,
        origin,
        destination,
        flights: [day1, day2].map(day => {
          return {
            departureTime: Temporal.ZonedDateTime.from(`${day}T${row.Departure}[${AirportTZ[destination]}]`)
              .toInstant()
              .toString(),
            arrivalTime: Temporal.ZonedDateTime.from(`${day}T${row.Arrival}[${AirportTZ[destination]}]`)
              .toInstant()
              .toString(),
            day: Temporal.PlainDate.from(day).toString(),
            flightNo: row["Flight No."],
            aircraft: row.Aircraft,
            seats: 318,
          }
        }),
      })
    }))
    console.log(JSON.stringify({ addFlightsToRoute }, null, 2))
    try {
      await Promise.all(addFlightsToRoute.map(routeFlights => invoke(commands.AddFlights, addFlightsToRoute)))
    } catch (error) {
      console.error(error)
      throw new Error(error)
    }
  },
)

Given("the {string} has {int} seats", function (aircraftType: string, seats: number) {
  // Given('the {string} has {float} seats', function (string, float) {
  // Write code here that turns the phrase above into concrete actions
  // return "pending"
})

Given("the flights have {int} passengers each", async function (this: typeof World, passengerCount: number) {
  const addFlightsToRoute = this.addFlightsToRoute as AddFlights[]

  const reservationIntents = addFlightsToRoute.flatMap(addFlights =>
    addFlights.flights.flatMap(flight =>
      [...Array(passengerCount)].map(
        i =>
          new BookReservationIntent({
            reservationNo: nanoid(),
            flights: [
              {
                day: flight.day,
                flightNo: flight.flightNo,
                origin: addFlights.route,
                destination: addFlights.destination,
                departureTime: flight.departureTime,
                arrivalTime: flight.departureTime,
              },
            ],
            traveler: {
              firstName: faker.name.firstName(),
              lastName: faker.name.lastName(),
              dob: Intl.DateTimeFormat("en-US").format(
                faker.date.past(50, new Date("Sat Sep 20 1992 21:35:02 GMT+0200 (CEST)")),
              ),
              loyaltyId: nanoid(),
              loyaltyStatus: sample(["Silver", "Gold", "Platinum", "Diamond"]),
            },
          }),
      ),
    ),
  )

  // console.log(JSON.stringify({ reservationIntents }, null, 2))
  // console.log(JSON.stringify({ count: reservationIntents.length }, null, 2))
  try {
    await Promise.all(reservationIntents.map(reservation => invoke(commands.BookReservation, reservation)))
  } catch (error) {
    console.error(error)
    throw new Error(error)
  }
})

When(
  "flight {string} {string} is cancelled on {string}",
  { timeout: 20_000 },
  async function (flightNo: string, route: string, day: string) {
    const wait = promisify(setTimeout)
    //await wait(10_000) // remove this and figure out how to be eventually consistent
    const [origin, destination] = route.split("-")
    const intent = new CancelFlightIntent({ flightNo, day, route, origin, destination })
    console.log(JSON.stringify({ intent }, null, 2))
    try {
      await invoke(commands.CancelFlight, intent)
    } catch (error) {
      console.error(error)
      throw new Error(error)
    }
  },
)

Then("the passengers should be rebooked accordingly:", function (table: DataTable) {
  return "pending"
})
