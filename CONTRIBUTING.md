# Contribute

Thanks for taking the time to contribute :D

## How to

### Opening an issue

Before opening an issue, please check that the issue is not already opened.
If there is no issue similar to yours, feel free to create an issue and follow the template.

### Create a pull request

Once you have finished your development and you want to merge it on `develop`, please create a pull request. The pull request must have a title explicit, for example: `feat(frontend): <your feature>`. Once the pull request is created, follow the template.

### Contribute to the translation

[Tracim](https://www.algoo.fr/fr/tracim) translation is done through [Weblate](https://weblate.org/tracim/tracim/).<br>
Head over to [Weblate](https://weblate.org/tracim/tracim/) and contribute to the translation.

### Develop a new feature

You have a new feature to develop?<br>
Let's start by opening an issue with the feature template.<br>
Then create a branch from develop, which should be named `feat/<your ticket title>`.<br>
Now you can start coding :)

#### Development journey

##### Build
See [build](./doc/BUILD.md) to see how to build [Tracim](https://www.algoo.fr/fr/tracim). Especially the [development build section](./doc/BUILD.md#development-build).

##### Testing
See [testing](./doc/TESTING.md) to see how to test [Tracim](https://www.algoo.fr/fr/tracim) and your developments.

##### Commiting to the repository

First, you need to sign every commit you make with the `-s` arg of `git commit` command.<br>
See [git signature](https://git-scm.com/docs/git-commit#git-commit--s).

This will prove that you are the author of the commit and you have accepted the licenses ([MIT](https://opensource.org/licenses/MIT), [LGPLv3](https://www.gnu.org/licenses/lgpl-3.0.html) and [AGPLv3](https://www.gnu.org/licenses/agpl-3.0.html)) and [Developer Certificate of Origin](./DCO).

<!-- To remove -->
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
