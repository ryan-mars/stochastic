---
sidebar_position: 2
---

# A Treatise on Enterprise Software Architecture

> “all experience hath shewn, that mankind are more disposed to suffer, while evils are sufferable, than to right themselves by abolishing the forms to which they are accustomed.”
>
> ― Thomas Jefferson, The Declaration of Independence

## Why you may find yourself here

To put it simply, the world changed right underneath us. Software patterns, popularized for the last half century of business, do not make as much sense today.

To validate this assertion let's compare observations:

During the micro-computer (PC) revolution we (as an industry) moved from time-sharing of a central large computer (mainframe), to a hierarchical partitioning of compute and storage. Initially we called this "client/server", then "three tier architecture", and eventually "_n_-tier". Software and infrastructure analysis and design patterns emerged during this time period that served us well into the introduction of smart phones and the modern age.

Somewhere along this road, depending on where you worked at the time, "agile" methodologies became popular. Projects had to be delivered in shorter time frames in order to be more responsive to business. We released more frequently, in smaller batches. The synchronization across large enterprise IT departments was foregone in the name of small teams and rapid iteration. Whilst disruptive, the change brought speed and collaboration, a net positive. The partitioning of teams thus necessitated the partitioning of systems, lest they be too tightly bound to iterate quickly. Microservices, an new term for an old concept (Service Oriented Architecture) became table stakes.

Dividing one "monolithic" workload into many put such a burden on operations and "configuration management" that DevOps principles became a requirement. Microservices also challenged infrastructure teams to provision and maintain flexible storage and compute environments. Various "cloud" like solutions became a necessity. Self-service beat work tickets, infrastructure-as-code beat run books, on-demand provisioning beat capacity planning, and so on.

At the same time, the previously mentioned smart phone revolution fundamentally changed business expectations of technology. Many services that previously relied on call-centers, store locations, agents, tellers, paper, mail and fax, became **digital touch points**. The enterprise IT department had, until this point, centralized the administration of database, infrastructure, network, and software development. It made software for people who were **paid to use it** (employees). Now it had to design, plan, and implement **customer** systems at scale for a multitude of devices and networks.

It is uncomfortable but necessary to remind the reader that until the agile transformation >75% of enterprise software projects were considered **failures**. Consequently, to rise in the ranks of Enterprise IT during this period one had to develop a keen sense of risk aversion and deflection of blame. Leadership decisions regularly reflected this.

While agile increased the responsiveness of enterprise IT departments it did bring a commensurate rise in technical proficiency. Indeed software architecture did not keep pace with complexity and new features. Many companies are now waking up with a "tech debt hangover".

Structurally Enterprise IT did not adequately adapt either. The department responsible for upkeep of the payroll system and Windows desktop administration found itself holding the bag on "digital transformation". Digital business requires rapid experimentation, fault tolerance, and resiliency at scale. It is also often tied directly to a profit center. Enterprise IT, on the other hand, is a cost center. Regular outages and poor performance go largely unpunished. Orthodoxy and risk aversion seem to be the values. The two could not be more misaligned.

Whilst _N_-tier architectures living in the corporate data center are perfectly well suited to a fixed set of users with predictable behavior who are paid to use the system, these systems struggle at scale. Sharding _N_-tier systems into microservices has not simplified our problems it has multiplied them. Digital business rewards availability, resiliency, and fault tolerance. We shouldn't lose online orders because a system somewhere in the "stack" had a millisecond hiccup. Our flagship website shouldn't go down because of a flood of mobile traffic from a super bowl commercial. Our international fleet of passenger aircraft shouldn't be grounded because of a broken VPN connection with a single vendor. Worst, we shouldn't suffer massive data breaches because of un-patched application servers.

As technologists we find ourselves in a world of constant problem solving. Issues like those stated above are just another day at the office. The reality is however, we don't have to live like this. Our problems are shared by others like us, and many of them already have solutions.

> The world that we have made as a result of the level of thinking we have done thus far creates problems that we cannot solve at the same level as the level we created them at.
>
> — Albert Einstein (as quoted by Ram Dass)

## Our beliefs

We require a first principles approach to digital business. Orthodoxy must be questioned, difficult truths must be grappled with, new design choices must be made.

In this journey I believe distributed systems principles, defined in the 1970's, will find a new home. If we look outside, we see evidence of their success for companies operating at scale. Distributed systems has an academic feel to it, with Stochastic we'd like to make it approachable, useful. To quote Alan Kay, _"simple things should be simple; complex things should be possible."_

I believe we will also discover that "serverless" aligns with how digital business (and line of business applications) should view technology. Serverless is so well aligned with business fundamentals that I believe it will lead to the biggest change in enterprise software development since object-oriented programming.

I'm willing to be proven wrong, but I think we can all agree that something must change if we are to keep our sanity.
