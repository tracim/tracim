def pytest_addoption(parser):
    parser.addoption("--database", action="append", default=[], help="database to run tests with")


def pytest_generate_tests(metafunc):
    if "sqlalchemy_database" in metafunc.fixturenames:
        databases = metafunc.config.getoption("database")
        if databases == ["all"]:
            databases = ["sqlite", "postgresql", "mysql", "mariadb"]
        elif not databases:
            databases = ["sqlite"]
        metafunc.parametrize("sqlalchemy_database", databases)
