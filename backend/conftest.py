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


def pytest_collection_modifyitems(items):
    for item in items:
        if "tests/functional" not in item.nodeid and "tests/command" not in item.nodeid:
            item.add_marker(pytest.mark.quick)
        if "mailhog" in item.fixturenames:
            item.add_marker(pytest.mark.mail)
        if "elasticsearch" in item.fixturenames:
            item.add_marker(pytest.mark.elasticsearch)
