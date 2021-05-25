import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda"
import { DataTable } from "@cucumber/cucumber"
import { Temporal } from "proposal-temporal"
import { AddFlights, AddRoute } from "scheduling"
import { BookReservationIntent } from "reservations/lib/service"
import { CancelFlightIntent } from "operations/lib/service"
import { TextEncoder } from "util"
import faker from "faker"
const { customAlphabet } = require("nanoid")
const alphabet = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const nanoid = customAlphabet(alphabet, 8)

const { Given, When, Then, World } = require("@cucumber/cucumber")

// TODO: Move this properly to SSM
const commands = {
  AddRoute: `Scheduling-AddRouteCommand`,
  AddFlights: "Scheduling-AddFlightsCommand",
  BookReservation: "Reservation-BookReservation",
  CancelFlight: "Operations-CancelFlight"
}
const lambda = new LambdaClient({})

const invoke = (name: string, payload: Object) => {
  return lambda.send(
    new InvokeCommand({
      FunctionName: name,
      Payload: new TextEncoder().encode(JSON.stringify(payload))
    })
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
    // TODO: Save pk's in world so we can clean up after this test
    await invoke(commands.AddRoute, new AddRoute({ route }))

    const flights = schedule.hashes().map(async row => {
      if (row.Frequency !== "Daily") {
        throw 'Only written for "Daily" at the moment'
      }
      const addFlights = new AddFlights({
        route,
        flights: [day1, day2].map(day => {
          return {
            departureTime: Temporal.PlainTime.from(row.Departure).toString(),
            arrivalTime: Temporal.PlainTime.from(row.Arrival).toString(),
            day: Temporal.PlainDate.from(day).toString(),
            flightNo: row["Flight No."],
            aircraft: row.Aircraft
          }
        })
      })
      return invoke(commands.AddFlights, addFlights)
    })
    await Promise.all(flights)
  }
)

Given("the {string} has {int} seats", function (aircraftType: string, seats: number) {
  // Given('the {string} has {float} seats', function (string, float) {
  // Write code here that turns the phrase above into concrete actions
  return "pending"
})

Given("the flights have {int} passengers each", async function (this: typeof World, passengerCount: number) {
  const days = this.days as string[]
  const schedule = this.schedule as DataTable
  await Promise.all(
    days.map(day => {
      return schedule.hashes().map(flight => {
        return Array.from(Array(passengerCount).keys()).map(i => {
          const intent = new BookReservationIntent({
            reservationNo: nanoid(),
            flights: [
              {
                day: Temporal.PlainDate.from(day).toString(),
                flightNo: flight["Flight No."],
                origin: "SFO",
                destination: "MIA",
                departureTime: Temporal.PlainTime.from(flight.Departure).toString(),
                arrivalTime: Temporal.PlainTime.from(flight.Arrival).toString()
              }
            ],
            traveler: {
              firstName: faker.name.firstName(),
              lastName: faker.name.lastName(),
              dob: Intl.DateTimeFormat("en-US").format(
                faker.date.past(50, new Date("Sat Sep 20 1992 21:35:02 GMT+0200 (CEST)"))
              ),
              loyaltyId: nanoid(),
              loyaltyStatus: sample(["Silver", "Gold", "Platinum", "Diamond"])
            }
          })

          return invoke(commands.BookReservation, intent)
        })
      })
    })
  )
})

When("flight {string} is cancelled on {string}", async function (flightNo: string, day: string) {
  await invoke(commands.CancelFlight, new CancelFlightIntent({ flightNo, day }))
})

Then("the passengers should be rebooked accordingly:", function (table: DataTable) {
  // Write code here that turns the phrase above into concrete actions
  return "pending"
})
