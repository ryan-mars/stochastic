import { BoundedContext, CommandsFromContext, DomainEventEnvelope } from "stochastic"

export class LocalRuntime<Context extends BoundedContext = BoundedContext> {
  public readonly commands: CommandsFromContext<Context>
  public readonly eventStore: Map<string, DomainEventEnvelope[]>

  constructor(props: { boundedContext: Context }) {
    const { boundedContext } = props
    this.eventStore = new Map()
    ;(this.commands as any) = {}

    for (const [componentName, component] of Object.entries(boundedContext.components).sort(
      ([nameA, componentA], [nameB, componentB]) => (componentA.kind === "Command" ? -1 : 1),
    )) {
      if (component.kind === "Command") {
        const source = component.store.stateShape.name
        const domainEventLookupTable = component.events
          .map(eventType => ({
            [eventType.__typename]: eventType,
          }))
          .reduce((a, b) => ({ ...a, ...b }), {})

        ;(this.commands as any)[componentName] = async (intent: any) => {
          const command = component.init(undefined)
          const commandResponse = await command(intent, {
            get: async (key: string) => {
              let state = component.store.initialState()
              let events = this.eventStore.get(`source#${key}`) ?? []

              state = events.reduce((state, event) => component.store.reducer(state, event), state)

              return {
                state,
                events,
              }
            },
          })
          const events = (Array.isArray(commandResponse) ? commandResponse : commandResponse.events).map(
            eventInstance => {
              const event = domainEventLookupTable[eventInstance.__typename]
              return new DomainEventEnvelope({
                source: component.store.stateShape.name,
                source_id: eventInstance[event.__key],
                payload: eventInstance,
              })
            },
          )
          const confirmation = (Array.isArray(commandResponse) ? undefined : commandResponse.confirmation) ?? events

          events.map(event => {
            const aggregateId = `${event.source}#${event.source_id}`
            const eventsForAggregate = this.eventStore.get(aggregateId) ?? []
            eventsForAggregate.push(event)
            this.eventStore.set(aggregateId, eventsForAggregate)
          })

          return confirmation
        }
      }
    }
  }
}
