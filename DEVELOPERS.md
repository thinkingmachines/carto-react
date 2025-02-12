# Developers

This is a monorepo, made with lerna and yarn workspaces. We recommend node version >=14.X

Clone and execute

```
  yarn
```

From now on, use one of the root level commands, that lerna will execute for all internal packages, like for example:

```
  yarn build
  yarn test
```

If you have issues, you can always run `yarn build:clean`. It will perform a full clean and then ensure that install, build and test work fine

## Link from carto-react-template

If you want to link these packages to the templates repo, build & then execute here

```
  yarn link-all
```

Then, inside the proper template folder in carto-react-template, link packages with:

```
  yarn link-carto-react
```

## npm release

You will need npm credentials under @carto organization.

To make a **prerelease**:

- Create a new branch from master, named after the new version (eg, if current version is v0.0.1-rc.5, name it `v0.0.1-rc.6`)
- Push that branch upstream, with something like `git push --set-upstream origin v0.0.1-rc.6`
- Open a PR, with for eg.: `https://github.com/CartoDB/carto-react/pull/new/v0.0.1-rc.6`
- Ask your peers for revision.
- Once it's ok execute locally `yarn prerelease`
- Chose Custom prerelease and ensure the packages version proposed is correct
- Once the npm package has been published, merge the PR to master

## Firebase deployment of storybook

(Restricted to CARTO developers)

@carto/react-ui package includes a storybook with UI components, which latest version is deployed at https://storybook-react.carto.com/

To deploy there a new update:

- Ensure you have the firebase CLI properly (installed and) configured
  ```
    firebase login
  ```
- Execute from root path:
  ```
    yarn storybook:publish
  ```
- That will publish the website to the Google Cloud Firebase project.
