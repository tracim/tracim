## CONTRIBUTE TO TRACIM

In order to contribute to Tracim source-code, please accept the licenses ([MIT](./LICENSE_MIT), [LGPLv3](LICENSE_LGPLv3) and [AGPLv3](LICENSE_AGPLv3)) and [Developer Certificate of Origin](./DCO).

To accept, you have to sign all your commits with the `-s` arg of `git commit` command ([more info here](https://git-scm.com/docs/git-commit#git-commit--s)).

## Tests

- For backend tests, check [backend/README.txt]('./backend/README.txt)
- For cypress tests, check [README.txt]('./README.txt')

## Code formatting and others checks

### Pre-commit

:warning: you need at least python 3.6 to run pre-commit (because of black requirement)

In order to follow most tracim guideline in yours commit, please use the precommit mecanism, this
will do some automatic check before committing to tracim and propose you fix.

To use it, you need `pre-commit` python package (installed automatically with `pip install -e ".[dev]"` on backend)
you can then install hooks with :

    pre-commit install

Then you just have to use `git commit` normally and see automatic check working.

### More informations
- check [backend/README.txt]('./backend/README.txt) for more information about used code
formatting check in backend.
