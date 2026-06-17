# Contributing to Multiplayer

The process is straight-forward.

 - Create your feature branch from latest `development` branch. Example: `MP-1234`
 - Do your work in feature branch
 - When both backend and frontend changes are done - merge feature branch into `development`

## Release

 - Merge `development` into `main`

## Commit changes

Multiplayer repository utilizes the conventional commit approach.

**NOTE**: There is a pre-commit hook that validates the commit message to make sure that it's
aligned with the conventional commit specification.

Please read the official documentation on the
[conventional commits website](https://www.conventionalcommits.org/en/v1.0.0/#summary) to get
yourself familiar with the approach.

Here are commit message examples that can be used and pass the validation:

```plain
feat(template): fix swagger title typo

Refs #CODE-1234
```

```plain
fix(template): fix swagger title typo. CODE-1234
```
