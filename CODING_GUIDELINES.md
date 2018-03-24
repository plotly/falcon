# Coding Guidelines

This is a live document that collects those coding guidelines we intend new code
to follow.


## ESLint

- Run `yarn lint` to validate your code.

- Don't commit code with ESLint errors (it'll make the build in CircleCI fail).

- Code with ESLint warnings won't make the build in CircleCI fail, but reviewers
  will likely request they're fixed before merging a contribution.


## Naming Conventions

### Path and Filenames

- Use lower case names and only alphanumeric characters (unless required
  otherwise).

- Avoid stuttering:
  - bad: `my-connector/my-connector-driver.js`
  - good: `my-connector/driver.js`

- Use the extension `.jsx` for files that contain JSX and `.js` for those that
  only contain JavaScript.

### Variable and Function Names

- Use JavaScript convention, i.e. camelCase.
