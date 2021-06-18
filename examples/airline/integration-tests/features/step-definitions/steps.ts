import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda"
import { DataTable } from "@cucumber/cucumber"
import faker from "faker"
import { CancelFlightIntent } from "operations/lib/service"
import { Temporal } from "proposal-temporal"
import { BookReservationIntent } from "reservations/lib/service"
import { AddFlights, AddRoute, AirportCode, AirportTZ } from "scheduling"
import { promisify, TextEncoder } from "util"
import { DynamoDBClient, BatchGetItemCommand } from "@aws-sdk/client-dynamodb"
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb"
import * as assert from "assert"

const { customAlphabet } = require("nanoid")
const alphabet = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const nanoid = customAlphabet(alphabet, 8)

const { Given, When, Then, World } = require("@cucumber/cucumber")
const wait = promisify(setTimeout)

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
  { timeout: 30_000 },
  async function (this: typeof World, route: string, day1: string, day2: string, schedule: DataTable) {
    this.schedule = schedule
    this.days = [day1, day2]

    const [origin, destination] = route.split("-") as (keyof typeof AirportCode)[]

    try {
      await invoke(commands.AddRoute, new AddRoute({ route }))
    } catch (error) {
      console.error(error)
      throw new Error(error)
    }
    await wait(1_000)
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
            seats: parseInt(row["Seats"]),
          }
        }),
      })
    }))
    try {
      await Promise.all(addFlightsToRoute.map(c => invoke(commands.AddFlights, c)))
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

Given(
  "the flights have {int} passengers each",
  { timeout: 20_000 },
  async function (this: typeof World, passengerCount: number) {
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
                  origin: addFlights.origin,
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

    try {
      await Promise.all(reservationIntents.map(reservation => invoke(commands.BookReservation, reservation)))
    } catch (error) {
      console.error(error)
      throw new Error(error)
    }
  },
)

When(
  "flight {string} on {string} from {string} to {string} is cancelled at {string} local time",
  { timeout: 20_000 },
  async function (flightNo: string, day: string, origin: string, destination: string, cancelledAtLocal: string) {
    await wait(10_000) // remove this and figure out how to be eventually consistent
    const route = `${origin}-${destination}`
    const cancelledAt = Temporal.ZonedDateTime.from(
      `${day}T${cancelledAtLocal}[${AirportTZ[origin as keyof typeof AirportCode]}]`,
    )
      .toInstant()
      .toString()
    const intent = new CancelFlightIntent({ flightNo, day, route, origin, destination, cancelledAt })

    try {
      await invoke(commands.CancelFlight, intent)
    } catch (error) {
      console.error(error)
      throw new Error(error)
    }
  },
)

Then("the passengers should be rebooked accordingly:", { timeout: 3_000 }, async function (table: DataTable) {
  const tableName = process.env["RESERVATIONS_SINGLE_TABLE_NAME"]
  const dynamodb = new DynamoDBClient({})
  const response = await dynamodb.send(
    new BatchGetItemCommand({
      RequestItems: {
        [tableName]: {
          Keys: table.hashes().map(row =>
            marshall({
              pk: `FLIGHT#${row["Flight No."]}#DATE#${row["Date"]}`,
              sk: `FLIGHT`,
            }),
          ),
        },
      },
    }),
  )
  if (response.Responses === undefined) {
    throw new Error(`No Responses in: ${response}`)
  }
  const flights = response.Responses[tableName].map(o => unmarshall(o))
  table
    .hashes()
    .map(row =>
      assert.strictEqual(flights.find(e => e.flightNo === row["Flight No."])?.seatsBooked, parseInt(row["Passengers"])),
    )
})
