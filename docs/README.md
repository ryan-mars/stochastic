# Website

This website is built using [Docusaurus 2](https://docusaurus.io/), a modern static website generator.

## Installation

```console
npm install
```

## Local Development

```console
npm run start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```console
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Before Committing Your Changes

To verify that there are no mistakes with terminology references run:

```console
npm run check-terms
```

## Glossary

To preview the updated the Glossary run:

```console
npm run docusaurus glossary
```

`docs/glossary.md` will be overwritten on each deploy and should not be checked in.

## 🛑 WARNING

Never commit the changes from

```console
npm run docusaurus parse
```

As the terminology plugin actually edits all markdown files, the repository will show changes in `git diff`. It is highly recommended to avoid committing the changes, as the plugin will no longer be able to detect patterns that have been altered. This following steps will be performed in the CI environment.

```
npm run docusaurus parse
npm run docusaurus glossary
npm run build
```
