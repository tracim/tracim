import os

import sys
from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
with open(os.path.join(here, 'README.md')) as f:
    README = f.read()
with open(os.path.join(here, 'CHANGES.txt')) as f:
    CHANGES = f.read()

requires = [
    # pyramid
    'plaster_pastedeploy',
    'pyramid >= 1.9a',
    'pyramid_debugtoolbar',
    'pyramid_jinja2',
    'pyramid_retry',
    'waitress',
    # Database
    'pyramid_tm',
    'SQLAlchemy',
    'transaction',
    'zope.sqlalchemy',
    'alembic',
    # API
    'hapic>=0.41',
    'marshmallow <3.0.0a1,>2.0.0',
    # CLI
    'cliff',
    # Webdav
    'wsgidav',
    'PyYAML',
    # others
    'filedepot',
    'babel',
    # mail-notifier
    'mako',
    'lxml',
    'redis',
    'rq',
]

tests_require = [
    'WebTest >= 1.3.1',  # py3 compat
    'pytest',
    'pytest-cov',
    'pep8',
    'mypy',
    'requests'
]

mysql_require = [
    'PyMySQL'
]

postgresql_require = [
    'psycopg2',
]
# Python version adaptations
if sys.version_info < (3, 5):
    requires.append('typing')


setup(
    name='tracim_backend',
    version='1.9.1',
    description='Rest API (Back-end) of Tracim v2',
    long_description=README + '\n\n' + CHANGES,
    classifiers=[
        'Development Status :: 2 - Pre-Alpha',
        'Programming Language :: Python',
        "Programming Language :: Python :: 3.4",
        "Programming Language :: Python :: 3.5",
        "Programming Language :: Python :: 3.6",
        'Framework :: Pyramid',
        'Topic :: Internet :: WWW/HTTP',
        'Topic :: Internet :: WWW/HTTP :: WSGI :: Application',
        'Topic :: Communications :: File Sharing',
        'Topic :: Communications',
        'License :: OSI Approved :: MIT License',
    ],
    author='',
    author_email='',
    url='https://github.com/tracim/tracim_backend',
    keywords='web pyramid tracim ',
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False,
    extras_require={
        'testing': tests_require,
        'mysql': mysql_require,
        'postgresql': postgresql_require,
    },
    install_requires=requires,
    entry_points={
        'paste.app_factory': [
            'main = tracim:web',
            'webdav = tracim:webdav'
        ],
        'console_scripts': [
            'tracimcli = tracim.command:main',
        ],
        'tracimcli': [
            'test = tracim.command:TestTracimCommand',
            'user_create = tracim.command.user:CreateUserCommand',
            'user_update = tracim.command.user:UpdateUserCommand',
            'db_init = tracim.command.database:InitializeDBCommand',
            'db_delete = tracim.command.database:DeleteDBCommand',
            'webdav start = tracim.command.webdav:WebdavRunnerCommand',
        ]
    },
)
