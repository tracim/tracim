## Contribute to Tracim

In order to contribute to Tracim, please accept the licenses ([MIT](./LICENSE_MIT), [LGPLv3](LICENSE_LGPLv3) and [AGPLv3](LICENSE_AGPLv3)) and [Developer Certificate of Origin](./DCO).

To accept, sign all your commits with the `-s` arg of `git commit` command ([more info here](https://git-scm.com/docs/git-commit#git-commit--s)).

## Tests

- For backend tests, check [backend/README.txt]('./backend/README.txt)
- For cypress tests, check [README.txt]('./README.txt')

## Code Formatting and Others Checks

### Pre-commit

To enforce most required guidelines, please use the precommit mechanism.
This will perform some automatic checks before committing.
This is required to contribute to Tracim.

To use it, you need the `pre-commit` Python package (installed with `pip install -r requirements-dev.txt` on the backend)
you can then install hooks with:

    pre-commit install

Then, you will be able to notice the automatic checks when running `git commit`.

Note: the pre-commit hook requires Python 3.6 or later to work.

### More Information
- see [backend/README.md](backend/README.txt) for more information about formatting checks work for the backend.
