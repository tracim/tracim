# -*- coding: utf-8 -*-
#quickstarted Options:
#
# sqlalchemy: True
# auth:       sqlalchemy
# mako:       True
#
#

#This is just a work-around for a Python2.7 issue causing
#interpreter crash at exit when trying to log an info message.
try:
    import logging
    import multiprocessing
except:
    pass

import sys
py_version = sys.version_info[:2]

try:
    from setuptools import setup, find_packages
except ImportError:
    from ez_setup import use_setuptools
    use_setuptools()
    from setuptools import setup, find_packages

testpkgs=['WebTest >= 1.2.3',
               'nose',
               'coverage',
               'gearbox'
               ]

install_requires=[
    "TurboGears2 >= 2.3.1",
    "Genshi",
    "Mako",
    "zope.sqlalchemy >= 0.4",
    "sqlalchemy",
    "alembic",
    "repoze.who",
    ]

setup(
    name='pod',
    version='0.1',
    description='Pod is collaborative software designed to allow people to work on and share various data and document types.',
    author='The POD team',
    author_email='damien.accorsi@free.fr',
    url='https://bitbucket.org/lebouquetin/pod',
    packages=find_packages(exclude=['ez_setup']),
    install_requires=install_requires,
    include_package_data=True,
    test_suite='nose.collector',
    tests_require=testpkgs,
    package_data={'pod': ['i18n/*/LC_MESSAGES/*.mo',
                                 'templates/*/*',
                                 'public/*/*']},
    message_extractors={'pod': [
            ('**.py', 'python', None),
            ('templates/**.mak', 'mako', {'input_encoding': 'utf-8'}),
            ('public/**', 'ignore', None)]},

    entry_points={
        'paste.app_factory': [
            'main = pod.config.middleware:make_app'
        ],
        'gearbox.plugins': [
            'turbogears-devtools = tg.devtools'
        ]
    },
    dependency_links=[
        "http://tg.gy/230"
        ],
    zip_safe=False
)
