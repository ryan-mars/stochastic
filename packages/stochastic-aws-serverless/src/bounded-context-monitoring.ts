import * as cdk from "@aws-cdk/core"
import * as cw from "@aws-cdk/aws-cloudwatch"

import { BoundedContext, Command } from "stochastic"
import { BoundedContextConstruct } from "./bounded-context-construct"
import { CommandConstruct } from "./command-construct"
import { PolicyConstruct } from "./policy-construct"

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
      widgets: Array.from(props.context.componentMap.values()).map(component => {
        if (component.kind === "Store") {
          return []
        }

        return [
          new cw.GraphWidget({
            title: `${component.name} (${component.kind}) - Function`,
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
            ? commandDashboard(component)
            : component.kind === "Policy"
            ? policyDashboard(component)
            : []),
        ]
      }),
    })

    function commandDashboard(command: CommandConstruct) {
      const row: cw.IWidget[] = []
      if (isNotEmpty(command.component.events)) {
        row.push(
          new cw.GraphWidget({
            title: `${command.name} (${command.kind}) - Emitted Events`,
            left: command.component.events.map(
              event =>
                new cw.Metric({
                  namespace: props.context.boundedContext.name,
                  metricName: `Emit${event.__typename}`,
                  statistic: cw.Statistic.SUM,
                }),
            ),
          }),
        )
      }
      return row
    }

    function policyDashboard(policy: PolicyConstruct) {
      const row: cw.IWidget[] = []
      if (isNotEmpty(policy.component.commands)) {
        row.push(
          new cw.GraphWidget({
            title: `${policy.name} (${policy.kind}) - Invoked Commands`,
            left: Object.values(policy.component.commands)
              .map(command =>
                ["Count", "Success", "Failure"].map(
                  metric =>
                    new cw.Metric({
                      namespace: props.context.boundedContext.name,
                      metricName: `Invoke${policy.boundedContext.componentNames.get(command as Command)}${metric}`,
                      statistic: cw.Statistic.SUM,
                    }),
                ),
              )
              .flat(),
            right: Object.values(policy.component.commands)
              .map(command =>
                [cw.Statistic.AVERAGE, "p90", "p99"].map(
                  statistic =>
                    new cw.Metric({
                      namespace: props.context.boundedContext.name,
                      metricName: `Invoke${policy.boundedContext.componentNames.get(command as Command)}Latency`,
                      statistic,
                    }),
                ),
              )
              .flat(),
          }),
        )
      }
      if (isNotEmpty(policy.component.events)) {
        row.push(
          new cw.GraphWidget({
            title: `${policy.name} (${policy.kind}) - On Event Handlers`,
            left: policy.component.events
              .map(event =>
                ["Count", "Success", "Failure"].map(
                  metric =>
                    new cw.Metric({
                      namespace: props.context.boundedContext.name,
                      metricName: `On${event.__typename}${metric}`,
                      statistic: cw.Statistic.SUM,
                    }),
                ),
              )
              .flat(),
            right: policy.component.events
              .map(event =>
                [cw.Statistic.AVERAGE, "p90", "p99"].map(
                  statistic =>
                    new cw.Metric({
                      namespace: props.context.boundedContext.name,
                      metricName: `On${event.__typename}Latency`,
                      statistic,
                    }),
                ),
              )
              .flat(),
          }),
        )
      }

      return row
    }
  }
}

function isNotEmpty(a: any) {
  if (a) {
    if (Array.isArray(a)) {
      return a.length > 0
    } else if (typeof a === "object") {
      return Object.keys(a).length > 0
    }
  }
  return false
}
