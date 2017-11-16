# -*- coding: utf-8 -*-
# quickstarted Options:
#  sqlalchemy: True
#  auth:       sqlalchemy
#  mako:       True
try:
    from setuptools import setup, find_packages
except ImportError:
    from ez_setup import use_setuptools
    use_setuptools()
    from setuptools import setup, find_packages


classifiers = [
    "License :: OSI Approved :: MIT License",
    "Programming Language :: Python",
    "Programming Language :: Python :: 3.4",
    "Programming Language :: Python :: 3.5",
    "Programming Language :: Python :: 3.6",
]

testpkgs = [
    'WebTest >= 1.2.3',
    'nose',
    'coverage',
    'gearbox',
]

install_requires = [
    'TurboGears2==2.3.7',
    'Genshi',
    'Mako',
    'zope.sqlalchemy >= 0.4',
    'sqlalchemy',
    'alembic',
    'repoze.who',
    'who_ldap>=3.2.1',
    'python-ldap-test==0.2.1',
    'unicode-slugify==0.1.3',
    'pytz==2014.7',
    'rq==0.7.1',
    'filedepot>=0.5.0',
    'preview-generator',
    'beautifulsoup4',
    'markdown',
    'email_reply_parser',
    'requests',
]

setup(
    name='tracim',
    version='1.0.0',
    description=(
        'Tracim is a plateform software designed to improve '
        'traceability and productivity in collaborative work.'
    ),
    author='Damien ACCORSI',
    author_email='damien.accorsi@free.fr',
    url='https://github.com/tracim/tracim',
    packages=find_packages(exclude=['ez_setup']),
    install_requires=install_requires,
    include_package_data=True,
    test_suite='nose.collector',
    tests_require=testpkgs,
    package_data={
        'tracim': [
            'i18n/*/LC_MESSAGES/*.mo',
            'templates/*/*',
            'public/*/*',
        ]
    },
    message_extractors={
        'tracim': [
            ('**.py', 'python', None),
            ('templates/**.mak', 'mako', {'input_encoding': 'utf-8'}),
            ('public/**', 'ignore', None)
        ]
    },
    entry_points={
        'paste.app_factory': [
            'main = tracim.config.middleware:make_app'
        ],
        'gearbox.plugins': [
            'turbogears-devtools = tg.devtools'
        ],
        'gearbox.commands': [
            'ldap_server = tracim.command.ldap_test_server:LDAPTestServerCommand',
            'user_create = tracim.command.user:CreateUserCommand',
            'user_update = tracim.command.user:UpdateUserCommand',
            'mail sender = tracim.command.mail:MailSenderCommend',
        ]
    },
    dependency_links=[
        'http://github.com/algoo/preview-generator/tarball/master#egg=preview_generator-1.0',
    ],
    zip_safe=False,
)
