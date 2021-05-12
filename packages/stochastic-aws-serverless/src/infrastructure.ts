import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as lambda from "@aws-cdk/aws-lambda";
import * as lambdaEventSources from "@aws-cdk/aws-lambda-event-sources";
import * as nodeLambda from "@aws-cdk/aws-lambda-nodejs";
import * as sns from "@aws-cdk/aws-sns";
import * as snsSubscriptions from "@aws-cdk/aws-sns-subscriptions";
import * as sqs from "@aws-cdk/aws-sqs";
import * as cdk from "@aws-cdk/core";

import { Aggregate } from "stochastic";
import { Command } from "stochastic";
import { Component } from "stochastic";
import { BoundedContext } from "stochastic";
import { Policy } from "stochastic";

import * as path from "path";
import * as fs from "fs";
import { ReadModel } from "stochastic";
import { Query } from "stochastic";

/**
 * Construct Properties for creating an BoundedContext CDK Construct.
 */
export interface BoundedContextConstructProps<S extends BoundedContext> {
  boundedContext: S;
  components?: {
    [name in keyof S["components"]]?: ComponentProps<S["components"][name]>;
  };
}

export class BoundedContextConstruct<S extends BoundedContext = BoundedContext> extends cdk.Construct {
  readonly boundedContext: S;
  /**
   * The Constructs for each of the Bounded Context Components.
   */
  public readonly components: CDKComponents<S> = {} as CDKComponents<S>;

  /**
   * Associate the Component reference with the corresponding Construct.
   */
  public readonly componentMap: Map<Component, cdk.Construct> = new Map();
  /**
   * Where events are stored (for now)
   */
  public readonly eventStore: EventStore;

  constructor(scope: cdk.Construct, id: string, props: BoundedContextConstructProps<S>) {
    super(scope, id);
    const boundedContext = (this.boundedContext = props.boundedContext);

    const eventStore = (this.eventStore = new EventStore(scope, { boundedContext }));

    const commandConstructs: Map<string, CommandConstruct> = new Map();

    for (const [componentName, component] of Object.entries(boundedContext.components).sort(([nameA, componentA], [nameB, componentB]) =>
      componentA.kind === "Command" ? -1 : 1,
    )) {
      const componentProps = (props.components as any)?.[componentName] as ComponentProps<Component>;
      let con: AggregateConstruct | CommandConstruct | PolicyConstruct | undefined;
      if (component.kind === "Aggregate") {
        con = new AggregateConstruct(this, componentName, {
          ...(componentProps as ComponentProps<Aggregate>),
          component,
          boundedContext,
          name: componentName,
        });
      } else if (component.kind === "Command") {
        con = new CommandConstruct(this, componentName, {
          ...(componentProps as ComponentProps<Command>),
          component,
          boundedContext,
          name: componentName,
        });
        commandConstructs.set(componentName, con);
        // } else if (component.kind === "Event") {
        // TODO
      } else if (component.kind === "Policy") {
        con = new PolicyConstruct(this, componentName, {
          ...(componentProps as ComponentProps<Policy>),
          component,
          boundedContext,
          name: componentName,
          commands: commandConstructs,
        });
      }
      if (con) {
        (this.components as any)[componentName] = con;
        this.componentMap.set(component, con);
      }
    }
  }
}

/**
 * Computes the properties for a component's corresponding CDK Construct.
 */
export type ComponentProps<C extends Component> = C extends Aggregate
  ? AggregateConstructProps<C>
  : C extends Command
  ? CommandConstructProps<C>
  : C extends Policy
  ? PolicyConstructProps<C>
  : never;

/**
 * Map each component in the Bounded Context to its corresponding CDK Construct.
 */
export type CDKComponents<S extends BoundedContext> = {
  [id in keyof S["components"]]: CDKComponent<S, S["components"][id]>;
};

/**
 * May a Component, `C`, to its corresponding CDK Construct representation.
 */
export type CDKComponent<S extends BoundedContext, C extends Component> = C extends Aggregate
  ? AggregateConstruct<S, C>
  : C extends Command
  ? CommandConstruct<S, C>
  : cdk.Construct;

export interface ComponentConstructProps<S extends BoundedContext = BoundedContext, C extends Component = Component> {
  boundedContext: S;
  component: C;
  name: string;
}

export class ComponentConstruct<S extends BoundedContext = BoundedContext, C extends Component = Component> extends cdk.Construct {
  readonly boundedContext: S;
  readonly component: C;
  readonly name: string;
  constructor(scope: cdk.Construct, id: string, props: ComponentConstructProps<S, C>) {
    super(scope, id);
    this.boundedContext = props.boundedContext;
    this.component = props.component;
    this.name = props.name;
  }
}

export interface EventStoreProps {
  boundedContext: BoundedContext;
  // tableProps?: dynamodb.TableProps;
}

// TODO: Create escape hatch for alternate event storage strategies
export class EventStore extends cdk.Construct {
  readonly table: dynamodb.Table;
  readonly topic: sns.Topic;

  constructor(scope: cdk.Construct, props: EventStoreProps) {
    super(scope, "EventStore");

    this.table = new dynamodb.Table(this, "Table", {
      partitionKey: {
        name: "pk",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "sk",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_IMAGE,
      // ...props.tableProps // TODO: Necessary?
    });

    const topic = (this.topic = new sns.Topic(this, "Topic")); // TODO: FIFO?
    const dlq = new sqs.Queue(this, "DLQ");
    const forwarder = new nodeLambda.NodejsFunction(this, "Forwarder", {
      entry: path.join(__dirname, "forwarder.js"),
      memorySize: 512,
      timeout: cdk.Duration.minutes(1),
      environment: {
        EVENT_STREAM_TOPIC_ARN: topic.topicArn, // TODO: Move to SSM
      },
    });
    topic.grantPublish(forwarder);
    forwarder.addEventSource(
      new lambdaEventSources.DynamoEventSource(this.table, {
        startingPosition: lambda.StartingPosition.TRIM_HORIZON,
        batchSize: 10,
        bisectBatchOnError: true,
        onFailure: new lambdaEventSources.SqsDlq(dlq),
        retryAttempts: 10,
      }),
    );
  }
}

export interface AggregateConstructProps<A extends Aggregate = Aggregate> {
  /**
   * DynamoDB Table to use.
   *
   * @default one will be created for you
   */
  //table?: dynamodb.Table;
}

/**
 * Construct for an Aggregate - it creates a DynamoDB Table for storing backing data.
 */
export class AggregateConstruct<S extends BoundedContext = BoundedContext, A extends Aggregate = Aggregate> extends ComponentConstruct<
  S,
  A
> {
  constructor(scope: BoundedContextConstruct, id: string, props: ComponentProps<A> & ComponentConstructProps<S, A>) {
    super(scope, id, props);
  }
}

/**
 * Command Construct Props is just the Lambda Props with code omitted - we'll bundle the code from the BoundedContext
 * object which contains a reference to its path.
 */
export interface CommandConstructProps<C extends Command = Command> extends Omit<lambda.FunctionProps, "code" | "runtime" | "handler"> {
  runtime?: lambda.Runtime;
}

export class CommandConstruct<S extends BoundedContext = BoundedContext, C extends Command = Command> extends ComponentConstruct<S, C> {
  readonly handler: lambda.Function;
  constructor(scope: BoundedContextConstruct, id: string, props: ComponentProps<C> & ComponentConstructProps<S, C>) {
    super(scope, id, props);

    this.handler = new nodeLambda.NodejsFunction(this, "Function", {
      ...generateHandler(this.name, props.component, props.boundedContext.componentNames),
      runtime: lambda.Runtime.NODEJS_14_X,
      ...props,
      environment: {
        COMPONENT_NAME: this.name,
        // TODO: use SSM instead of environment variables
        EVENT_STORE_TABLE: scope.eventStore.table.tableName,
      },
      bundling: {
        sourceMap: true,
        metafile: true,
      },
    });
    scope.eventStore.table.grant(
      this.handler,
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
      "dynamodb:ConditionCheckItem",
      "dynamodb:GetItem",
      "dynamodb:GetRecords",
      "dynamodb:PutItem",
      "dynamodb:Query",
      "dynamodb:Scan",
    );
  }
}

/**
 * Command Construct Props is just the Lambda Props with code omitted - we'll bundle the code from the BoundedContext
 * object which contains a reference to its path.
 */
export interface PolicyConstructProps<P extends Policy = Policy> extends Omit<lambda.FunctionProps, "code" | "runtime" | "handler"> {}

export function generateHandler(
  componentName: string,
  component: Policy | Command | ReadModel | Query,
  componentNames: Map<Component, string>,
): {
  entry: string;
  handler: string;
} {
  fs.mkdirSync("stochastic.out", { recursive: true });
  const entry = path.resolve("stochastic.out", componentName + ".ts");
  fs.writeFileSync(
    entry,
    `import { LambdaRuntime } from "stochastic-aws-serverless/lib/cjs/runtime";    
import { ${componentName} } from "${requirePath(component)}";

${
  component.kind === "Policy"
    ? component.commands.map((command) => `import {${componentNames.get(command)!}} from "${requirePath(command)}"`).join("\n")
    : ""
}
const names = new Map<any, any>();
${
  component.kind === "Policy"
    ? component.commands.map((command) => `names.set(${componentNames.get(command)!}, "${componentNames.get(command)!}");`).join("\n")
    : ""
}
const runtime = new LambdaRuntime(${componentName}, "${componentName}", names);
export const handler = runtime.handler`,
  );
  return {
    entry,
    handler: "handler",
  };

  function requirePath(component: Policy | Command | ReadModel | Query): string {
    return path.relative(path.dirname(entry), component.filename).replace(".ts", "");
  }
}

export interface PolicyConstructProps {
  commands: Map<string, CommandConstruct>;
}

export class PolicyConstruct<S extends BoundedContext = BoundedContext, C extends Policy = Policy> extends ComponentConstruct<S, C> {
  readonly handler: lambda.Function;
  constructor(scope: BoundedContextConstruct, id: string, props: ComponentProps<C> & ComponentConstructProps<S, C>) {
    super(scope, id, props);

    this.handler = new nodeLambda.NodejsFunction(this, "Function", {
      ...generateHandler(this.name, props.component, props.boundedContext.componentNames),
      ...props,
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        COMPONENT_NAME: this.name,
      },
      bundling: {
        sourceMap: true,
        metafile: true,
      },
    });

    for (const command of props.component.commands) {
      const commandName = props.boundedContext.componentNames.get(command)!;
      const commandConstruct = props.commands.get(commandName)!;

      this.handler.addEnvironment(
        `${props.boundedContext.componentNames.get(command)!}_LAMBDA_ARN`,
        commandConstruct?.handler.functionArn!,
      );
      commandConstruct.handler.grantInvoke(this.handler);
    }

    const queue = new sqs.Queue(this, `Queue`);
    this.handler.addEventSource(new lambdaEventSources.SqsEventSource(queue));
    scope.eventStore.topic.addSubscription(
      new snsSubscriptions.SqsSubscription(queue, {
        rawMessageDelivery: true,
        filterPolicy: {
          event_type: sns.SubscriptionFilter.stringFilter({
            whitelist: this.component.events.map((e) => e.name),
          }),
        },
      }),
    );

    scope.eventStore.table.grantWriteData(this.handler);
    /**
     * Allow policy to invoke commands
     */
    for (const command of this.component.commands) {
      (scope.componentMap.get(command) as CommandConstruct).handler.grantInvoke(this.handler);
    }
  }
}
