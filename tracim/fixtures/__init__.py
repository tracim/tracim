import transaction

class Fixture(object):

    """ Fixture classes (list) required for this fixtures"""
    require = NotImplemented

    def __init__(self, session, config):
        self._session = session
        self._config = config

    def insert(self):
        raise NotImplementedError()


class FixturesLoader(object):
    """
    Fixtures loader. Load each fixture once.
    """

    def __init__(self, session, config, loaded=None):
        loaded = [] if loaded is None else loaded
        self._loaded = loaded
        self._session = session
        self._config = config

    def loads(self, fixtures_classes):
        for fixture_class in fixtures_classes:
            for required_fixture_class in fixture_class.require:
                self._load(required_fixture_class)
            self._load(fixture_class)

    def _load(self, fixture_class: Fixture):
        if fixture_class not in self._loaded:
            fixture = fixture_class(
                session=self._session,
                config=self._config,
            )
            fixture.insert()
            self._loaded.append(fixture_class)
            self._session.flush()
            transaction.commit()
