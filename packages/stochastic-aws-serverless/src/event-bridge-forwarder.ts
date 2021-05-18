import { SQSHandler } from "aws-lambda";

export const handler: SQSHandler = async (event) => {
  console.log(JSON.stringify(event, null, 2))
}