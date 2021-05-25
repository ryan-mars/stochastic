import { string } from "superstruct"
import { Shape } from "./shape"

export class TableConfig extends Shape("TableConfig", {
  /**
   * ARN of the table.
   */
  tableArn: string(),
  /**
   * Name of the Table.
   */
  tableName: string()
}) {}
