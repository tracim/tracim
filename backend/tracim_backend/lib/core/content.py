# -*- coding: utf-8 -*-
from contextlib import contextmanager
import datetime
import os
import typing

from depot.io.utils import FileIntent
from hapic.data import HapicFile
from preview_generator.exception import UnsupportedMimeType
from preview_generator.manager import PreviewManager
from sqlakeyset import Page
from sqlakeyset import get_page
from sqlalchemy import desc
from sqlalchemy import func
from sqlalchemy import or_
from sqlalchemy.orm import Query
from sqlalchemy.orm import contains_eager
from sqlalchemy.orm.attributes import QueryableAttribute
from sqlalchemy.orm.attributes import get_history
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.sql.elements import and_
import transaction

from tracim_backend.app_models.contents import FOLDER_TYPE
from tracim_backend.app_models.contents import content_status_list
from tracim_backend.app_models.contents import content_type_list
from tracim_backend.config import CFG
from tracim_backend.exceptions import CannotGetDepotFileDepotCorrupted
from tracim_backend.exceptions import ConflictingMoveInChild
from tracim_backend.exceptions import ConflictingMoveInItself
from tracim_backend.exceptions import ContentFilenameAlreadyUsedInFolder
from tracim_backend.exceptions import ContentInNotEditableState
from tracim_backend.exceptions import ContentNamespaceDoNotMatch
from tracim_backend.exceptions import ContentNotFound
from tracim_backend.exceptions import ContentTypeNotExist
from tracim_backend.exceptions import EmptyCommentContentNotAllowed
from tracim_backend.exceptions import EmptyLabelNotAllowed
from tracim_backend.exceptions import FavoriteContentNotFound
from tracim_backend.exceptions import FileSizeOverMaxLimitation
from tracim_backend.exceptions import FileSizeOverOwnerEmptySpace
from tracim_backend.exceptions import FileSizeOverWorkspaceEmptySpace
from tracim_backend.exceptions import PreviewDimNotAllowed
from tracim_backend.exceptions import RevisionDoesNotMatchThisContent
from tracim_backend.exceptions import SameValueError
from tracim_backend.exceptions import UnallowedSubContent
from tracim_backend.exceptions import WorkspacesDoNotMatch
from tracim_backend.lib.core.notifications import NotifierFactory
from tracim_backend.lib.core.storage import StorageLib
from tracim_backend.lib.core.tag import TagLib
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.lib.utils.app import TracimContentType
from tracim_backend.lib.utils.logger import logger
from tracim_backend.lib.utils.sanitizer import HtmlSanitizer
from tracim_backend.lib.utils.sanitizer import HtmlSanitizerConfig
from tracim_backend.lib.utils.translation import Translator
from tracim_backend.lib.utils.utils import current_date_for_filename
from tracim_backend.models.auth import User
from tracim_backend.models.context_models import AuthoredContentRevisionsInfos
from tracim_backend.models.context_models import ContentInContext
from tracim_backend.models.context_models import FavoriteContentInContext
from tracim_backend.models.context_models import PaginatedObject
from tracim_backend.models.context_models import PreviewAllowedDim
from tracim_backend.models.context_models import RevisionInContext
from tracim_backend.models.data import ActionDescription
from tracim_backend.models.data import Content
from tracim_backend.models.data import ContentNamespaces
from tracim_backend.models.data import ContentRevisionRO
from tracim_backend.models.data import RevisionReadStatus
from tracim_backend.models.data import UserRoleInWorkspace
from tracim_backend.models.data import Workspace
from tracim_backend.models.favorites import FavoriteContent
from tracim_backend.models.revision_protection import new_revision
from tracim_backend.models.tracim_session import TracimSession

__author__ = "damien"


class AddCopyRevisionsResult(object):
    def __init__(
        self,
        new_content: Content,
        new_children_dict: typing.Dict[int, Content],
        original_children_dict: typing.Dict[int, Content],
    ) -> None:
        self.new_content = new_content
        self.new_children_dict = new_children_dict  # dict key is original content id
        self.original_children_dict = original_children_dict  # dict key is original content id


class ContentApi(object):

    # DISPLAYABLE_CONTENTS = (
    #     content_type_list.Folder.slug,
    #     content_type_list.File.slug,
    #     content_type_list.Comment.slug,
    #     content_type_list.Thread.slug,
    #     content_type_list.Page.slug,
    #     content_type_list.Page.slugLegacy,
    #     ContentType.MarkdownPage,
    # )

    def __init__(
        self,
        session: TracimSession,
        current_user: typing.Optional[User],
        config: CFG,
        show_archived: bool = False,
        show_deleted: bool = False,
        show_temporary: bool = False,
        show_active: bool = True,
        all_content_in_treeview: bool = True,
        force_show_all_types: bool = False,
        disable_user_workspaces_filter: bool = False,
        namespaces_filter: typing.Optional[typing.List[ContentNamespaces]] = None,
    ) -> None:
        session.assert_event_mechanism()
        self._session = session
        self._user = current_user
        self._config = config
        self._user_id = current_user.user_id if current_user else None
        self._show_archived = show_archived
        self._show_deleted = show_deleted
        self._show_temporary = show_temporary
        self._show_active = show_active
        self._show_all_type_of_contents_in_treeview = all_content_in_treeview
        self._force_show_all_types = force_show_all_types
        self._disable_user_workspaces_filter = disable_user_workspaces_filter
        self.preview_manager = PreviewManager(self._config.PREVIEW_CACHE_DIR, create_folder=True)
        default_lang = None
        if self._user:
            default_lang = self._user.lang
        self.translator = Translator(app_config=self._config, default_lang=default_lang)
        self.namespaces_filter = namespaces_filter

    @contextmanager
    def show(
        self, show_archived: bool = False, show_deleted: bool = False, show_temporary: bool = False
    ) -> typing.Generator["ContentApi", None, None]:
        """
        Use this method as context manager to update show_archived,
        show_deleted and show_temporary properties during context.
        :param show_archived: show archived contents
        :param show_deleted:  show deleted contents
        :param show_temporary:  show temporary contents
        """
        previous_show_archived = self._show_archived
        previous_show_deleted = self._show_deleted
        previous_show_temporary = self._show_temporary

        try:
            self._show_archived = show_archived
            self._show_deleted = show_deleted
            self._show_temporary = show_temporary
            yield self
        finally:
            self._show_archived = previous_show_archived
            self._show_deleted = previous_show_deleted
            self._show_temporary = previous_show_temporary

    def get_content_in_context(self, content: Content) -> ContentInContext:
        return ContentInContext(content, self._session, self._config, self._user)

    def get_revision_in_context(
        self, revision: ContentRevisionRO, version_number: typing.Optional[int] = None
    ) -> RevisionInContext:
        """Create a contextual objet from the given revision.

        The possibility to give the version_number is an optimization when returning
        several revisions (like in the xxx/revisions APIs).
        If not given revision.version_number is used.
        """
        # TODO - G.M - 2018-06-173 - create revision in context object
        return RevisionInContext(
            revision, self._session, self._config, self._user, version_number=version_number
        )

    def get_canonical_query(self) -> Query:
        """
        Return the Content/ContentRevision base query who join these table on the last revision.
        :return: Content/ContentRevision Query
        """
        return (
            self._session.query(Content)
            .join(ContentRevisionRO, Content.cached_revision_id == ContentRevisionRO.revision_id)
            .options(contains_eager(Content.current_revision))
        )

    def __real_base_query(
        self, workspaces: typing.Optional[typing.List[Workspace]] = None
    ) -> Query:
        result = self.get_canonical_query()

        # Exclude non displayable types
        if not self._force_show_all_types:
            result = result.filter(Content.type.in_(content_type_list.query_allowed_types_slugs()))

        if workspaces:
            workspace_ids = [workspace.workspace_id for workspace in workspaces]
            result = result.filter(Content.workspace_id.in_(workspace_ids))

        # Security layer: if user provided, filter
        # with user workspaces privileges
        if self._user and not self._disable_user_workspaces_filter:
            # Filter according to user workspaces
            workspace_ids = RoleApi(
                session=self._session, current_user=self._user, config=self._config
            ).get_user_workspaces_ids(self._user_id, UserRoleInWorkspace.READER)
            result = result.filter(
                or_(
                    Content.workspace_id.in_(workspace_ids),
                    # And allow access to non workspace document when he is owner
                    and_(
                        Content.workspace_id == None, Content.owner_id == self._user_id
                    ),  # noqa: E711
                )
            )

        return result

    def _base_query(self, workspaces: typing.Optional[typing.List[Workspace]] = None) -> Query:
        result = self.__real_base_query(workspaces)

        if not self._show_active:
            result = result.filter(
                or_(Content.is_deleted == True, Content.is_archived == True)
            )  # noqa: E711
        if not self._show_deleted:
            result = result.filter(Content.is_deleted == False)  # noqa: E711

        if not self._show_archived:
            result = result.filter(Content.is_archived == False)  # noqa: E711

        if not self._show_temporary:
            result = result.filter(Content.is_temporary == False)  # noqa: E711

        if self.namespaces_filter:
            result = result.filter(Content.content_namespace.in_(self.namespaces_filter))

        return result

    def __revisions_real_base_query(self, workspace: Workspace = None) -> Query:
        result = self._session.query(ContentRevisionRO)

        # Exclude non displayable types
        if not self._force_show_all_types:
            result = result.filter(Content.type.in_(self.DISPLAYABLE_CONTENTS))

        if workspace:
            result = result.filter(ContentRevisionRO.workspace_id == workspace.workspace_id)

        if self._user:
            user = self._session.query(User).get(self._user_id)
            # Filter according to user workspaces
            workspace_ids = [
                r.workspace_id for r in user.roles if r.role >= UserRoleInWorkspace.READER
            ]
            result = result.filter(ContentRevisionRO.workspace_id.in_(workspace_ids))

        return result

    def _revisions_base_query(self, workspace: Workspace = None) -> Query:
        result = self.__revisions_real_base_query(workspace)

        if not self._show_deleted:
            result = result.filter(ContentRevisionRO.is_deleted == False)  # noqa: E711

        if not self._show_archived:
            result = result.filter(ContentRevisionRO.is_archived == False)  # noqa: E711

        if not self._show_temporary:
            result = result.filter(Content.is_temporary == False)  # noqa: E711

        return result

    def get_base_query(self, workspaces: typing.Optional[typing.List[Workspace]]) -> Query:
        return self._base_query(workspaces)

    def _is_filename_available(
        self,
        filename: str,
        workspace: Workspace,
        content_namespace: ContentNamespaces,
        parent: Content = None,
        exclude_content_id: int = None,
    ) -> bool:
        """
        Check if content label is free
        :param filename: content label
        :param workspace: workspace of the content
        :param parent: parent of the content
        :param exclude_content_id: exclude a specific content_id (useful
        to verify  other content for content update)
        :return: True if content label is available
        """
        # INFO - G.M - 2018-09-04 - Method should not be used by special content
        # with empty filename like comment.
        assert filename
        assert workspace
        assert content_namespace
        label, file_extension = os.path.splitext(filename)
        query = self.get_base_query(workspaces=[workspace] if workspace else None)
        query = query.filter(Content.content_namespace == content_namespace)

        if parent:
            query = query.filter(Content.parent_id == parent.content_id)
        else:
            query = query.filter(Content.parent_id == None)  # noqa: E711

        if exclude_content_id:
            query = query.filter(Content.content_id != exclude_content_id)
        query = query.filter(Content.workspace_id == workspace.workspace_id)

        nb_content_with_the_filename = query.filter(Content.file_name == filename).count()
        if nb_content_with_the_filename == 0:
            return True
        elif nb_content_with_the_filename == 1:
            return False
        else:
            critical_error_text = (
                "Something is wrong in the database! "
                "Content filename should be unique "
                "in a same folder in database"
                "but you have {nb} content with "
                "filename {filename} "
                "in workspace {workspace_id}"
            )

            critical_error_text = critical_error_text.format(
                nb=nb_content_with_the_filename,
                filename=filename,
                workspace_id=workspace.workspace_id,
            )
            if parent:
                critical_error_text = "{text} and parent as content {parent_id}".format(
                    text=critical_error_text, parent_id=parent.parent_id
                )
            logger.critical(self, critical_error_text)
            return False

    def _prepare_filename(self, label: str, file_extension: str) -> str:
        """
        generate correct file_name from label and file_extension
        :return: valid
        """
        # TODO - G.M - 2018-10-11 - Find a way to
        # Refactor this in order to use same method
        # in both contentLib and .file_name of content
        return "{label}{file_extension}".format(label=label, file_extension=file_extension)

    def _is_filename_available_or_raise(
        self,
        filename: str,
        workspace: Workspace,
        parent: Content = None,
        content_namespace: ContentNamespaces = ContentNamespaces.CONTENT,
        exclude_content_id: int = None,
    ) -> bool:
        """
        Same as _is_filename_available but raise exception instead of
        returning boolean if content filename is already used
        """
        if self._is_filename_available(
            filename, workspace, content_namespace, parent, exclude_content_id
        ):
            return True
        # INFO - G.M - 2018-10-11 - prepare exception message
        exception_message = (
            "A Content already exist with the same filename "
            "{filename}  in workspace {workspace_id}"
        )
        exception_message = exception_message.format(
            filename=filename, workspace_id=workspace.workspace_id
        )
        if parent:
            exception_message = "{text} and parent as content {parent_id}".format(
                text=exception_message, parent_id=parent.parent_id
            )
        raise ContentFilenameAlreadyUsedInFolder(exception_message)

    def create(
        self,
        content_type_slug: str,
        workspace: Workspace,
        template_id: int = None,
        parent: Content = None,
        label: str = "",
        filename: str = "",
        do_save=False,
        is_temporary: bool = False,
        do_notify=True,
        content_namespace: ContentNamespaces = ContentNamespaces.CONTENT,
    ) -> Content:
        # TODO - G.M - 2018-07-16 - raise Exception instead of assert
        assert content_type_slug != content_type_list.Any_SLUG
        assert not (label and filename)
        assert content_namespace

        if (workspace and parent) and workspace.workspace_id != parent.workspace_id:
            raise WorkspacesDoNotMatch("new parent workspace and new workspace should be the same.")

        if (content_namespace and parent) and content_namespace != parent.content_namespace:
            raise ContentNamespaceDoNotMatch(
                "parent namespace and content namespace should be the same."
            )

        if content_type_slug == FOLDER_TYPE and not label:
            label = self.generate_folder_label(workspace, parent)

        if content_namespace == ContentNamespaces.PUBLICATION:
            workspace.check_for_publication()

        # TODO BS 2018-08-13: Despite that workspace is required, create_comment
        # can call here with None. Must update create_comment to require the
        # workspace.
        if not workspace and parent:
            workspace = parent.workspace
        content_type = content_type_list.get_one_by_slug(content_type_slug)

        self._check_valid_content_type_in_dir(content_type, parent, workspace)
        content = Content()

        if label:
            file_extension = ""
            if content_type.file_extension:
                file_extension = content_type.file_extension
            filename = self._prepare_filename(label, file_extension)
            self._is_filename_available_or_raise(filename, workspace, parent, content_namespace)
            # TODO - G.M - 2018-10-15 - Set file extension and label
            # explicitly instead of filename in order to have correct
            # label/file-extension separation.
            content.label = label
            content.file_extension = file_extension
        elif filename:
            self._is_filename_available_or_raise(filename, workspace, parent, content_namespace)
            # INFO - G.M - 2018-07-04 - File_name setting automatically
            # set label and file_extension
            content.file_name = filename
        else:
            if self._allow_empty_label(content_type_slug):
                # INFO - G.M - 2018-07-16 - Default label for comments is
                # empty string.
                content.label = ""
            else:
                raise EmptyLabelNotAllowed(
                    "Content of type {} should have a valid label".format(content_type_slug)
                )
        if self._user:
            content.owner = self._user
        content.parent = parent

        content.workspace = workspace
        content.type = content_type.slug
        content.is_temporary = is_temporary
        content.revision_type = ActionDescription.CREATION
        content.content_namespace = content_namespace

        if template_id:
            template = self.get_one(template_id)

            if label:
                content = self.copy(
                    template,
                    new_label=label,
                    new_workspace=workspace,
                    copy_revision=False,
                    do_save=False,
                )
            elif filename:
                content = self.copy(
                    template,
                    new_label=filename,
                    new_workspace=workspace,
                    copy_revision=False,
                    do_save=False,
                )

        if do_save:
            self._session.add(content)
            self.save(content, ActionDescription.CREATION, do_notify=do_notify)

            if template_id:
                tag_lib = TagLib(self._session)
                tags_values = tag_lib.get_all(content_id=template_id)

                for tag in tags_values:
                    tag_lib.add_tag_to_content(
                        user=self._user, content=content, tag_name=tag.tag_name
                    )

        return content

    def create_comment(
        self,
        workspace: Workspace = None,
        parent: Content = None,
        content: str = "",
        do_save=False,
        do_notify=True,
    ) -> Content:
        # TODO: check parent allowed_type and workspace allowed_ type
        assert parent and parent.type != FOLDER_TYPE
        if not self.is_editable(parent):
            raise ContentInNotEditableState(
                "Can't create comment on content, you need to change its"
                "status or state (deleted/archived) before any change."
            )

        config = HtmlSanitizerConfig(tag_blacklist=["script"], tag_whitelist=list())
        sanitizer = HtmlSanitizer(html_body=content, config=config)
        content = sanitizer.sanitize_html()
        if (not content) or sanitizer.html_is_empty():
            raise EmptyCommentContentNotAllowed()

        item = self.create(
            content_type_slug=content_type_list.Comment.slug,
            workspace=workspace,
            parent=parent,
            content_namespace=parent.content_namespace,
            do_notify=False,
            do_save=False,
            label="",
        )
        item.raw_content = content
        item.revision_type = ActionDescription.COMMENT
        if do_save:
            self.save(item, ActionDescription.COMMENT, do_notify=do_notify)
        return item

    def get_one_from_revision(
        self, content_id: int, content_type: str, workspace: Workspace = None, revision_id=None
    ) -> Content:
        """
        This method is a hack to convert a node revision item into a node
        :param content_id:
        :param content_type:
        :param workspace:
        :param revision_id:
        :return:
        """

        content = self.get_one(content_id, content_type, workspace)
        revision = (
            self._session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.revision_id == revision_id)
            .one()
        )

        if revision.content_id == content.content_id:
            content.revision_to_serialize = revision.revision_id
        else:
            raise ValueError("Revision not found for given content")

        return content

    def get_one(
        self,
        content_id: int,
        content_type: str = content_type_list.Any_SLUG,
        workspace: Workspace = None,
        parent: Content = None,
        ignore_content_state_filter: bool = False,
    ) -> typing.Optional[Content]:

        if not content_id:
            return None

        workspaces = [workspace] if workspace else None

        if ignore_content_state_filter:
            base_request = self.__real_base_query(workspaces=workspaces)
        else:
            base_request = self._base_query(workspaces=workspaces)

        base_request = base_request.filter(Content.content_id == content_id)

        if content_type != content_type_list.Any_SLUG:
            base_request = base_request.filter(Content.type == content_type)

        if parent:
            base_request = base_request.filter(Content.parent_id == parent.content_id)

        try:
            content = base_request.one()
        except NoResultFound as exc:
            # TODO - G.M - 2018-07-16 - Add better support for all different
            # error case who can happened here
            # like content doesn't exist, wrong parent, wrong content_type, wrong workspace,
            # wrong access to this workspace, wrong base filter according
            # to content_status.
            raise ContentNotFound('Content "{}" not found in database'.format(content_id)) from exc
        return content

    def get_one_revision(
        self, revision_id: int = None, content: Content = None
    ) -> ContentRevisionRO:
        """
        This method allow us to get directly any revision with its id
        :param revision_id: The content's revision's id that we want to return
        :param content: The content related to the revision, if None do not
        check if revision is related to this content.
        :return: An item Content linked with the correct revision
        """
        assert revision_id is not None  # DYN_REMOVE

        revision = (
            self._session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.revision_id == revision_id)
            .one()
        )
        if content and revision.content_id != content.content_id:
            raise RevisionDoesNotMatchThisContent(
                "revision {revision_id} is not a revision of content {content_id}".format(
                    revision_id=revision.revision_id, content_id=content.content_id
                )
            )
        return revision

    @contextmanager
    def get_one_revision_filepath(self, revision_id: int) -> typing.Generator[str, None, None]:
        """
        This method allows us to directly get a file path from its revision
        identifier.
        :param revision_id: The revision id of the filepath we want to return
        :return: The corresponding filepath
        """
        # TODO: - G.M - 2021-01-20 - remove this when direct specific method
        #  of new StorageLib are used everywhere see #4079
        revision = self.get_one_revision(revision_id)
        yield from StorageLib(app_config=self._config).get_filepath(
            revision.depot_file,
            file_extension=revision.file_extension,
            temporary_prefix="tracim-revision-content",
        )

    # TODO - G.M - 2018-09-04 - & R.J - 2021-06-10 - [Cleanup] this method is only used in a test,
    # we may want to move it there (tests/library/test_content_api.py)
    def get_one_by_label_and_parent(
        self, content_label: str, content_parent: Content = None
    ) -> Content:
        """
        This method let us request the database to obtain a Content with its name and parent
        :param content_label: Either the content's label or the content's filename if the label is None
        :param content_parent: The parent's content
        :return The corresponding Content
        """
        workspaces = [content_parent.workspace] if content_parent else None
        query = self._base_query(workspaces)
        parent_id = content_parent.content_id if content_parent else None
        query = query.filter(Content.parent_id == parent_id)

        file_name, file_extension = os.path.splitext(content_label)

        # TODO - G.M - 2018-09-04 - If this method is needed, it should be
        # rewritten in order to avoid content_type hardcoded code there
        try:
            return query.filter(
                or_(
                    and_(
                        Content.type == content_type_list.File.slug,
                        Content.label == file_name,
                        Content.file_extension == file_extension,
                    ),
                    and_(Content.type == content_type_list.Thread.slug, Content.label == file_name),
                    and_(Content.type == content_type_list.Page.slug, Content.label == file_name),
                    and_(
                        Content.type == content_type_list.Folder.slug,
                        Content.label == content_label,
                    ),
                )
            ).one()
        except NoResultFound as exc:
            raise ContentNotFound(
                'Content "{}" not found in database'.format(content_label)
            ) from exc

    def get_one_by_filename(
        self, filename: str, workspace: Workspace, parent: typing.Optional[Content] = None,
    ):
        query = self._base_query([workspace] if workspace else None)
        query = query.filter((Content.label + Content.file_extension) == filename)
        if parent:
            query = query.filter(Content.parent_id == parent.content_id)
        else:
            query = query.filter(Content.parent_id == None)  # noqa: E711
        try:
            return query.order_by(Content.cached_revision_id.desc()).one()
        except NoResultFound as exc:
            if parent:
                parent_string = "with parent {}".format(parent.content_id)
            else:
                parent_string = "at workspace root"
            raise ContentNotFound(
                'Content with filename "{}" {} in workspace "{}" not found'.format(
                    filename, parent_string, workspace.workspace_id
                )
            ) from exc

    def get_one_page_pdf_preview(
        self,
        revision: ContentRevisionRO,
        page_number: int,
        filename: str,
        default_filename: str,
        force_download: bool = None,
    ):
        return StorageLib(self._config).get_one_page_pdf_preview(
            depot_file=revision.depot_file,
            filename=filename,
            default_filename=default_filename,
            page_number=page_number,
            original_file_extension=revision.file_extension,
            force_download=force_download,
        )

    def get_full_pdf_preview(
        self,
        revision: ContentRevisionRO,
        filename: str,
        default_filename: str,
        force_download: bool = None,
    ):
        return StorageLib(self._config).get_full_pdf_preview(
            depot_file=revision.depot_file,
            filename=filename,
            default_filename=default_filename,
            original_file_extension=revision.file_extension,
            force_download=force_download,
        )

    def get_jpg_preview_allowed_dim(self) -> PreviewAllowedDim:
        """
        Get jpg preview allowed dimensions and strict bool param.
        """
        return PreviewAllowedDim(
            self._config.PREVIEW__JPG__RESTRICTED_DIMS, self._config.PREVIEW__JPG__ALLOWED_DIMS
        )

    def get_jpeg_preview(
        self,
        revision: ContentRevisionRO,
        page_number: int,
        filename: str,
        default_filename: str,
        width: int = None,
        height: int = None,
        force_download: bool = False,
    ) -> HapicFile:
        """
        Get jpg preview of revision of content
        :param revision_id: id of content revision
        :param page_number: page number of the preview, useful for multipage
        content
        :param file_extension: file extension of the file
        :param width: width in pixel
        :param height: height in pixel
        :param force_download: should the file by downloaded
        :return: preview_path as string
        """
        if not width and not height:
            width = self._config.PREVIEW__JPG__ALLOWED_DIMS[0].width
            height = self._config.PREVIEW__JPG__ALLOWED_DIMS[0].height

        allowed_dim = False
        for preview_dim in self._config.PREVIEW__JPG__ALLOWED_DIMS:
            if width == preview_dim.width and height == preview_dim.height:
                allowed_dim = True
                break

        if not allowed_dim and self._config.PREVIEW__JPG__RESTRICTED_DIMS:
            raise PreviewDimNotAllowed(
                "Size {width}x{height} is not allowed for jpeg preview".format(
                    width=width, height=height
                )
            )
        return StorageLib(self._config).get_jpeg_preview(
            depot_file=revision.depot_file,
            filename=filename,
            default_filename=default_filename,
            page_number=page_number,
            width=width,
            height=height,
            original_file_extension=revision.file_extension,
            force_download=force_download,
        )

    def get_all_query(
        self,
        parent_ids: typing.Optional[typing.List[int]] = None,
        content_type_slug: str = content_type_list.Any_SLUG,
        workspaces: typing.Optional[typing.List[Workspace]] = None,
        label: typing.Optional[str] = None,
        order_by_properties: typing.Optional[
            typing.List[typing.Union[str, QueryableAttribute]]
        ] = None,
        complete_path_to_id: typing.Optional[int] = None,
        user: typing.Optional[User] = None,
    ) -> Query:
        """
        Extended filter for better "get all data" query
        :param parent_ids: filter by parent_ids
        :param content_type_slug: filter by content_type slug
        :param workspaces: filter by workspaces
        :param complete_path_to_id: add all parent(root included) of content_id
        given there to parent_ids filter.
        :param order_by_properties: filter by properties can be both string of
        attribute or attribute of Model object from sqlalchemy(preferred way,
        QueryableAttribute object)
        :return: Query object
        """
        order_by_properties = order_by_properties or []  # FDV
        assert not parent_ids or isinstance(parent_ids, list)
        assert content_type_slug is not None
        assert not complete_path_to_id or isinstance(complete_path_to_id, int)
        query = self._base_query(workspaces=workspaces)

        # INFO - G.M - 2018-11-12 - Get list of all ancestror
        #  of content, workspace root included
        if complete_path_to_id:
            content = self.get_one(
                complete_path_to_id, content_type_list.Any_SLUG, ignore_content_state_filter=True
            )
            if content.parent_id:
                content = content.parent
                while content.parent_id:
                    parent_ids.append(content.content_id)
                    content = content.parent
                parent_ids.append(content.content_id)
            # TODO - G.M - 2018-11-12 - add workspace root to
            # parent_ids list when complete_path_to_id is set
            parent_ids.append(0)

        if content_type_slug != content_type_list.Any_SLUG:
            # INFO - G.M - 2018-07-05 - convert with
            #  content type object to support legacy slug
            content_type_object = content_type_list.get_one_by_slug(content_type_slug)
            all_slug_aliases = [content_type_object.slug]
            if content_type_object.slug_aliases:
                all_slug_aliases.extend(content_type_object.slug_aliases)
            query = query.filter(Content.type.in_(all_slug_aliases))

        if parent_ids is False:
            query = query.filter(Content.parent_id == None)  # noqa: E711

        if parent_ids:
            # TODO - G.M - 2018-11-09 - Adapt list in order to deal with root
            # case properly
            allowed_parent_ids = []
            allow_root = False
            for parent_id in parent_ids:
                if parent_id == 0:
                    allow_root = True
                else:
                    allowed_parent_ids.append(parent_id)
            if allow_root:
                query = query.filter(
                    or_(
                        Content.parent_id.in_(allowed_parent_ids), Content.parent_id == None
                    )  # noqa: E711
                )
            else:
                query = query.filter(Content.parent_id.in_(allowed_parent_ids))
        if label:
            query = query.filter(Content.label.ilike("%{}%".format(label)))
        if user:
            author_id_query = (
                self._session.query(ContentRevisionRO.owner_id)
                .filter(ContentRevisionRO.content_id == Content.id)
                .order_by(ContentRevisionRO.revision_id)
                .limit(1)
            )
            query = query.filter(or_(Content.owner == user, user.user_id == author_id_query))

        for _property in order_by_properties:
            query = query.order_by(_property)

        return query

    def get_all(
        self,
        parent_ids: typing.Optional[typing.List[int]] = None,
        content_type: str = content_type_list.Any_SLUG,
        workspaces: typing.Optional[typing.List[Workspace]] = None,
        label: typing.Optional[str] = None,
        order_by_properties: typing.Optional[
            typing.List[typing.Union[str, QueryableAttribute]]
        ] = None,
        complete_path_to_id: typing.Optional[int] = None,
        page_token: typing.Optional[str] = None,
        count: typing.Optional[int] = None,
        acp: typing.Optional[str] = None,
    ) -> Page:
        """
        Return all content using some filters
        :param parent_ids: filter by parent_id
        :param complete_path_to_id: filter by path of content_id
        (add all parent, root included to parent_ids filter)
        :param content_type: filter by content_type slug
        :param workspaces: filter by workspaces
        :param order_by_properties: filter by properties can be both string of
        attribute or attribute of Model object from sqlalchemy(preferred way,
        QueryableAttribute object)
        :param page_token: the page token of this paged request
        :param count: the number of elements per page
        :return: Paged list of contents
        """
        query = self.get_all_query(
            parent_ids, content_type, workspaces, label, order_by_properties, complete_path_to_id
        )
        if count:
            return get_page(query, per_page=count, page=page_token or False)
        return Page(query.all())

    def get_last_active(
        self,
        workspace: typing.Optional[Workspace] = None,
        limit: typing.Optional[int] = None,
        before_content: typing.Optional[Content] = None,
        content_ids: typing.Optional[typing.List[int]] = None,
    ) -> typing.List[Content]:
        """
        get contents list sorted by last update
        (last modification of content itself or one of this comment)
        :param workspace: Workspace to check
        :param limit: maximum number of elements to return
        :param before_content: last_active content are only those updated
         before this content given.
        :param content_ids: restrict selection to some content ids and
        related Comments
        :return: list of content
        """

        resultset = (
            self.get_all_query(workspaces=[workspace] if workspace else None)
            .outerjoin(
                RevisionReadStatus,
                and_(
                    RevisionReadStatus.revision_id == Content.cached_revision_id,
                    RevisionReadStatus.user_id == self._user_id,
                ),
            )
            .options(
                contains_eager(Content.current_revision).contains_eager(
                    ContentRevisionRO.revision_read_statuses
                )
            )
        )

        if content_ids:
            resultset = resultset.filter(
                or_(
                    Content.content_id.in_(content_ids),
                    and_(
                        Content.parent_id.in_(content_ids),
                        Content.type == content_type_list.Comment.slug,
                    ),
                )
            )

        resultset = resultset.order_by(
            desc(ContentRevisionRO.updated),
            desc(ContentRevisionRO.revision_id),
            desc(ContentRevisionRO.content_id),
        )

        active_contents = []
        too_recent_content = []
        before_content_find = False
        for content in resultset:
            related_active_content = None
            if content_type_list.Comment.slug == content.type:
                related_active_content = content.parent
            else:
                related_active_content = content

            # INFO - G.M - 2018-08-10 - re-apply general filters here to avoid
            # issue with comments
            if not self._show_deleted and related_active_content.is_deleted:
                continue
            if not self._show_archived and related_active_content.is_archived:
                continue

            if (
                related_active_content not in active_contents
                and related_active_content not in too_recent_content
            ):

                if not before_content or before_content_find:
                    active_contents.append(related_active_content)
                else:
                    too_recent_content.append(related_active_content)

                if before_content and related_active_content == before_content:
                    before_content_find = True

            if limit and len(active_contents) >= limit:
                break

        return active_contents

    def _set_allowed_content(self, content: Content, allowed_content_dict: dict) -> Content:
        """
        :param content: the given content instance
        :param allowed_content_dict: must be something like this:
            dict(
                folder = True
                thread = True,
                file = False,
                page = True
            )
        :return: content
        """
        properties = content.properties.copy()
        if set(properties["allowed_content"]) == set(allowed_content_dict):
            raise SameValueError("Content allowed content did not change")
        properties["allowed_content"] = allowed_content_dict
        content.properties = properties
        return content

    def set_allowed_content(
        self, content: Content, allowed_content_type_slug_list: typing.List[str]
    ) -> Content:
        """
        :param content: the given content instance
        :param allowed_content_type_slug_list: list of content_type_slug to
        accept as subcontent.
        :return: nothing
        """
        allowed_content_dict = {}
        for allowed_content_type_slug in allowed_content_type_slug_list:
            if allowed_content_type_slug not in content_type_list.endpoint_allowed_types_slug():
                raise ContentTypeNotExist(
                    "Content_type {} does not exist".format(allowed_content_type_slug)
                )
            allowed_content_dict[allowed_content_type_slug] = True

        return self._set_allowed_content(content, allowed_content_dict)

    def restore_content_default_allowed_content(self, content: Content) -> None:
        """
        Return to default allowed_content_types
        :param content: the given content instance
        :return: nothing
        """
        if content._properties and "allowed_content" in content._properties:
            properties = content.properties.copy()
            del properties["allowed_content"]
            content.properties = properties

    def set_status(self, content: Content, new_status: str):
        if new_status in content_status_list.get_all_slugs_values():
            if self._user:
                content.owner = self._user
            content.status = new_status
            content.revision_type = ActionDescription.STATUS_UPDATE
        else:
            raise ValueError("The given value {} is not allowed".format(new_status))

    def move(
        self,
        item: Content,
        new_parent: Content = None,
        new_content_namespace: ContentNamespaces = None,
        must_stay_in_same_workspace: bool = True,
        new_workspace: Workspace = None,
    ) -> None:
        if new_content_namespace == ContentNamespaces.PUBLICATION:
            (new_workspace or item.workspace).check_for_publication()
        self._move_current(
            item, new_parent, must_stay_in_same_workspace, new_workspace, new_content_namespace
        )
        self.save(item)
        self._move_children_content_to_new_workspace(item, new_workspace, new_content_namespace)

    def _move_current(
        self,
        item: Content,
        new_parent: Content = None,
        must_stay_in_same_workspace: bool = True,
        new_workspace: Workspace = None,
        new_content_namespace: ContentNamespaces = None,
    ) -> None:
        """
        Move only current content, use _move_children_content_to_new_workspace
        to fix workspace_id of children.
        """

        self._check_move_conflicts(item, new_parent)

        if must_stay_in_same_workspace:
            if new_parent and new_parent.workspace_id != item.workspace_id:
                raise ValueError("the item should stay in the same workspace")

        if not new_workspace:
            new_workspace = new_parent.workspace

        if new_parent and new_parent.workspace_id != new_workspace.workspace_id:
            raise WorkspacesDoNotMatch("new parent workspace and new workspace should be the same.")

        if (
            new_content_namespace and new_parent
        ) and new_content_namespace != new_parent.content_namespace:
            raise ContentNamespaceDoNotMatch(
                "parent namespace and content namespace should be the same."
            )

        # INFO - G.M - 2018-12-11 - We allow renaming existing wrong file
        # but not adding new content of wrong type.
        if new_parent and new_parent != item.parent:
            content_type = content_type_list.get_one_by_slug(item.type)
            self._check_valid_content_type_in_dir(content_type, new_parent, new_workspace)
        if self._user:
            item.owner = self._user
        item.parent = new_parent

        if new_content_namespace:
            item.content_namespace = new_content_namespace
        else:
            if new_parent:
                item.content_namespace = new_parent.content_namespace

        if new_workspace:
            item.workspace = new_workspace
        else:
            if new_parent:
                item.workspace = new_parent.workspace
        content_type_slug = item.type
        if item.file_name:
            self._is_filename_available_or_raise(
                item.file_name,
                item.workspace,
                item.parent,
                content_namespace=item.content_namespace,
                exclude_content_id=item.content_id,
            )
        elif self._allow_empty_label(content_type_slug):
            # INFO - G.M - 2019-04-29 - special content like "Comment"
            # which allow empty filename should not
            # check filename availability
            pass
        else:
            # INFO - G.M - 2019-04-29 - this case should not happened if data are correct
            raise EmptyLabelNotAllowed(
                "content {} of type {} should always have a label "
                "and a valid filename".format(item.content_id, content_type_slug)
            )
        item.revision_type = ActionDescription.MOVE

    def _get_allowed_content_type(
        self, allowed_content_dict: typing.Dict[str, str]
    ) -> typing.List[TracimContentType]:
        allowed_content_type = []  # type: typing.List[TracimContentType]
        for slug, value in allowed_content_dict.items():
            if value:
                try:
                    content_type = content_type_list.get_one_by_slug(slug)
                    allowed_content_type.append(content_type)
                except ContentTypeNotExist:
                    pass
        return allowed_content_type

    def _check_valid_content_type_in_dir(
        self, content_type: TracimContentType, parent: Content, workspace: Workspace
    ) -> None:
        if parent:
            assert workspace == parent.workspace
            if parent.properties and "allowed_content" in parent.properties:
                if content_type not in self._get_allowed_content_type(
                    parent.properties["allowed_content"]
                ):
                    raise UnallowedSubContent(
                        " SubContent of type {subcontent_type}  not allowed in content {content_id}".format(
                            subcontent_type=content_type.slug, content_id=parent.content_id
                        )
                    )
        if workspace:
            if content_type not in workspace.get_allowed_content_types():
                raise UnallowedSubContent(
                    " SubContent of type {subcontent_type}  not allowed in workspace {content_id}".format(
                        subcontent_type=content_type.slug, content_id=workspace.workspace_id
                    )
                )

    def _check_move_conflicts(self, content: Content, new_parent: Content = None):
        if new_parent:
            if content.content_id == new_parent.content_id:
                raise ConflictingMoveInItself("You can't move a content into itself")
            if new_parent in content.get_children(recursively=True):
                raise ConflictingMoveInChild("You can't move a content into one of its children")

    def copy(
        self,
        item: Content,
        new_parent: Content = None,
        new_label: str = None,
        new_workspace: Workspace = None,
        new_file_extension: str = None,
        new_content_namespace: ContentNamespaces = ContentNamespaces.CONTENT,
        copy_revision: bool = True,
        do_save: bool = True,
        do_notify: bool = True,
    ) -> Content:
        """
        Copy all content, revision and children included (children are included
        recursively).

        This method copy :
        - The content with all theses revisions (content and content_revisions table)
        - His children content (not only comments) recursively with all theses revisions
        (content and content_revisions table)

        This method does NOT copy some info related to content:
        - reactions on content or children (reaction table)
        - content share link (content_shares table element) on content or children content
        - user content favorites (favorite_contents table)

        :param item: Item to copy
        :param new_parent: new parent of the new copied item
        :param new_label: new label of the new copied item
        :param do_notify: notify copy or not
        :return: Newly copied item
        """
        if new_content_namespace == ContentNamespaces.PUBLICATION:
            (new_workspace or item.workspace).check_for_publication()
        if (not new_parent and not new_label and not new_file_extension and not new_workspace) or (
            new_parent == item.parent
            and new_label == item.label
            and new_file_extension == item.file_extension
            and item.workspace == new_workspace
        ):
            # TODO - G.M - 08-03-2018 - Use something else than value error
            raise ValueError("You can't copy file into itself")

        if (new_workspace and new_parent) and new_parent.workspace_id != new_workspace.workspace_id:
            raise WorkspacesDoNotMatch("new parent workspace and new workspace should be the same.")

        if (
            new_content_namespace and new_parent
        ) and new_content_namespace != new_parent.content_namespace:
            raise ContentNamespaceDoNotMatch(
                "parent namespace and content namespace should be the same."
            )

        if new_parent:
            workspace = new_parent.workspace
            parent = new_parent
            content_namespace = new_parent.content_namespace
        elif new_workspace:
            workspace = new_workspace
            parent = None
            content_namespace = new_content_namespace or item.content_namespace
        else:
            workspace = item.workspace
            parent = item.parent
            content_namespace = new_content_namespace or item.content_namespace

        # INFO - G.M - 2018-12-11 - Do not allow copy file in a dir where
        # this kind of content is not allowed.
        if parent:
            content_type = content_type_list.get_one_by_slug(item.type)
            self._check_valid_content_type_in_dir(content_type, parent, workspace)
        label = new_label or item.label
        if new_file_extension is not None:
            file_extension = new_file_extension
        else:
            file_extension = item.file_extension

        filename = self._prepare_filename(label, file_extension)
        content_type_slug = item.type
        if filename:
            self._is_filename_available_or_raise(
                filename, workspace, parent, content_namespace=content_namespace
            )
        elif self._allow_empty_label(content_type_slug):
            # INFO - G.M - 2019-04-29 - special content like "Comment"
            # which allow empty filename should not
            # check filename availability
            pass
        else:
            # INFO - G.M - 2019-04-29 - this case should not happened if data are correct
            raise EmptyLabelNotAllowed(
                "content {} of type {} should always have a label "
                "and a valid filename".format(item.content_id, content_type_slug)
            )

        copy_result = self._copy(item, content_namespace, parent, copy_revision)
        copy_result = self._add_copy_revisions(
            original_content=item,
            new_content=copy_result.new_content,
            original_content_children=copy_result.original_children_dict,
            new_content_children=copy_result.new_children_dict,
            new_parent=parent,
            new_label=label,
            new_workspace=workspace,
            new_file_extension=file_extension,
            new_content_namespace=content_namespace,
            do_save=do_save,
            do_notify=do_notify,
        )
        return copy_result.new_content

    def _copy(
        self,
        content: Content,
        new_content_namespace: ContentNamespaces = None,
        new_parent: Content = None,
        copy_revisions: bool = True,
    ) -> AddCopyRevisionsResult:
        """
        Create new content for content and his children, recreate all revision in order and
        return all these new content
        :param content: original root content of copy
        :param new_parent: new parent of root content of copy
        :return: new content created based on original root content,
        dict of new children content and original children content with original content id as key.
        """
        new_content = Content()
        # INFO - G.M - 2019-04-30 - we store all children content created and old content id of them
        # to be able to retrieve them for applying new revisions on them easily. key of dict is
        # original content_id.
        new_content_children = {}  # type: typing.Dict[int,Content]
        # INFO - G.M - 2019-04-30 - we store alse old content of children to allow applying new
        # revision related to old data. key of dict is original content id.
        original_content_children = {}  # type: typing.Dict[int,Content]

        if copy_revisions:
            for rev, is_current_rev in content.get_tree_revisions_advanced():

                if rev.content_id == content.content_id:
                    related_content = new_content  # type: Content
                    related_parent = new_parent
                else:
                    # INFO - G.M - 2019-04-30 - if we retrieve a revision without a new content related yet
                    # we create it.
                    if rev.content_id not in new_content_children:
                        new_content_children[rev.content_id] = Content()
                        original_content_children[rev.content_id] = rev.node
                    related_content = new_content_children[rev.content_id]
                    if rev.parent_id == content.content_id:
                        related_parent = new_content
                    else:
                        related_parent = new_content_children[rev.parent_id]
                # INFO - G.M - 2019-04-30 - copy of revision itself.
                cpy_rev = ContentRevisionRO.copy(rev, related_parent, new_content_namespace)
                cpy_rev.node = related_content
                related_content.current_revision = cpy_rev
                self._session.add(related_content)
                self._session.flush()
        else:
            related_content = new_content
            related_parent = new_parent
            cpy_rev = ContentRevisionRO.copy(
                content.last_revision, related_parent, new_content_namespace, not copy_revisions
            )
            cpy_rev.node = related_content
            related_content.current_revision = cpy_rev
            self._session.add(related_content)
            self._session.flush()

        return AddCopyRevisionsResult(
            new_content=new_content,
            new_children_dict=new_content_children,
            original_children_dict=original_content_children,
        )

    def _add_copy_revisions(
        self,
        original_content: Content,
        new_content: Content,
        original_content_children,
        new_content_children,
        new_parent: Content = None,
        new_label: str = None,
        new_workspace: Workspace = None,
        new_file_extension: str = None,
        new_content_namespace: ContentNamespaces = None,
        do_save: bool = True,
        do_notify: bool = True,
    ) -> AddCopyRevisionsResult:
        """
        Add copy revision for all new content
        :param original_content: original content of root content in copy
        :param new_content: new content of new root content in copy
        :param original_content_children: original contents of children of root content in copy
        :param new_content_children: new contents of children of root content in copy
        :param new_parent: new parent of root content
        :param new_label: new label of root content
        :param new_workspace: new workspace all new content
        :param new_file_extension: new file_extension for root content
        :return: new content created based on root content,
        dict of new children content and original children content with original content id as key.
        """
        assert new_content_namespace
        for original_content_id, new_child in new_content_children.items():
            original_child = original_content_children[original_content_id]
            with new_revision(
                session=self._session,
                tm=transaction.manager,
                content=new_child,
                force_create_new_revision=True,
            ) as rev:
                rev.workspace = new_workspace
                rev.revision_type = ActionDescription.COPY
                properties = rev.properties.copy()
                properties["origin"] = {
                    "content": original_child.id,
                    "revision": original_child.last_revision.revision_id,
                }
                rev.properties = properties
            self.save(new_child, ActionDescription.COPY, do_notify=False)
        with new_revision(
            session=self._session,
            tm=transaction.manager,
            content=new_content,
            force_create_new_revision=True,
        ) as rev:
            if self._user:
                rev.owner = self._user
            rev.parent = new_parent
            rev.workspace = new_workspace
            rev.label = new_label
            rev.file_extension = new_file_extension
            rev.content_namespace = new_content_namespace
            rev.revision_type = ActionDescription.COPY
            properties = rev.properties.copy()
            properties["origin"] = {
                "content": original_content.id,
                "revision": original_content.last_revision.revision_id,
            }
            rev.properties = properties
        if do_save:
            self.save(new_content, ActionDescription.COPY, do_notify=do_notify)
        return AddCopyRevisionsResult(
            new_content=new_content,
            new_children_dict=new_content_children,
            original_children_dict=original_content_children,
        )

    def _move_children_content_to_new_workspace(
        self, item: Content, new_workspace: Workspace, new_content_namespace: ContentNamespaces
    ) -> None:
        """
        Change workspace_id of all children of content according to new_workspace
        given. This is needed for proper move from one workspace to another
        """
        for child in item.children:
            if (
                child.workspace_id != new_workspace.workspace_id
                or child.content_namespace != new_content_namespace
            ):
                with new_revision(session=self._session, tm=transaction.manager, content=child):
                    self.move(
                        child,
                        new_parent=item,
                        new_workspace=new_workspace,
                        new_content_namespace=new_content_namespace,
                        must_stay_in_same_workspace=False,
                    )
                    self.save(child)
                self._move_children_content_to_new_workspace(
                    child, new_workspace, new_content_namespace
                )
        return

    def is_editable(self, item: Content) -> bool:
        return not item.is_readonly and item.is_active and item.get_status().is_editable()

    def update_container_content(
        self,
        item: Content,
        allowed_content_type_slug_list: typing.List[str],
        new_label: str,
        new_description: typing.Optional[str] = None,
        new_raw_content: typing.Optional[str] = None,
    ):
        """
        Update a container content like folder
        :param item: content
        :param item: content
        :param new_label: new label of content
        :param new_description: description of content
        :param new_raw_content: raw content of this content
        :param allowed_content_type_slug_list: list of allowed subcontent type
         of content.
        :return:
        """
        try:
            item = self.set_allowed_content(item, allowed_content_type_slug_list)
            content_has_changed = True
        except SameValueError:
            content_has_changed = False
        item = self.update_content(
            item,
            new_label,
            new_description=new_description,
            new_raw_content=new_raw_content,
            force_update=content_has_changed,
        )

        return item

    def update_content(
        self,
        item: Content,
        new_label: typing.Optional[str] = None,
        new_raw_content: typing.Optional[str] = None,
        new_description: typing.Optional[str] = None,
        force_update=False,
    ) -> Content:
        """
        Update a content
        :param item: content
        :param new_label: new label of content
        :param new_raw_content: new raw text content of content
        :param new_description: new description of content
        :param force_update: don't raise SameValueError if value does not change
        :return: updated content
        """
        if not self.is_editable(item):
            raise ContentInNotEditableState(
                "Can't update not editable file, you need to change his status or state (deleted/archived) before any change."
            )

        if new_label is None:
            new_label = item.label
        if new_raw_content is None:
            new_raw_content = item.raw_content
        if new_description is None:
            new_description = item.description
        if not force_update:
            if (
                item.label == new_label
                and item.raw_content == new_raw_content
                and item.description == new_description
            ):
                # TODO - G.M - 20-03-2018 - Fix internatization for webdav access.
                # Internatization disabled in libcontent for now.
                raise SameValueError("The content did not change")

        filename = self._prepare_filename(new_label, item.file_extension)
        content_type_slug = item.type
        if filename:
            self._is_filename_available_or_raise(
                filename, item.workspace, item.parent, exclude_content_id=item.content_id
            )
        elif self._allow_empty_label(content_type_slug):
            # INFO - G.M - 2019-04-29 - special content like "Comment"
            # which allow empty filename should not
            # check filename availability
            pass
        else:
            # INFO - G.M - 2019-04-29 - this case should not happened if data are correct
            raise EmptyLabelNotAllowed(
                "content {} of type {} should always have a label "
                "and a valid filename".format(item.content_id, content_type_slug)
            )

        if self._user:
            item.owner = self._user
        item.label = new_label
        item.raw_content = new_raw_content
        item.description = new_description
        item.revision_type = ActionDescription.EDITION
        return item

    def update_file_data(
        self, item: Content, new_filename: str, new_mimetype: str, new_content: bytes
    ) -> Content:
        if not self.is_editable(item):
            raise ContentInNotEditableState(
                "Can't update not editable file, you need to change his status or state (deleted/archived) before any change."
            )
        # FIXME - G.M - 2018-09-25 - Repair and do a better same content check,
        # as pyramid behaviour use buffered object
        # new_content == item.depot_file.file.read() case cannot happened using
        # whenever new_content.read() == item.depot_file.file.read().
        # as this behaviour can create struggle with big file, simple solution
        # using read can be used everytime.
        # if new_mimetype == item.file_mimetype and \
        #         new_content == item.depot_file.file.read():
        #     raise SameValueError('The content did not change')
        if self._user:
            item.owner = self._user
        content_type_slug = item.type
        if new_filename:
            self._is_filename_available_or_raise(
                new_filename, item.workspace, item.parent, exclude_content_id=item.content_id
            )
        elif self._allow_empty_label(content_type_slug):
            # INFO - G.M - 2019-04-29 - special content like "Comment"
            # which allow empty filename should not
            # check filename availability
            pass
        else:
            # INFO - G.M - 2019-04-29 - this case should not happened if data are correct
            raise EmptyLabelNotAllowed(
                "content {} of type {} should always have a label "
                "and a valid filename".format(item.content_id, content_type_slug)
            )
        item.file_name = new_filename
        item.file_mimetype = new_mimetype
        item.depot_file = FileIntent(new_content, new_filename, new_mimetype)
        item.revision_type = ActionDescription.REVISION
        return item

    def check_upload_size(self, content_length: int, workspace: Workspace) -> None:
        self._check_size_length_limitation(content_length)
        self.check_workspace_size_limitation(content_length, workspace)
        self.check_owner_size_limitation(content_length, workspace)

    def _check_size_length_limitation(self, content_length: int) -> None:
        # INFO - G.M - 2019-08-23 - 0 mean no size limit
        if self._config.LIMITATION__CONTENT_LENGTH_FILE_SIZE == 0:
            return
        elif content_length > self._config.LIMITATION__CONTENT_LENGTH_FILE_SIZE:
            raise FileSizeOverMaxLimitation(
                'File cannot be added because his size "{}" is higher than max allowed size : "{}"'.format(
                    content_length, self._config.LIMITATION__CONTENT_LENGTH_FILE_SIZE
                )
            )

    def check_workspace_size_limitation(self, content_length: int, workspace: Workspace) -> None:
        # INFO - G.M - 2019-08-23 - 0 mean no size limit
        if self._config.LIMITATION__WORKSPACE_SIZE == 0:
            return
        workspace_size = workspace.get_size()
        if workspace_size > self._config.LIMITATION__WORKSPACE_SIZE:
            raise FileSizeOverWorkspaceEmptySpace(
                'File cannot be added (size "{}") because workspace is full: "{}/{}"'.format(
                    content_length, workspace_size, self._config.LIMITATION__WORKSPACE_SIZE
                )
            )

    def check_owner_size_limitation(self, content_length: int, workspace: Workspace) -> None:
        wapi = WorkspaceApi(current_user=None, session=self._session, config=self._config)
        owner_allowed_space = workspace.owner.allowed_space
        # INFO - G.M - 2019-10-08 - 0 mean no size limit
        if owner_allowed_space == 0:
            return
        owner_used_space = wapi.get_user_used_space(workspace.owner)
        if owner_used_space > workspace.owner.allowed_space:
            raise FileSizeOverOwnerEmptySpace(
                'File cannot be added (size "{}") because owner space is full: "{}/{}"'.format(
                    content_length, owner_used_space, owner_allowed_space
                )
            )

    def set_template(self, content: Content, is_template: bool) -> Content:
        if not self.is_editable(content):
            raise ContentInNotEditableState(
                "Can't mark not editable file, you need to change his status or state (deleted/archived) before any change."
            )
        # INFO - MP - 2022-06-09 - Hacky way to disable to set a template that aren't supported
        if content.file_extension not in [".document.html", ".odt", ".ods", ".odp", ".odg"]:
            raise ContentInNotEditableState(
                "Can't mark this kind file as a template. Files supported: .document.html, .odt, .ods, .odp, .odg"
            )
        content.is_template = is_template
        content.revision_type = ActionDescription.REVISION
        return content

    def get_templates(self, user_id: int, template_type: str) -> typing.List[Content]:
        user = self._session.query(User).get(user_id)

        space_api = WorkspaceApi(current_user=None, session=self._session, config=self._config)
        space_ids = [space.workspace_id for space in space_api.get_all_for_user(user)]

        content_list = (
            self._session.query(Content)
            .join(ContentRevisionRO, Content.cached_revision_id == ContentRevisionRO.revision_id)
            .filter(
                Content.workspace_id.in_(space_ids),
                Content.is_template == int(True),
                Content.type == template_type,
                Content.is_deleted == int(False),
                Content.is_archived == int(False),
            )
            .all()
        )

        return content_list

    def archive(self, content: Content):
        if self._user:
            content.owner = self._user
        content.is_archived = True
        # TODO - G.M - 12-03-2018 - Inspect possible label conflict problem
        # INFO - G.M - 12-03-2018 - Set label name to avoid trouble when
        # un-archiving file.
        label = "{label}-{action}-{date}".format(
            label=content.label, action="archived", date=current_date_for_filename()
        )
        filename = self._prepare_filename(label, content.file_extension)
        # INFO - G.M - 2019-04-29 - filename already exist here, for special type
        # comment too, so we can allow check filename for all content
        self._is_filename_available_or_raise(
            filename, content.workspace, content.parent, exclude_content_id=content.content_id
        )
        content.label = label
        content.revision_type = ActionDescription.ARCHIVING

    def unarchive(self, content: Content):
        if self._user:
            content.owner = self._user
        content.is_archived = False
        content.revision_type = ActionDescription.UNARCHIVING

    def delete(self, content: Content):
        if self._user:
            content.owner = self._user
        content.is_deleted = True
        # TODO - G.M - 12-03-2018 - Inspect possible label conflict problem
        # INFO - G.M - 12-03-2018 - Set label name to avoid trouble when
        # un-deleting file.
        label = "{label}-{action}-{date}".format(
            label=content.label, action="deleted", date=current_date_for_filename()
        )
        filename = self._prepare_filename(label, content.file_extension)
        # INFO - G.M - 2019-04-29 - filename already exist here, for special type
        # comment too, so we can allow check filename for all content
        self._is_filename_available_or_raise(
            filename, content.workspace, content.parent, exclude_content_id=content.content_id
        )
        content.label = label
        content.revision_type = ActionDescription.DELETION

    def undelete(self, content: Content):
        if self._user:
            content.owner = self._user
        content.is_deleted = False
        content.revision_type = ActionDescription.UNDELETION

    def get_preview_page_nb(self, revision_id: int, file_extension: str) -> typing.Optional[int]:
        # TODO: - G.M - 2021-01-20 - Refactor this to use new StorageLib, see #4079
        try:
            with self.get_one_revision_filepath(revision_id) as file_path:
                nb_pages = self.preview_manager.get_page_nb(file_path, file_ext=file_extension)
        except UnsupportedMimeType:
            return None
        except CannotGetDepotFileDepotCorrupted:
            logger.warning(
                self, "Unable to get revision filepath, depot is corrupted", exc_info=True
            )
            return None
        except Exception:
            logger.warning(self, "Unknown Preview_Generator Exception Occured", exc_info=True)
            return None
        return nb_pages

    def has_pdf_preview(self, revision_id: int, file_extension: str) -> bool:
        # TODO: - G.M - 2021-01-20 - Refactor this to use new StorageLib, see #4079
        try:
            with self.get_one_revision_filepath(revision_id) as file_path:
                return self.preview_manager.has_pdf_preview(file_path, file_ext=file_extension)
        except UnsupportedMimeType:
            return False
        except CannotGetDepotFileDepotCorrupted:
            logger.warning(
                self, "Unable to get revision filepath, depot is corrupted", exc_info=True
            )
            return False
        except Exception:
            logger.warning(self, "Unknown Preview_Generator Exception Occured", exc_info=True)
            return False

    def has_jpeg_preview(self, revision_id: int, file_extension: str) -> bool:
        # TODO: - G.M - 2021-01-20 - Refactor this to use new StorageLib, see #4079
        try:
            with self.get_one_revision_filepath(revision_id) as file_path:
                return self.preview_manager.has_jpeg_preview(file_path, file_ext=file_extension)
        except UnsupportedMimeType:
            return False
        except CannotGetDepotFileDepotCorrupted:
            logger.warning(
                self, "Unable to get revision filepath, depot is corrupted", exc_info=True
            )
            return False
        except Exception:
            logger.warning(self, "Unknown Preview_Generator Exception Occured", exc_info=True)
            return False

    def mark_read__all(self, read_datetime: datetime = None, do_flush: bool = True) -> None:
        """
        Read content of all workspace visible for the user.
        :param read_datetime: date of readigin
        :param do_flush: flush database
        :param recursive: mark read subcontent too
        :return: nothing
        """

        return self.mark_read__workspace(None, read_datetime, do_flush)

    def mark_read__workspace(
        self,
        workspace: typing.Optional[Workspace],
        read_datetime: datetime = None,
        do_flush: bool = True,
    ) -> None:
        """
        Read content of a workspace visible for the user.
        :param read_datetime: date of readigin
        :param do_flush: flush database
        :param recursive: mark read subcontent too
        :return: nothing
        """

        # INFO - G.M - 2020-03-27 - Get all content of workspace
        resultset = (
            self.get_all_query(workspaces=[workspace] if workspace else None)
            .outerjoin(
                RevisionReadStatus,
                and_(
                    RevisionReadStatus.revision_id == Content.cached_revision_id,
                    RevisionReadStatus.user_id == self._user_id,
                ),
            )
            .options(
                contains_eager(Content.current_revision).contains_eager(
                    ContentRevisionRO.revision_read_statuses
                )
            )
        )

        # INFO - G.M - 2020-03-27 - Mark all content as read
        for content in resultset:
            if content.has_new_information_for(self._user, recursive=False):
                self.mark_read(content, read_datetime, do_flush, recursive=False)

    def mark_read(
        self,
        content: Content,
        read_datetime: typing.Optional[datetime.datetime] = None,
        do_flush: bool = True,
        recursive: bool = True,
    ) -> Content:
        """
        Read content for the user.
        :param read_datetime: date of readigin
        :param do_flush: flush database
        :param recursive: mark read subcontent too
        :return: nothing
        """
        assert self._user
        assert content

        # The algorithm is:
        # 1. define the read datetime
        # 2. update all revisions related to current Content
        # 3. do the same for all child revisions
        #    (ie parent_id is content_id of current content)

        if not read_datetime:
            read_datetime = datetime.datetime.now()

        viewed_revisions = (
            self._session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.content_id == content.content_id)
            .all()
        )

        for revision in viewed_revisions:
            revision.read_by[self._user] = read_datetime

        if recursive:
            for child in content.recursive_children:
                self.mark_read(child, read_datetime=read_datetime, do_flush=False, recursive=True)

        if do_flush:
            self.flush()

        return content

    def mark_unread(self, content: Content, do_flush=True) -> Content:
        assert self._user
        assert content

        revisions = (
            self._session.query(ContentRevisionRO)
            .filter(ContentRevisionRO.content_id == content.content_id)
            .all()
        )

        for revision in revisions:
            try:
                del revision.read_by[self._user]
            except KeyError:
                pass

        for child in content.get_valid_children():
            self.mark_unread(child, do_flush=False)

        if do_flush:
            self.flush()

        return content

    def flush(self):
        self._session.flush()

    def save(self, content: Content, action_description: str = None, do_flush=True, do_notify=True):
        """
        Save an object, flush the session and set the revision_type property
        :param content:
        :param action_description:
        :return:
        """
        assert (
            action_description is None or action_description in ActionDescription.allowed_values()
        )

        if not action_description:
            # See if the last action has been modified
            if (
                content.revision_type is None
                or len(get_history(content.revision, "revision_type")) <= 0
            ):
                # The action has not been modified, so we set it to default edition
                action_description = ActionDescription.EDITION

        if action_description:
            content.revision_type = action_description

        if do_flush:
            # INFO - 2015-09-03 - D.A.
            # There are 2 flush because of the use
            # of triggers for content creation
            #
            # (when creating a content, actually this is an insert of a new
            # revision in content_revisions ; so the mark_read operation need
            # to get full real data from database before to be prepared.

            self._session.add(content)
            self._session.flush()

            # TODO - 2015-09-03 - D.A. - Do not use triggers
            # We should create a new ContentRevisionRO object instead of Content
            # This would help managing view/not viewed status
            self.mark_read(content, do_flush=True)

        if do_notify:
            self.do_notify(content)

    def do_notify(self, content: Content):
        """
        Allow to force notification for a given content. By default, it is
        called during the .save() operation
        :param content:
        :return:
        """
        NotifierFactory.create(
            config=self._config, current_user=self._user, session=self._session
        ).notify_content_update(content)

    def get_all_types(self) -> typing.List[TracimContentType]:
        labels = content_type_list.endpoint_allowed_types_slug()
        content_types = []
        for label in labels:
            content_types.append(content_type_list.get_one_by_slug(label))

        return content_types

    def get_deleted_parent_id(self, content: Content) -> typing.Optional[int]:
        if content.parent:
            if content.parent.is_deleted:
                return content.parent_id
            if content.parent.parent:
                return self.get_deleted_parent_id(content.parent)
        return 0

    def get_archived_parent_id(self, content: Content) -> typing.Optional[int]:
        if content.parent:
            if content.parent.is_archived:
                return content.parent_id
            if content.parent.parent:
                return self.get_archived_parent_id(content.parent)
        return 0

    # TODO - G.M - 2018-07-24 - [Cleanup] Is this method still needed?
    def generate_folder_label(self, workspace: Workspace, parent: Content = None) -> str:
        """
        Generate a folder label
        :param workspace: Future folder workspace
        :param parent: Parent of foture folder (can be None)
        :return: Generated folder name
        """
        _ = self.translator.get_translation
        query = self._base_query(workspaces=[workspace] if workspace else None).filter(
            Content.label.ilike("{0}%".format(_("New folder")))
        )
        if parent:
            query = query.filter(Content.parent == parent)

        return _("New folder {0}").format(query.count() + 1)

    def _allow_empty_label(self, content_type_slug: str) -> bool:
        if (
            content_type_list.get_one_by_slug(content_type_slug).slug
            == content_type_list.Comment.slug
        ):
            return True
        return False

    def get_authored_content_revisions_infos(self, user_id: int) -> AuthoredContentRevisionsInfos:
        revision_count = func.count(ContentRevisionRO.revision_id)
        workspace_count = func.count(ContentRevisionRO.workspace_id.distinct())
        query = self._session.query(revision_count, workspace_count)
        infos = query.filter(ContentRevisionRO.owner_id == user_id).one()
        return AuthoredContentRevisionsInfos(infos[0], infos[1])

    def get_newest_authored_content(self, user_id: int) -> Content:
        query = (
            self._base_query()
            .filter(ContentRevisionRO.owner_id == user_id)
            .order_by(ContentRevisionRO.created.desc())
            .limit(1)
        )
        try:
            return query.one()
        except NoResultFound as exc:
            raise ContentNotFound("User {} did not author any content".format(user_id)) from exc

    def get_user_favorite_contents(
        self,
        user_id: int,
        order_by_properties: typing.Optional[
            typing.List[typing.Union[str, QueryableAttribute]]
        ] = None,
    ) -> PaginatedObject:
        """
        Return all user favorite content using some filters
        :param order_by_properties: filter by properties can be both string of
        attribute or attribute of Model object from sqlalchemy(preferred way,
        QueryableAttribute object)
        :return: List of contents
        """
        favorite_content_ids_tuple = (
            self._get_content_marked_as_favorite_query(user_id=user_id)
            .with_entities(Content.id)
            .all()
        )
        favorite_content_ids = [elem[0] for elem in favorite_content_ids_tuple]
        paged_favorites = self._get_user_favorite_contents(
            user_id=user_id, order_by_properties=[FavoriteContent.created],
        )
        favorites = []
        for favorite in paged_favorites:
            content = None
            if favorite.content_id in favorite_content_ids:
                content = self.get_content_in_context(favorite.content)
            favorites.append(FavoriteContentInContext(favorite, content))
        return PaginatedObject(paged_favorites, favorites)

    def _get_content_marked_as_favorite_query(self, user_id: int):
        query = (
            self.get_all_query(
                parent_ids=None,
                content_type_slug=content_type_list.Any_SLUG,
                workspaces=None,
                label=None,
            )
            .join(FavoriteContent, Content.id == FavoriteContent.content_id)
            .filter(FavoriteContent.user_id == user_id)
        )
        return query

    def _get_user_favorite_contents(
        self,
        user_id: int,
        order_by_properties: typing.Optional[
            typing.List[typing.Union[str, QueryableAttribute]]
        ] = None,
        page_token: typing.Optional[str] = None,
        count: typing.Optional[int] = None,
    ) -> Page:
        """
        Return all user favorite content using some filters
        :param order_by_properties: filter by properties can be both string of
        attribute or attribute of Model object from sqlalchemy(preferred way,
        QueryableAttribute object)
        :return: List of contents
        """
        query = self._session.query(FavoriteContent).filter(FavoriteContent.user_id == user_id)
        for _property in order_by_properties:
            query = query.order_by(_property)
        if count:
            return get_page(query, per_page=count, page=page_token or False)
        return Page(query.all())

    def get_one_user_favorite_content_in_context(
        self, favorite_content: FavoriteContent
    ) -> FavoriteContentInContext:
        try:
            content = self.get_content_in_context(self.get_one(favorite_content.content_id))
        except ContentNotFound:
            content = None
        return FavoriteContentInContext(favorite_content, content)

    def get_one_user_favorite_content(self, user_id: int, content_id: int) -> FavoriteContent:
        try:
            return (
                self._session.query(FavoriteContent)
                .filter(
                    FavoriteContent.user_id == user_id, FavoriteContent.content_id == content_id
                )
                .one()
            )
        except NoResultFound:
            raise FavoriteContentNotFound(
                "Favorite of content {content_id} and user {user_id} was not found .".format(
                    content_id=content_id, user_id=user_id
                )
            )

    def add_favorite(self, content: Content, do_save: bool = True) -> FavoriteContent:
        try:
            # INFO - G.M - 2021-03-22 - If favorite already exist, accept without
            # recreating the favorite
            favorite = self.get_one_user_favorite_content(
                user_id=self._user.user_id, content_id=content.content_id
            )
        except FavoriteContentNotFound:
            favorite = FavoriteContent(
                user=self._user,
                content=content,
                original_type=content.type,
                original_label=content.label,
            )
            self._session.add(favorite)
            if do_save:
                self._session.flush()
        return favorite

    def remove_favorite(self, content_id: int, do_save: bool = True) -> None:
        self._session.query(FavoriteContent).filter(
            FavoriteContent.user_id == self._user.user_id, FavoriteContent.content_id == content_id,
        ).delete()
        if do_save:
            self._session.flush()
