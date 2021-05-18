Feature: Journey through the system

  Background: 
    Given the following flights from "SFO" to "MIA" for 2021
      | Frequency | Departure | Arrival | Flight No. | Meals |
      | Daily     | 700a      | 502p    | 872        | SB    |
      | Daily     | 700a      | 513p    | 738        | SB    |
      | Daily     | 1210p     | 928p    | 576        | LD    |
    
  Scenario: Scheduling -> Booking 
    Given a customer reserves seats "3E" and "3F" on flight 576 on "6/11/21"
    When the system is eventually consistent 
    Then 3E and 3F should be reserved on flight "576" on "6/11/21" # Read model 

  Scenario: Operations cancels flight and booking rebooks the passengers
    Given flight 576 on "6/11/21" with 20 passengers 
    When flight 576 is cancelled 
    Then the passengers should be rebooked on flights "872", "738", and "576" on "6/12/21"