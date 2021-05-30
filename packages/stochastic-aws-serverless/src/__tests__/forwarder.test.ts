const { PublishCommand } = jest.requireActual("@aws-sdk/client-sns")
const mockSend = jest.fn().mockResolvedValue({ MessageId: "165545c9-2a5c-472c-8df2-7ff2be2b3b1b" })

jest.mock("@aws-sdk/client-sns", () => {
  return {
    SNSClient: jest.fn().mockImplementation(() => {
      return { send: mockSend }
    }),
    PublishCommand,
  }
})

import dynamodbStreamEvent from "./__fixtures__/dynamodb-stream-event.json"
import forwarderSNSMessage from "./__fixtures__/forwarder-sns-message.json"
import { handler } from "../forwarder"
import { Context, DynamoDBStreamEvent } from "aws-lambda"
import { SNSClient } from "@aws-sdk/client-sns"

describe("event forwarder", () => {
  globalThis.process.env["EVENT_STREAM_TOPIC_ARN"] = "my:sns:arn"

  it("forward the event to SNS", async () => {
    await handler(dynamodbStreamEvent as any, {} as Context, () => {})
    expect(mockSend.mock.calls[0][0].input).toMatchSnapshot()
    expect(mockSend.mock.calls[0][0].input.Message).toMatch(JSON.stringify(forwarderSNSMessage))
  })
})
