import React from 'react';
import clsx from 'clsx';
import styles from './HomepageFeatures.module.css';

const FeatureList = [
  {
    title: 'Explore and Map the Business Domain',
    Svg: require('../../static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Business and technical people collaboratively explore and map out 
        the desired systems events, commands, views, and behavior.
      </>
    ),
  },
  {
    title: 'Design a Scalable, Cloud-Native Solution',
    Svg: require('../../static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Technical people dive deeper into design and desired behavior.
        Stochastic provides framework for a cloud-native, scalable architecture.
      </>
    ),
  },
  {
    title: 'Create Infrastracture and Code',
    Svg: require('../../static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Stochastic creates the cloud infrastracture so developers can focus on
        application logic.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} alt={title} />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
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
  );
}
