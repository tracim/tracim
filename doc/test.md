# Running tests #

## Intro ##

Tests on `Tracim` lays on [`nose` test tool](http://nose.readthedocs.io/en/latest/).

In order to use the `nosetests [...]` commands, change your current directory to be `tracim/` from the root of the project, also usually named `tracim/` :

    (tg2env) user@host:~/tracim$ cd tracim/
    (tg2env) user@host:~/tracim/tracim$

## All tests ##

    nosetests

## One test ##

    nosetests tracim/tests/models/test_content.py:TestContent.test_query

## Allow debugger ##

    nosetests -s
