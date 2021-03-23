# coding=utf-8

from pyramid.config import Configurator
from pyramid.httpexceptions import HTTPFound

from tracim_backend.app_models.contents import content_type_list
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import has_personal_access
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.models.context_models import PaginatedObject
from tracim_backend.models.favorites import FavoriteContent
from tracim_backend.views import BASE_API
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import ContentIdBodySchema
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.schemas import PaginatedContentDigestSchema
from tracim_backend.views.core_api.schemas import UserContentIdPathSchema
from tracim_backend.views.core_api.schemas import UserIdPathSchema
from tracim_backend.views.core_api.user_controller import SWAGGER_TAG__USER_CONTENT_ENDPOINTS

try:  # Python 3.5+
    from http import HTTPStatus
except ImportError:
    from http import client as HTTPStatus


SWAGGER_TAG__FAVORITE_SUBSECTION = "Favorites"
SWAGGER_TAG__USER_CONTENT_FAVORITE_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__USER_CONTENT_ENDPOINTS, SWAGGER_TAG__FAVORITE_SUBSECTION
)


class FavoriteContentController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_CONTENT_FAVORITE_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.FOUND)
    def user_content_favorite(self, context, request: TracimRequest, hapic_data=None) -> None:
        """
        Convenient route allowing to get detail about a favorite content
        This route generate a HTTP 302 with the right url
        """
        api = ContentApi(
            current_user=request.candidate_user,
            session=request.dbsession,
            config=request.app_config,
        )
        content = api.get_one_user_favorite_content(
            request.candidate_user.user_id, content_id=hapic_data.path.content_id
        )
        content_type = content_type_list.get_one_by_slug(content.type).slug
        # TODO - G.M - 2018-08-03 - Jsonify redirect response ?
        raise HTTPFound(
            "{base_url}workspaces/{workspace_id}/{content_type}s/{content_id}".format(
                base_url=BASE_API,
                workspace_id=content.workspace_id,
                content_type=content_type,
                content_id=content.content_id,
            )
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_CONTENT_FAVORITE_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserIdPathSchema())
    @hapic.output_body(PaginatedContentDigestSchema())
    def user_favorite_contents(
        self, context, request: TracimRequest, hapic_data=None
    ) -> PaginatedObject:
        """
        Get all user favorite contents in asc order (first is the oldest)
        """
        api = ContentApi(
            current_user=request.candidate_user,
            session=request.dbsession,
            config=request.app_config,
        )
        paged_contents = api.get_user_favorite_contents(
            user_id=request.candidate_user.user_id, order_by_properties=[FavoriteContent.created],
        )
        contents = [api.get_content_in_context(content) for content in paged_contents]
        return PaginatedObject(paged_contents, contents)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_CONTENT_FAVORITE_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserIdPathSchema())
    @hapic.input_body(ContentIdBodySchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def add_content_in_user_favorites(
        self, context, request: TracimRequest, hapic_data=None
    ) -> None:
        """
        set content as user favorite
        """
        api = ContentApi(
            current_user=request.candidate_user,
            session=request.dbsession,
            config=request.app_config,
        )
        content = api.get_one(content_id=hapic_data.body.get("content_id"))
        api.add_favorite(content, do_save=True)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_CONTENT_FAVORITE_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserContentIdPathSchema())
    @hapic.output_body(NoContentSchema(), default_http_code=HTTPStatus.NO_CONTENT)
    def remove_content_from_user_favorites(
        self, context, request: TracimRequest, hapic_data=None
    ) -> None:
        """
        remove content from user favorite
        """
        api = ContentApi(
            current_user=request.candidate_user,
            session=request.dbsession,
            config=request.app_config,
        )
        content = api.get_one(content_id=request.current_content.content_id)
        api.remove_favorite(content, do_save=True)

    def bind(self, configurator: Configurator):
        # Get Favorites content
        configurator.add_route(
            "user_favorite_contents", "/user/{user_id}/favorite-contents", request_method="GET",
        )
        configurator.add_view(self.user_favorite_contents, route_name="user_favorite_contents")

        configurator.add_route(
            "user_content_favorite",
            "/user/{user_id}/favorite-contents/{content_id}",
            request_method="GET",
        )
        configurator.add_view(self.user_content_favorite, route_name="user_content_favorite")

        # set content as favorite
        configurator.add_route(
            "add_content_in_user_favorites",
            "/user/{user_id}/favorite-contents",
            request_method="POST",
        )
        configurator.add_view(
            self.add_content_in_user_favorites, route_name="add_content_in_user_favorites"
        )

        # remove content from favorites
        configurator.add_route(
            "remove_content_from_user_favorites",
            "/user/{user_id}/favorite-contents/{content_id}",
            request_method="DELETE",
        )
        configurator.add_view(
            self.remove_content_from_user_favorites, route_name="remove_content_from_user_favorites"
        )
