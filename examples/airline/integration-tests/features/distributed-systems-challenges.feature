Feature: Distributed systems problems

  We should provide examples for dealing with the following problematic situations...

    Rule: At least once delivery should not break idempotency
        Example: Policy receives event twice
        Example: Read model receives event twice
        Example: Command issued twice is rejected
          # Use an idempotency token 

    # We cannot control the 
    Rule: Out of order events
        Example: Read model projection recieves external events in an unexpected order
        Example: Events originating within the same bounded context are ordered

    Rule: Event replay
        Example: New read model needs to "backfill"
          start filling read model queue with live events but do not begin processing them 
          begin processing historical events in order
          once the newest historical event processed is older than the oldest live event in the queue begin processing live events
          skip events you've already seen 
        Example: Pre-existing read model needs to re-build its model?
    
    Rule: Race condition
        Example: Command with optimistic concurrency
        Example: Command with no concurrency (last write wins, duplicates ok)
        
    Rule: Saga
        Example: Distributed, long running transaction

    Rule: Eventual consistency too slow with high data volume
        Example: Lambda architecture