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
  "the following the {string} schedule for {string}:",
  async function (this: typeof World, year: string, route: string, schedule: DataTable) {
    this.schedule = schedule
    // TODO: Save pk's in world so we can clean up after this test
    await invoke(commands.AddRoute, new AddRoute({ route }))
    const flights = schedule.hashes().map(async row => {
      if (row.Frequency !== "Daily") {
        throw 'Only written for "Daily" at the moment'
      }
      let date = Temporal.PlainDate.from(`${year}-01-01`)
      const addFlights = new AddFlights({
        route,
        flights: Array.from(Array(date.daysInYear).keys()).map(i => {
          return {
            departureTime: Temporal.PlainTime.from(row.Departure).toString(),
            arrivalTime: Temporal.PlainTime.from(row.Arrival).toString(),
            day: date.add({ days: i }).toString(),
            flightNo: row["Flight No."]
          }
        })
      })
      await invoke(commands.AddFlights, addFlights)
    })
    await Promise.all(flights)
  }
)

Given(
  "each of the flights on {string} and {string} have {int} passengers each",
  async function (this: typeof World, day1: string, day2: string, passengerCount: number) {
    const schedule = this.schedule as DataTable
    const result = await Promise.all(
      [day1, day2].map(day => {
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
  }
)

When("flight {string} is cancelled on {string}", async function (flightNo: string, day: string) {
  await invoke(commands.CancelFlight, new CancelFlightIntent({ flightNo, day }))
})

Then("the passengers should be rebooked on the available flights", function () {
  // TODO: Implement the rereservation policy
  // TODO: Query the read model and assert passengers were rebooked

  return "pending"
})
