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
    "TurboGears2==2.3.7",
    "Genshi",
    "Mako",
    "zope.sqlalchemy >= 0.4",
    "sqlalchemy",
    "alembic",
    "repoze.who",
    "who-ldap==3.1.0",
    "python-ldap-test==0.2.0",
    ]

setup(
    name='tracim',
    version='1.0.0',
    description='Tracim is plateform software designed to improve traceability and productivity in collaborative work.',
    author='Damien ACCORSI',
    author_email='damien.accorsi@free.fr',
    url='https://github.com/tracim/tracim',
    packages=find_packages(exclude=['ez_setup']),
    install_requires=install_requires,
    include_package_data=True,
    test_suite='nose.collector',
    tests_require=testpkgs,
    package_data={'tracim': ['i18n/*/LC_MESSAGES/*.mo',
                                 'templates/*/*',
                                 'public/*/*']},
    message_extractors={'tracim': [
            ('**.py', 'python', None),
            ('templates/**.mak', 'mako', {'input_encoding': 'utf-8'}),
            ('public/**', 'ignore', None)]},

    entry_points={
        'paste.app_factory': [
            'main = tracim.config.middleware:make_app'
        ],
        'gearbox.plugins': [
            'turbogears-devtools = tg.devtools'
        ],
        'gearbox.commands': [
            'ldap_server = tracim.command.ldap_test_server:LDAPTestServerCommand',
        ]
    },
    dependency_links=[
        "http://tg.gy/230"
        ],
    zip_safe=False
)
