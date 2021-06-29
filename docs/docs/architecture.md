# A Treatise on Enterprise Software Architecture

> “all experience hath shewn, that mankind are more disposed to suffer, while evils are sufferable, than to right themselves by abolishing the forms to which they are accustomed.” ― Thomas Jefferson, The Declaration of Independence

## Why you may find yourself here

To put it simply, the world changed right underneath us.

Software patterns, popularized for the last half century of business, do not make as much sense today. To validate this assertion let's see if your share a similar experience:

During the micro-computer (PC) revolution we (as an industry) moved from time-sharing of a central large computer (mainframe), to a hierarchical partitioning of compute and storage. Initially we called this "client server", then "three tier architecture", and eventually "_n_-tier". Software and infrastructure analysis and design patterns emerged during this time period that served us well into the explosion of smart phones and the modern age.

Somewhere along this road, depending on where you worked at the time, "agile" methodologies became popular. In order to become more responsive to the needs of the business project timelines needed to shorten. We released more frequently, in smaller batches. The synchronization across large enterprise IT departments was foregone in the name of small teams and rapid iteration. The partitioning of teams necessitated the partitioning of systems, lest they be too bound to each other to move as quickly as desired. Microservices, an new term for an old concept (previously Service Oriented Architecture) became table stakes.

Breaking one workload into many put such burden on operations and "configuration management" that the principles of DevOps became a requirement. It also challenged infrastructure teams to provision and maintain flexible storage and compute environments. Various "cloud" like solutions became a necessity. Self-service beat work tickets, infrastructure-as-code beat run books, on-demand provisioning beat capacity planning, and so on.

At the same time, the previously mentioned smart phone revolution fundamentally changed expectations in business. Many services that previously relied on call-centers, store locations, agents, tellers, paper, mail and fax, all became **digital touch points**. An enterprise IT department that previously had centralized database, infrastructure, network, and software development all for the purposes of making software for people who were **paid to use the software** (employees) now had to design, plan, and implement systems at scale for a multitude of devices and networks.

It is uncomfortable but necessary to remind the reader that until the agile transformation >75% of enterprise software projects were considered **failures**. Consequently, to rise in the ranks of management during this period one had to develop a keen sense of risk aversion and deflection of blame. Decisions made at the top regularly reflect this.

While agile increased the responsiveness of enterprise IT departments it did not see a rise in technical proficiency. Indeed software architecture did not keep up with the rise in complexity and pace of features. Many companies are now waking up with a sort of "agile hangover".

The organization did not adapt properly to change either. The department responsible for upkeep of the payroll system and Windows desktop administration, found itself holding the bag on "digital transformation". The two could not be more misaligned. Digital business requires rapid experimentation, fault tolerance, and resiliency at scale. It is also often tied directly to a profit center. Enterprise IT, on the other hand, is a cost center. Regular outages and poor performance go largely unpunished. Orthodoxy and risk aversion seem to be the values.

Whilst _N_-tier architectures living in the corporate data center are perfectly well suited to a fixed set of users with predictable behavior and who are paid to use the system, these systems are falling over at scale. _N_-tier systems sharded into microservices has not simplified our problems it has multiplied them. For digital business we want to prioritize availability, resiliency, and fault tolerance. We don't want to lose orders online because a system somewhere in the "stack" had a millisecond hiccup. We don't want our flagship website to go down because of a flood of mobile traffic from a super bowl commercial. We don't want an international fleet of passenger aircraft to be grounded because of a broken VPN connection with a single vendor. Worst, we don't want a massive data breach because of an un-patched application server.

## Our beliefs

We require a first principles approach to digital business. Orthodoxy must be questioned, difficult truths must be grappled with, new design choices must be made.

In this journey I believe distributed systems principles, defined in the 1970's, will find a new home. If we look outside, we see evidence of their success for companies operating at scale. Distributed systems has an academic feel to it, with Stochastic we'd like to make it approachable, useful. To quote Alan Kay, _"simple things should be simple; complex things should be possible."_

I believe we will also discover that "serverless" architectures aligns tightly with digital business (and line of business applications). I believe serverless is so well aligned with business that I believe it will become the most popular thing in enterprise software development since object-oriented programming.

I'm willing to be proven wrong, but I think we can all agree that something must change if we are to keep our sanity.
