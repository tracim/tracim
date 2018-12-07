from collections import Callable

import pytest

from tracim_backend.lib.utils.request import TracimContext


class TestTracimContext(object):

    def test_unit_test_generate_if_none__ok__nominal_case(self) -> None:
        tracim_context = TracimContext()

        a = None

        class ANotFound(Exception):
            pass

        def a_id_fetcher():
            return '12'

        def a_generator(id_fetcher: Callable):
            try:
                return int(id_fetcher())
            except ValueError:
                raise ANotFound()

        a = tracim_context._generate_if_none(
            a,
            a_generator,
            a_id_fetcher
        )
        assert isinstance(a, int)
        assert a == 12

        # redo
        a = tracim_context._generate_if_none(
            a,
            a_generator,
            a_id_fetcher
        )
        assert isinstance(a, int)
        assert a == 12

    def test_unit_test_generate_if_none__ok__already_exist(self) -> None:
        tracim_context = TracimContext()

        a = 12

        a = tracim_context._generate_if_none(
            a,
            None,
            None
        )
        assert isinstance(a, int)
        assert a == 12

    def test_unit_test_generate_if_none__err__exception(self) -> None:
        tracim_context = TracimContext()

        a = None

        class ANotFound(Exception):
            pass

        def a_id_fetcher():
            raise ValueError()

        def a_generator(id_fetcher: Callable):
            try:
                return int(id_fetcher())
            except ValueError:
                raise ANotFound()

        with pytest.raises(ANotFound):
            tracim_context._generate_if_none(
                a,
                a_generator,
                a_id_fetcher
            )
