---
id: crdt
title: Conflict-free Replicated Data Type (CRDT)
hoverText: A Conflict-free Replicated Data Type (CRDT) is a data structure that simplifies distributed data storage systems and multi-user applications.
---

A Conflict-free Replicated Data Type (CRDT) is a data structure that simplifies distributed data storage systems and multi-user applications.

In many systems, copies of some data need to be stored on multiple computers (known as replicas).

All such systems need to deal with the fact that the data may be concurrently modified on different replicas. Broadly speaking, there are two possible ways of dealing with such data modifications: strongly consistent replication, and optimistic replication.

In optimistic replication, users may modify the data on any replica independently of any other replica, even if the replica is offline or disconnected from the others. This approach enables maximum performance and availability, but it can lead to conflicts when multiple clients or users concurrently modify the same piece of data. These conflicts then need to be resolved when the replicas communicate with each other.

Conflict-free Replicated Data Types (CRDTs) are used in systems with optimistic replication, where they take care of conflict resolution. CRDTs ensure that, no matter what data modifications are made on different replicas, the data can always be merged into a consistent state. This merge is performed automatically by the CRDT, without requiring any special conflict resolution code or user intervention.

Source: https://crdt.tech
