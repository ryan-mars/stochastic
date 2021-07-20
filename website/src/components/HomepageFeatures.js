import React from "react"
import clsx from "clsx"
import styles from "./HomepageFeatures.module.css"

const FeatureList = [
  {
    title: "Learn Event Storming",
    link: "/docs/event-storming/",
    Svg: require("../../static/img/undraw_development.svg").default,
    description: (
      <>
        Business and technical people collaboratively explore and map out the desired systems events, commands, views,
        and behavior.
      </>
    ),
  },
  {
    title: "Design a Scalable Solution",
    link: "/docs/serverless/",
    Svg: require("../../static/img/undraw_software_engineer.svg").default,
    description: (
      <>Dive deeper into design and behavior. Stochastic puts the limitless scale of serverless within reach.</>
    ),
  },
  {
    title: "Create Infrastructure and Code",
    link: "/docs/stochastic/",
    Svg: require("../../static/img/undraw_dev_productivity.svg").default,
    description: (
      <>
        Stochastic creates the cloud infrastructure and application framework so developers can focus on the solution.
      </>
    ),
  },
]

function Feature({ Svg, title, description, link }) {
  return (
    <div className={clsx("col col--4")}>
      <a href={link}>
        <div className="text--center">
          <Svg className={styles.featureSvg} alt={title} />
        </div>
        <div className="text--center padding-horiz--md">
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </a>
    </div>
  )
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  )
}
