import * as cdk from "@aws-cdk/core"
import * as cw from "@aws-cdk/aws-cloudwatch"
import { BoundedContext, Command } from "stochastic"
import { BoundedContextConstruct } from "./bounded-context-construct"

export interface BoundedContextMonitoringProps<Context extends BoundedContext = BoundedContext> extends cdk.StackProps {
  /**
   * A reference to the provisioned Bounded Context.
   */
  context: BoundedContextConstruct<Context>
  /**
   * Name of the CloudWatch Dashboard.
   *
   * @default - ${boundedContextName}
   */
  dashboardName?: string
}

/**
 * A CloudFormation Stack containing the Monitoring configuration for a Bounded Context.
 */
export class BoundedContextMonitoring<Context extends BoundedContext = BoundedContext> extends cdk.Stack {
  readonly dashboard: cw.Dashboard
  constructor(scope: cdk.Construct, id: string, props: BoundedContextMonitoringProps<Context>) {
    super(scope, id, props)

    this.dashboard = new cw.Dashboard(this, "Dashboard", {
      dashboardName: props.context.boundedContext.name,
      widgets: Array.from(props.context.componentMap.values()).map(component => [
        new cw.GraphWidget({
          title: `${component.name} (${component.kind}) - Lambda Function Performance`,
          left: [
            component.handler.metricErrors(),
            component.handler.metricInvocations(),
            component.handler.metricThrottles(),
          ],
          right: [cw.Statistic.AVERAGE, "p90", "p99"].map(statistic =>
            component.handler.metricDuration({
              statistic,
              unit: cw.Unit.MILLISECONDS,
              label: `${statistic} latency`,
            }),
          ),
        }),
        ...(component.kind === "Command"
          ? [
              new cw.GraphWidget({
                title: `${component.name} (${component.kind}) - Emitted Events`,
                left: component.component.events.map(
                  event =>
                    new cw.Metric({
                      namespace: props.context.boundedContext.name,
                      metricName: `Emit${event.__typename}`,
                      statistic: cw.Statistic.SUM,
                    }),
                ),
              }),
            ]
          : component.kind === "Policy"
          ? [
              new cw.GraphWidget({
                title: `${component.name} (${component.kind}) - Invoked Commands`,
                left: Object.values(component.component.commands)
                  .map(command =>
                    ["Count", "Success", "Failure"].map(
                      metric =>
                        new cw.Metric({
                          namespace: props.context.boundedContext.name,
                          metricName: `Invoke${component.boundedContext.componentNames.get(
                            command as Command,
                          )}${metric}`,
                          statistic: cw.Statistic.SUM,
                        }),
                    ),
                  )
                  .reduce((a, b) => a.concat(b), []),
                right: Object.values(component.component.commands).map(
                  command =>
                    new cw.Metric({
                      namespace: props.context.boundedContext.name,
                      metricName: `Invoke${component.boundedContext.componentNames.get(command as Command)}Latency`,
                      statistic: cw.Statistic.SUM,
                    }),
                ),
              }),
            ]
          : []),
      ]),
    })
  }
}
