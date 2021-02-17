import typing

from sqlalchemy.orm import Session

from tracim_backend.config import CFG
from tracim_backend.exceptions import NoValidSearchEngine
from tracim_backend.models.auth import User

ELASTICSEARCH__SEARCH_ENGINE_SLUG = "elasticsearch"
SIMPLE__SEARCH_ENGINE_SLUG = "simple"


class SearchFactory(object):
    """
    Factory to get correct objects related to search engine activated
    """

    @classmethod
    def get_search_controller(cls, config: CFG):
        if config.SEARCH__ENGINE == ELASTICSEARCH__SEARCH_ENGINE_SLUG:
            # TODO - G.M - 2019-05-22 - fix circular import
            from tracim_backend.views.search_api.elasticsearch_controller import ESSearchController

            return ESSearchController()
        elif config.SEARCH__ENGINE == SIMPLE__SEARCH_ENGINE_SLUG:
            # TODO - G.M - 2019-05-22 - fix circular import
            from tracim_backend.views.search_api.simple_search_controller import (
                SimpleSearchController,
            )

            return SimpleSearchController()
        else:
            raise NoValidSearchEngine(
                "Can't provide search controller "
                ' because search engine provided "{}"'
                " is not valid".format(config.SEARCH__ENGINE)
            )

    @classmethod
    def get_elastic_search_api(
        cls, session: Session, current_user: typing.Optional[User], config: CFG
    ) -> "ESSearchApi":  # noqa: F821
        # TODO - G.M - 2019-05-22 - fix circular import
        from tracim_backend.lib.search.elasticsearch_search.elasticsearch_search import ESSearchApi

        return ESSearchApi(session=session, current_user=current_user, config=config)

    @classmethod
    def get_simple_search_api(
        cls, session: Session, current_user: typing.Optional[User], config: CFG
    ) -> "SimpleSearchApi":  # noqa: F821
        # TODO - G.M - 2019-05-22 - fix circular import
        from tracim_backend.lib.search.simple_search.simple_search_api import SimpleSearchApi

        return SimpleSearchApi(session=session, current_user=current_user, config=config)

    @classmethod
    def get_search_lib(
        cls, session: Session, current_user: typing.Optional[User], config: CFG
    ) -> typing.Union["ESSearchApi", "SimpleSearchApi"]:
        if config.SEARCH__ENGINE == ELASTICSEARCH__SEARCH_ENGINE_SLUG:
            return cls.get_elastic_search_api(session, current_user, config)

        if config.SEARCH__ENGINE == SIMPLE__SEARCH_ENGINE_SLUG:
            return cls.get_simple_search_api(session, current_user, config)

        raise NoValidSearchEngine(
            "Can't provide search lib"
            ' because the provided search engine "{}"'
            " is not valid".format(config.SEARCH__ENGINE)
        )
