# coding=utf-8
from http import HTTPStatus

from pyramid.config import Configurator

from tracim_backend.exceptions import FavoriteContentNotFound
from tracim_backend.extensions import hapic
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.utils.authorization import check_right
from tracim_backend.lib.utils.authorization import has_personal_access
from tracim_backend.lib.utils.request import TracimRequest
from tracim_backend.lib.utils.utils import generate_documentation_swagger_tag
from tracim_backend.models.context_models import FavoriteContentInContext
from tracim_backend.models.context_models import PaginatedObject
from tracim_backend.models.favorites import FavoriteContent
from tracim_backend.views.controllers import Controller
from tracim_backend.views.core_api.schemas import ContentIdBodySchema
from tracim_backend.views.core_api.schemas import FavoriteContentSchema
from tracim_backend.views.core_api.schemas import NoContentSchema
from tracim_backend.views.core_api.schemas import PaginatedFavoriteContentSchema
from tracim_backend.views.core_api.schemas import UserContentIdPathSchema
from tracim_backend.views.core_api.schemas import UserIdPathSchema
from tracim_backend.views.core_api.user_controller import SWAGGER_TAG__USER_CONTENT_ENDPOINTS

SWAGGER_TAG__FAVORITE_SUBSECTION = "Favorites"
SWAGGER_TAG__USER_CONTENT_FAVORITE_ENDPOINTS = generate_documentation_swagger_tag(
    SWAGGER_TAG__USER_CONTENT_ENDPOINTS, SWAGGER_TAG__FAVORITE_SUBSECTION
)


class FavoriteContentController(Controller):
    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_CONTENT_FAVORITE_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.handle_exception(FavoriteContentNotFound, http_code=HTTPStatus.BAD_REQUEST)
    @hapic.input_path(UserContentIdPathSchema())
    @hapic.output_body(FavoriteContentSchema())
    def user_content_favorite(
        self, context, request: TracimRequest, hapic_data=None
    ) -> FavoriteContentInContext:
        api = ContentApi(
            current_user=request.candidate_user,
            session=request.dbsession,
            config=request.app_config,
            show_deleted=True,
            show_archived=True,
        )
        favorite = api.get_one_user_favorite_content(
            user_id=request.candidate_user.user_id, content_id=hapic_data.path.content_id
        )
        return api.get_one_user_favorite_content_in_context(favorite)

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_CONTENT_FAVORITE_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserIdPathSchema())
    @hapic.output_body(PaginatedFavoriteContentSchema())
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
            show_deleted=True,
            show_archived=True,
        )
        return api.get_user_favorite_contents(
            user_id=request.candidate_user.user_id, order_by_properties=[FavoriteContent.created],
        )

    @hapic.with_api_doc(tags=[SWAGGER_TAG__USER_CONTENT_FAVORITE_ENDPOINTS])
    @check_right(has_personal_access)
    @hapic.input_path(UserIdPathSchema())
    @hapic.input_body(ContentIdBodySchema())
    @hapic.output_body(FavoriteContentSchema())
    def add_content_in_user_favorites(
        self, context, request: TracimRequest, hapic_data=None
    ) -> FavoriteContentInContext:
        """
        set content as user favorite
        """
        api = ContentApi(
            current_user=request.candidate_user,
            session=request.dbsession,
            config=request.app_config,
            show_deleted=True,
            show_archived=True,
        )
        content = api.get_one(content_id=hapic_data.body.get("content_id"))
        favorite = api.add_favorite(content, do_save=True)
        return api.get_one_user_favorite_content_in_context(favorite)

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
            show_deleted=True,
            show_archived=True,
        )
        api.remove_favorite(hapic_data.path.content_id, do_save=True)

    def bind(self, configurator: Configurator):
        # Get Favorites content
        configurator.add_route(
            "user_favorite_contents", "/users/{user_id}/favorite-contents", request_method="GET",
        )
        configurator.add_view(self.user_favorite_contents, route_name="user_favorite_contents")

        configurator.add_route(
            "user_content_favorite",
            "/users/{user_id}/favorite-contents/{content_id}",
            request_method="GET",
        )
        configurator.add_view(self.user_content_favorite, route_name="user_content_favorite")

        # set content as favorite
        configurator.add_route(
            "add_content_in_user_favorites",
            "/users/{user_id}/favorite-contents",
            request_method="POST",
        )
        configurator.add_view(
            self.add_content_in_user_favorites, route_name="add_content_in_user_favorites"
        )

        # remove content from favorites
        configurator.add_route(
            "remove_content_from_user_favorites",
            "/users/{user_id}/favorite-contents/{content_id}",
            request_method="DELETE",
        )
        configurator.add_view(
            self.remove_content_from_user_favorites, route_name="remove_content_from_user_favorites"
        )
