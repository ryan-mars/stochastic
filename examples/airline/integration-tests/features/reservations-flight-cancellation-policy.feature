Feature: Reservations Flight Cancellation Policy

        Background:
            Given the following the schedule for "SFO-MIA" on "2021-06-11" and "2021-06-12":
                  | Frequency | Departure | Arrival | Flight No. | Aircraft |
                  | Daily     | 0700      | 1702    | 872        | 787-10   |
                  | Daily     | 0700      | 1713    | 738        | 787-10   |
                  | Daily     | 1210      | 2128    | 576        | 787-10   |
              And the "787-10" has 318 seats

    Rule: Passengers on cancelled flights should be rebooked evenly on the earliest available flight(s)
        Example: No flights left today, two tomorrow morning same time
            Given the flights have 200 passengers each
             When flight "576" on "2021-06-11" from "SFO" to "MIA" is cancelled at "1250" local time
             Then the passengers should be rebooked accordingly:
                  | Date       | Flight No. | Passengers |
                  | 2021-06-12 | 872        | 259        |
                  | 2021-06-12 | 738        | 259        |
                  | 2021-06-12 | 576        | 200        |
      
# Rule: Higher status passengers should be rebooked first
#   Scenario: 

  # Scenario: Scheduling -> Booking 
  #   Given a customer reserves seats "3E" and "3F" on flight 576 on "6/11/21"
  #   When the system is eventually consistent 
  #   Then 3E and 3F should be reserved on flight "576" on "6/11/21" # Read model 

      