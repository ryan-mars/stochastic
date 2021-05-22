Feature: Journey through the system

  Background: 
    Given the following the "2021" schedule for "SFO-MIA":
      | Frequency | Departure | Arrival | Flight No. | Meals |
      | Daily     | 0700      | 1702    | 872        | SB    |
      | Daily     | 0700      | 1713    | 738        | SB    |
      | Daily     | 1210      | 2128    | 576        | LD    |
    
  Scenario: Operations cancels flight and booking rebooks the passengers
   Given each of the flights on "2021-06-11" and "2021-06-12" have 200 passengers each
    When flight "576" is cancelled on "2021-06-11"
    Then the passengers should be rebooked on the available flights 

  # Scenario: Scheduling -> Booking 
  #   Given a customer reserves seats "3E" and "3F" on flight 576 on "6/11/21"
  #   When the system is eventually consistent 
  #   Then 3E and 3F should be reserved on flight "576" on "6/11/21" # Read model 

      