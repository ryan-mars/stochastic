const lightCodeTheme = require("prism-react-renderer/themes/github")
const darkCodeTheme = require("prism-react-renderer/themes/dracula")

/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: "Stochastic",
  tagline: "Cloud native, scalable, event-driven services made easy.",
  url: "https://stochastic.dev",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "stochastic", // Usually your GitHub org/user name.
  projectName: "stochastic", // Usually your repo name.
  themeConfig: {
    gtag: {
      // Google Anal ytics
      trackingID: "G-S7W7KQYLLX",
      anonymizeIP: true,
    },
    navbar: {
      title: "Stochastic",
      logo: {
        alt: "Stochastic logo",
        src: "img/stochastic.jpeg",
      },
      items: [
        {
          type: "doc",
          docId: "welcome",
          position: "left",
          label: "Docs",
        },
        { to: "/blog", label: "Blog", position: "left" },
        {
          href: "https://meetings.hubspot.com/ryan1694",
          label: "Free Q&A with Event Storming Experts",
          position: "right",
        },
        {
          href: "https://github.com/stochastic/stochastic",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Event Storming",
              to: "/docs/event-storming",
            },
            {
              label: "Blog",
              to: "/blog",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "Stack Overflow",
              href: "https://stackoverflow.com/questions/tagged/stochastic",
            },
            {
              label: "GitHub",
              href: "https://github.com/stochastic/stochastic",
            },
            // {
            //   label: "Twitter",
            //   href: "https://twitter.com/docusaurus",
            // },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Ryan Marsh. Built with Docusaurus.`,
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
    },
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          editUrl: "https://github.com/stochastic/stochastic/edit/master/website/",
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl: "https://github.com/stochastic/stochastic/edit/master/website/blog/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],
  scripts: [
    {
      src: "//js-na1.hs-scripts.com/20441412.js",
      async: true,
    },
  ],
}
