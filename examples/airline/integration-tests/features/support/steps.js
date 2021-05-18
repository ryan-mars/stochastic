const { Given, When, Then } = require("@cucumber/cucumber");

Given("the following flights from {string} to {string} for {int}", function (origin, destination, year, scheduleDataTable) {
  console.log(JSON.stringify(scheduleDataTable.hashes(), null, 2));

  // Get physical name of the right schedule command lambda from SSM
  // Construct command message/s
  // Send commands

  return "pending";
});

Given("a customer reserves seats {string} and {string} on flight {int} on {string}", function (string, string2, int, string3) {
  // Write code here that turns the phrase above into concrete actions
  return "pending";
});

When("the system is eventually consistent", function () {
  // Write code here that turns the phrase above into concrete actions
  return "pending";
});

Then("the reservation should be present in Booking", function () {
  // Write code here that turns the phrase above into concrete actions
  return "pending";
});

Then("3E and 3F should be reserved on flight {string} on {string} # Read model", function (string, string2) {
  // Write code here that turns the phrase above into concrete actions
  return "pending";
});

Given("flight {int} on {string} with {int} passengers", function (int, string, int2) {
  // Given('flight {int} on {string} with {float} passengers', function (int, string, float) {
  // Given('flight {float} on {string} with {int} passengers', function (float, string, int) {
  // Given('flight {float} on {string} with {float} passengers', function (float, string, float2) {
  // Write code here that turns the phrase above into concrete actions
  return "pending";
});
When("flight {int} is cancelled", function (int) {
  // When('flight {float} is cancelled', function (float) {
  // Write code here that turns the phrase above into concrete actions
  return "pending";
});
Then(
  "the passengers should be rebooked on flights {string}, {string}, and {string} on {string}",
  function (string, string2, string3, string4) {
    // Write code here that turns the phrase above into concrete actions
    return "pending";
  },
);
