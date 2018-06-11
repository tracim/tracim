# -*- coding: utf-8 -*-
from contextlib import contextmanager

import os

from operator import itemgetter

import transaction
from sqlalchemy import func
from sqlalchemy.orm import Query

__author__ = 'damien'

import datetime
import re
import typing

from tracim.lib.utils.translation import fake_translator as _

from depot.manager import DepotManager
from depot.io.utils import FileIntent

import sqlalchemy
from sqlalchemy.orm import aliased
from sqlalchemy.orm import joinedload
from sqlalchemy.orm.attributes import get_history
from sqlalchemy.orm.session import Session
from sqlalchemy import desc
from sqlalchemy import distinct
from sqlalchemy import or_
from sqlalchemy.sql.elements import and_
from tracim.lib.utils.utils import cmp_to_key
from tracim.lib.core.notifications import NotifierFactory
from tracim.exceptions import SameValueError
from tracim.lib.utils.utils import current_date_for_filename
from tracim.models.revision_protection import new_revision
from tracim.models.auth import User
from tracim.models.data import ActionDescription
from tracim.models.data import ContentStatus
from tracim.models.data import ContentRevisionRO
from tracim.models.data import Content
from tracim.models.data import ContentType
from tracim.models.data import NodeTreeItem
from tracim.models.data import RevisionReadStatus
from tracim.models.data import UserRoleInWorkspace
from tracim.models.data import Workspace


def compare_content_for_sorting_by_type_and_name(
        content1: Content,
        content2: Content
) -> int:
    """
    :param content1:
    :param content2:
    :return:    1 if content1 > content2
                -1 if content1 < content2
                0 if content1 = content2
    """

    if content1.type == content2.type:
        if content1.get_label().lower()>content2.get_label().lower():
            return 1
        elif content1.get_label().lower()<content2.get_label().lower():
            return -1
        return 0
    else:
        # TODO - D.A. - 2014-12-02 - Manage Content Types Dynamically
        content_type_order = [
            ContentType.Folder,
            ContentType.Page,
            ContentType.Thread,
            ContentType.File,
        ]

        content_1_type_index = content_type_order.index(content1.type)
        content_2_type_index = content_type_order.index(content2.type)
        result = content_1_type_index - content_2_type_index

        if result < 0:
            return -1
        elif result > 0:
            return 1
        else:
            return 0


def compare_tree_items_for_sorting_by_type_and_name(
        item1: NodeTreeItem,
        item2: NodeTreeItem
) -> int:
    return compare_content_for_sorting_by_type_and_name(item1.node, item2.node)


class ContentApi(object):

    SEARCH_SEPARATORS = ',| '
    SEARCH_DEFAULT_RESULT_NB = 50

    DISPLAYABLE_CONTENTS = (
        ContentType.Folder,
        ContentType.File,
        ContentType.Comment,
        ContentType.Thread,
        ContentType.Page,
    )

    def __init__(
            self,
            session: Session,
            current_user: typing.Optional[User],
            config,
            show_archived: bool = False,
            show_deleted: bool = False,
            show_temporary: bool = False,
            all_content_in_treeview: bool = True,
            force_show_all_types: bool = False,
            disable_user_workspaces_filter: bool = False,
    ) -> None:
        self._session = session
        self._user = current_user
        self._config = config
        self._user_id = current_user.user_id if current_user else None
        self._show_archived = show_archived
        self._show_deleted = show_deleted
        self._show_temporary = show_temporary
        self._show_all_type_of_contents_in_treeview = all_content_in_treeview
        self._force_show_all_types = force_show_all_types
        self._disable_user_workspaces_filter = disable_user_workspaces_filter

    @contextmanager
    def show(
            self,
            show_archived: bool=False,
            show_deleted: bool=False,
            show_temporary: bool=False,
    ) -> typing.Generator['ContentApi', None, None]:
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

    def get_revision_join(self) -> sqlalchemy.sql.elements.BooleanClauseList:
        """
        Return the Content/ContentRevision query join condition
        :return: Content/ContentRevision query join condition
        """
        return and_(Content.id == ContentRevisionRO.content_id,
                    ContentRevisionRO.revision_id == self._session.query(
                        ContentRevisionRO.revision_id)
                    .filter(ContentRevisionRO.content_id == Content.id)
                    .order_by(ContentRevisionRO.revision_id.desc())
                    .limit(1)
                    .correlate(Content))

    def get_canonical_query(self) -> Query:
        """
        Return the Content/ContentRevision base query who join these table on the last revision.
        :return: Content/ContentRevision Query
        """
        return self._session.query(Content)\
            .join(ContentRevisionRO, self.get_revision_join())

    @classmethod
    def sort_tree_items(
        cls,
        content_list: typing.List[NodeTreeItem],
    )-> typing.List[NodeTreeItem]:
        news = []
        for item in content_list:
            news.append(item)

        content_list.sort(key=cmp_to_key(
            compare_tree_items_for_sorting_by_type_and_name,
        ))

        return content_list

    @classmethod
    def sort_content(
        cls,
        content_list: typing.List[Content],
    ) -> typing.List[Content]:
        content_list.sort(key=cmp_to_key(compare_content_for_sorting_by_type_and_name))
        return content_list

    def __real_base_query(
        self,
        workspace: Workspace = None,
    ) -> Query:
        result = self.get_canonical_query()

        # Exclude non displayable types
        if not self._force_show_all_types:
            result = result.filter(Content.type.in_(self.DISPLAYABLE_CONTENTS))

        if workspace:
            result = result.filter(Content.workspace_id == workspace.workspace_id)

        # Security layer: if user provided, filter
        # with user workspaces privileges
        if self._user and not self._disable_user_workspaces_filter:
            user = self._session.query(User).get(self._user_id)
            # Filter according to user workspaces
            workspace_ids = [r.workspace_id for r in user.roles \
                             if r.role>=UserRoleInWorkspace.READER]
            result = result.filter(or_(
                Content.workspace_id.in_(workspace_ids),
                # And allow access to non workspace document when he is owner
                and_(
                    Content.workspace_id == None,
                    Content.owner_id == self._user_id,
                )
            ))

        return result

    def _base_query(self, workspace: Workspace=None) -> Query:
        result = self.__real_base_query(workspace)

        if not self._show_deleted:
            result = result.filter(Content.is_deleted==False)

        if not self._show_archived:
            result = result.filter(Content.is_archived==False)

        if not self._show_temporary:
            result = result.filter(Content.is_temporary==False)

        return result

    def __revisions_real_base_query(
        self,
        workspace: Workspace=None,
    ) -> Query:
        result = self._session.query(ContentRevisionRO)

        # Exclude non displayable types
        if not self._force_show_all_types:
            result = result.filter(Content.type.in_(self.DISPLAYABLE_CONTENTS))

        if workspace:
            result = result.filter(ContentRevisionRO.workspace_id==workspace.workspace_id)

        if self._user:
            user = self._session.query(User).get(self._user_id)
            # Filter according to user workspaces
            workspace_ids = [r.workspace_id for r in user.roles \
                             if r.role>=UserRoleInWorkspace.READER]
            result = result.filter(ContentRevisionRO.workspace_id.in_(workspace_ids))

        return result

    def _revisions_base_query(
        self,
        workspace: Workspace=None,
    ) -> Query:
        result = self.__revisions_real_base_query(workspace)

        if not self._show_deleted:
            result = result.filter(ContentRevisionRO.is_deleted==False)

        if not self._show_archived:
            result = result.filter(ContentRevisionRO.is_archived==False)

        if not self._show_temporary:
            result = result.filter(Content.is_temporary==False)

        return result

    def _hard_filtered_base_query(
        self,
        workspace: Workspace=None,
    ) -> Query:
        """
        If set to True, then filterign on is_deleted and is_archived will also
        filter parent properties. This is required for search() function which
        also search in comments (for example) which may be 'not deleted' while
        the associated content is deleted

        :param hard_filtering:
        :return:
        """
        result = self.__real_base_query(workspace)

        if not self._show_deleted:
            parent = aliased(Content)
            result = result.join(parent, Content.parent).\
                filter(Content.is_deleted==False).\
                filter(parent.is_deleted==False)

        if not self._show_archived:
            parent = aliased(Content)
            result = result.join(parent, Content.parent).\
                filter(Content.is_archived==False).\
                filter(parent.is_archived==False)

        if not self._show_temporary:
            parent = aliased(Content)
            result = result.join(parent, Content.parent). \
                filter(Content.is_temporary == False). \
                filter(parent.is_temporary == False)

        return result

    def get_base_query(
        self,
        workspace: Workspace,
    ) -> Query:
        return self._base_query(workspace)

    def get_child_folders(self, parent: Content=None, workspace: Workspace=None, filter_by_allowed_content_types: list=[], removed_item_ids: list=[], allowed_node_types=None) -> typing.List[Content]:
        """
        This method returns child items (folders or items) for left bar treeview.

        :param parent:
        :param workspace:
        :param filter_by_allowed_content_types:
        :param removed_item_ids:
        :param allowed_node_types: This parameter allow to hide folders for which the given type of content is not allowed.
               For example, if you want to move a Page from a folder to another, you should show only folders that accept pages
        :return:
        """
        filter_by_allowed_content_types = filter_by_allowed_content_types or []  # FDV
        removed_item_ids = removed_item_ids or []  # FDV

        if not allowed_node_types:
            allowed_node_types = [ContentType.Folder]
        elif allowed_node_types==ContentType.Any:
            allowed_node_types = ContentType.all()

        parent_id = parent.content_id if parent else None
        folders = self._base_query(workspace).\
            filter(Content.parent_id==parent_id).\
            filter(Content.type.in_(allowed_node_types)).\
            filter(Content.content_id.notin_(removed_item_ids)).\
            all()

        if not filter_by_allowed_content_types or \
                        len(filter_by_allowed_content_types)<=0:
            # Standard case for the left treeview: we want to show all contents
            # in the left treeview... so we still filter because for example
            # comments must not appear in the treeview
            return [folder for folder in folders \
                    if folder.type in ContentType.allowed_types_for_folding()]

        # Now this is a case of Folders only (used for moving content)
        # When moving a content, you must get only folders that allow to be filled
        # with the type of content you want to move
        result = []
        for folder in folders:
            for allowed_content_type in filter_by_allowed_content_types:

                is_folder = folder.type == ContentType.Folder
                content_type__allowed = folder.properties['allowed_content'][allowed_content_type] == True

                if is_folder and content_type__allowed:
                    result.append(folder)
                    break

        return result

    def create(self, content_type: str, workspace: Workspace, parent: Content=None, label:str ='', do_save=False, is_temporary: bool=False, do_notify=True) -> Content:
        assert content_type in ContentType.allowed_types()

        if content_type == ContentType.Folder and not label:
            label = self.generate_folder_label(workspace, parent)

        content = Content()
        content.owner = self._user
        content.parent = parent
        content.workspace = workspace
        content.type = content_type
        content.label = label
        content.is_temporary = is_temporary
        content.revision_type = ActionDescription.CREATION

        if content.type in (
                ContentType.Page,
                ContentType.Thread,
        ):
            content.file_extension = '.html'

        if do_save:
            self._session.add(content)
            self.save(content, ActionDescription.CREATION, do_notify=do_notify)
        return content


    def create_comment(self, workspace: Workspace=None, parent: Content=None, content:str ='', do_save=False) -> Content:
        assert parent  and parent.type!=ContentType.Folder
        item = Content()
        item.owner = self._user
        item.parent = parent
        item.workspace = workspace
        item.type = ContentType.Comment
        item.description = content
        item.label = ''
        item.revision_type = ActionDescription.COMMENT

        if do_save:
            self.save(item, ActionDescription.COMMENT)
        return item


    def get_one_from_revision(self, content_id: int, content_type: str, workspace: Workspace=None, revision_id=None) -> Content:
        """
        This method is a hack to convert a node revision item into a node
        :param content_id:
        :param content_type:
        :param workspace:
        :param revision_id:
        :return:
        """

        content = self.get_one(content_id, content_type, workspace)
        revision = self._session.query(ContentRevisionRO).filter(ContentRevisionRO.revision_id==revision_id).one()

        if revision.content_id==content.content_id:
            content.revision_to_serialize = revision.revision_id
        else:
            raise ValueError('Revision not found for given content')

        return content

    def get_one(self, content_id: int, content_type: str, workspace: Workspace=None) -> Content:

        if not content_id:
            return None

        if content_type==ContentType.Any:
            return self._base_query(workspace).filter(Content.content_id==content_id).one()

        return self._base_query(workspace).filter(Content.content_id==content_id).filter(Content.type==content_type).one()

    def get_one_revision(self, revision_id: int = None) -> ContentRevisionRO:
        """
        This method allow us to get directly any revision with its id
        :param revision_id: The content's revision's id that we want to return
        :return: An item Content linked with the correct revision
        """
        assert revision_id is not None# DYN_REMOVE

        revision = self._session.query(ContentRevisionRO).filter(ContentRevisionRO.revision_id == revision_id).one()

        return revision

    # INFO - A.P - 2017-07-03 - python file object getter
    # in case of we cook a version of preview manager that allows a pythonic
    # access to files
    # def get_one_revision_file(self, revision_id: int = None):
    #     """
    #     This function allows us to directly get a Python file object from its
    #     revision identifier.
    #     :param revision_id: The revision id of the file we want to return
    #     :return: The corresponding Python file object
    #     """
    #     revision = self.get_one_revision(revision_id)
    #     return DepotManager.get().get(revision.depot_file)

    def get_one_revision_filepath(self, revision_id: int = None) -> str:
        """
        This method allows us to directly get a file path from its revision
        identifier.
        :param revision_id: The revision id of the filepath we want to return
        :return: The corresponding filepath
        """
        revision = self.get_one_revision(revision_id)
        depot = DepotManager.get()
        depot_stored_file = depot.get(revision.depot_file)  # type: StoredFile
        depot_file_path = depot_stored_file._file_path  # type: str
        return depot_file_path

    def get_one_by_label_and_parent(
            self,
            content_label: str,
            content_parent: Content=None,
    ) -> Content:
        """
        This method let us request the database to obtain a Content with its name and parent
        :param content_label: Either the content's label or the content's filename if the label is None
        :param content_parent: The parent's content
        :param workspace: The workspace's content
        :return The corresponding Content
        """
        workspace = content_parent.workspace if content_parent else None
        query = self._base_query(workspace)
        parent_id = content_parent.content_id if content_parent else None
        query = query.filter(Content.parent_id == parent_id)

        file_name, file_extension = os.path.splitext(content_label)

        return query.filter(
            or_(
                and_(
                    Content.type == ContentType.File,
                    Content.label == file_name,
                    Content.file_extension == file_extension,
                ),
                and_(
                    Content.type == ContentType.Thread,
                    Content.label == file_name,
                ),
                and_(
                    Content.type == ContentType.Page,
                    Content.label == file_name,
                ),
                and_(
                    Content.type == ContentType.Folder,
                    Content.label == content_label,
                ),
            )
        ).one()

    def get_one_by_label_and_parent_labels(
            self,
            content_label: str,
            workspace: Workspace,
            content_parent_labels: [str]=None,
    ):
        """
        Return content with it's label, workspace and parents labels (optional)
        :param content_label: label of content (label or file_name)
        :param workspace: workspace containing all of this
        :param content_parent_labels: Ordered list of labels representing path
            of folder (without workspace label).
        E.g.: ['foo', 'bar'] for complete path /Workspace1/foo/bar folder
        :return: Found Content
        """
        query = self._base_query(workspace)
        parent_folder = None

        # Grab content parent folder if parent path given
        if content_parent_labels:
            parent_folder = self.get_folder_with_workspace_path_labels(
                content_parent_labels,
                workspace,
            )

        # Build query for found content by label
        content_query = self.filter_query_for_content_label_as_path(
            query=query,
            content_label_as_file=content_label,
        )

        # Modify query to apply parent folder filter if any
        if parent_folder:
            content_query = content_query.filter(
                Content.parent_id == parent_folder.content_id,
            )
        else:
            content_query = content_query.filter(
                Content.parent_id == None,
            )

        # Filter with workspace
        content_query = content_query.filter(
            Content.workspace_id == workspace.workspace_id,
        )

        # Return the content
        return content_query\
            .order_by(
                Content.revision_id.desc(),
            )\
            .one()

    def get_folder_with_workspace_path_labels(
            self,
            path_labels: [str],
            workspace: Workspace,
    ) -> Content:
        """
        Return a Content folder for given relative path.
        TODO BS 20161124: Not safe if web interface allow folder duplicate names
        :param path_labels: List of labels representing path of folder
        (without workspace label).
        E.g.: ['foo', 'bar'] for complete path /Workspace1/foo/bar folder
        :param workspace: workspace of folders
        :return: Content folder
        """
        query = self._base_query(workspace)
        folder = None

        for label in path_labels:
            # Filter query on label
            folder_query = query \
                .filter(
                    Content.type == ContentType.Folder,
                    Content.label == label,
                    Content.workspace_id == workspace.workspace_id,
                )

            # Search into parent folder (if already deep)
            if folder:
                folder_query = folder_query\
                    .filter(
                        Content.parent_id == folder.content_id,
                    )
            else:
                folder_query = folder_query \
                    .filter(Content.parent_id == None)

            # Get thirst corresponding folder
            folder = folder_query \
                .order_by(Content.revision_id.desc()) \
                .one()

        return folder

    def filter_query_for_content_label_as_path(
            self,
            query: Query,
            content_label_as_file: str,
            is_case_sensitive: bool = False,
    ) -> Query:
        """
        Apply normalised filters to found Content corresponding as given label.
        :param query: query to modify
        :param content_label_as_file: label in this
        FILE version, use Content.get_label_as_file().
        :param is_case_sensitive: Take care about case or not
        :return: modified query
        """
        file_name, file_extension = os.path.splitext(content_label_as_file)

        label_filter = Content.label == content_label_as_file
        file_name_filter = Content.label == file_name
        file_extension_filter = Content.file_extension == file_extension

        if not is_case_sensitive:
            label_filter = func.lower(Content.label) == \
                           func.lower(content_label_as_file)
            file_name_filter = func.lower(Content.label) == \
                               func.lower(file_name)
            file_extension_filter = func.lower(Content.file_extension) == \
                                    func.lower(file_extension)

        return query.filter(or_(
            and_(
                Content.type == ContentType.File,
                file_name_filter,
                file_extension_filter,
            ),
            and_(
                Content.type == ContentType.Thread,
                file_name_filter,
                file_extension_filter,
            ),
            and_(
                Content.type == ContentType.Page,
                file_name_filter,
                file_extension_filter,
            ),
            and_(
                Content.type == ContentType.Folder,
                label_filter,
            ),
        ))

    def get_all(self, parent_id: int=None, content_type: str=ContentType.Any, workspace: Workspace=None) -> typing.List[Content]:
        assert parent_id is None or isinstance(parent_id, int) # DYN_REMOVE
        assert content_type is not None# DYN_REMOVE
        assert isinstance(content_type, str) # DYN_REMOVE

        resultset = self._base_query(workspace)

        if content_type!=ContentType.Any:
            resultset = resultset.filter(Content.type==content_type)

        if parent_id:
            resultset = resultset.filter(Content.parent_id==parent_id)
        if parent_id is False:
            resultset = resultset.filter(Content.parent_id == None)

        return resultset.all()

    def get_children(self, parent_id: int, content_types: list, workspace: Workspace=None) -> typing.List[Content]:
        """
        Return parent_id childs of given content_types
        :param parent_id: parent id
        :param content_types: list of types
        :param workspace: workspace filter
        :return: list of content
        """
        resultset = self._base_query(workspace)
        resultset = resultset.filter(Content.type.in_(content_types))

        if parent_id:
            resultset = resultset.filter(Content.parent_id==parent_id)
        if parent_id is False:
            resultset = resultset.filter(Content.parent_id == None)

        return resultset.all()

    # TODO find an other name to filter on is_deleted / is_archived
    def get_all_with_filter(self, parent_id: int=None, content_type: str=ContentType.Any, workspace: Workspace=None) -> typing.List[Content]:
        assert parent_id is None or isinstance(parent_id, int) # DYN_REMOVE
        assert content_type is not None# DYN_REMOVE
        assert isinstance(content_type, str) # DYN_REMOVE

        resultset = self._base_query(workspace)

        if content_type != ContentType.Any:
            resultset = resultset.filter(Content.type==content_type)

        resultset = resultset.filter(Content.is_deleted == self._show_deleted)
        resultset = resultset.filter(Content.is_archived == self._show_archived)
        resultset = resultset.filter(Content.is_temporary == self._show_temporary)

        resultset = resultset.filter(Content.parent_id==parent_id)

        return resultset.all()

    def get_all_without_exception(self, content_type: str, workspace: Workspace=None) -> typing.List[Content]:
        assert content_type is not None# DYN_REMOVE

        resultset = self._base_query(workspace)

        if content_type != ContentType.Any:
            resultset = resultset.filter(Content.type==content_type)

        return resultset.all()

    def get_last_active(self, parent_id: int, content_type: str, workspace: Workspace=None, limit=10) -> typing.List[Content]:
        assert parent_id is None or isinstance(parent_id, int) # DYN_REMOVE
        assert content_type is not None# DYN_REMOVE
        assert isinstance(content_type, str) # DYN_REMOVE

        resultset = self._base_query(workspace) \
            .filter(Content.workspace_id == Workspace.workspace_id) \
            .filter(Workspace.is_deleted.is_(False)) \
            .order_by(desc(Content.updated))

        if content_type!=ContentType.Any:
            resultset = resultset.filter(Content.type==content_type)

        if parent_id:
            resultset = resultset.filter(Content.parent_id==parent_id)

        result = []
        for item in resultset:
            new_item = None
            if ContentType.Comment == item.type:
                new_item = item.parent
            else:
                new_item = item

            # INFO - D.A. - 2015-05-20
            # We do not want to show only one item if the last 10 items are
            # comments about one thread for example
            if new_item not in result:
                result.append(new_item)

            if len(result) >= limit:
                break

        return result

    def get_last_unread(self, parent_id: int, content_type: str,
                        workspace: Workspace=None, limit=10) -> typing.List[Content]:
        assert parent_id is None or isinstance(parent_id, int) # DYN_REMOVE
        assert content_type is not None# DYN_REMOVE
        assert isinstance(content_type, str) # DYN_REMOVE

        read_revision_ids = self._session.query(RevisionReadStatus.revision_id) \
            .filter(RevisionReadStatus.user_id==self._user_id)

        not_read_revisions = self._revisions_base_query(workspace) \
            .filter(~ContentRevisionRO.revision_id.in_(read_revision_ids)) \
            .filter(ContentRevisionRO.workspace_id == Workspace.workspace_id) \
            .filter(Workspace.is_deleted.is_(False)) \
            .subquery()

        not_read_content_ids_query = self._session.query(
            distinct(not_read_revisions.c.content_id)
        )
        not_read_content_ids = list(map(
            itemgetter(0),
            not_read_content_ids_query,
        ))

        not_read_contents = self._base_query(workspace) \
            .filter(Content.content_id.in_(not_read_content_ids)) \
            .order_by(desc(Content.updated))

        if content_type != ContentType.Any:
            not_read_contents = not_read_contents.filter(
                Content.type==content_type)
        else:
            not_read_contents = not_read_contents.filter(
                Content.type!=ContentType.Folder)

        if parent_id:
            not_read_contents = not_read_contents.filter(
                Content.parent_id==parent_id)

        result = []
        for item in not_read_contents:
            new_item = None
            if ContentType.Comment == item.type:
                new_item = item.parent
            else:
                new_item = item

            # INFO - D.A. - 2015-05-20
            # We do not want to show only one item if the last 10 items are
            # comments about one thread for example
            if new_item not in result:
                result.append(new_item)

            if len(result) >= limit:
                break

        return result

    def set_allowed_content(self, folder: Content, allowed_content_dict:dict):
        """
        :param folder: the given folder instance
        :param allowed_content_dict: must be something like this:
            dict(
                folder = True
                thread = True,
                file = False,
                page = True
            )
        :return:
        """
        properties = dict(allowed_content = allowed_content_dict)
        folder.properties = properties

    def set_status(self, content: Content, new_status: str):
        if new_status in ContentStatus.allowed_values():
            content.status = new_status
            content.revision_type = ActionDescription.STATUS_UPDATE
        else:
            raise ValueError('The given value {} is not allowed'.format(new_status))

    def move(self, item: Content,
             new_parent: Content,
             must_stay_in_same_workspace:bool=True,
             new_workspace:Workspace=None):
        if must_stay_in_same_workspace:
            if new_parent and new_parent.workspace_id != item.workspace_id:
                raise ValueError('the item should stay in the same workspace')

        item.parent = new_parent
        if new_parent:
            item.workspace = new_parent.workspace
        elif new_workspace:
            item.workspace = new_workspace

        item.revision_type = ActionDescription.MOVE

    def copy(
        self,
        item: Content,
        new_parent: Content=None,
        new_label: str=None,
        do_save: bool=True,
        do_notify: bool=True,
    ) -> Content:
        """
        Copy nearly all content, revision included. Children not included, see
        "copy_children" for this.
        :param item: Item to copy
        :param new_parent: new parent of the new copied item
        :param new_label: new label of the new copied item
        :param do_notify: notify copy or not
        :return: Newly copied item
        """
        if (not new_parent and not new_label) or (new_parent == item.parent and new_label == item.label):  # nopep8
            # TODO - G.M - 08-03-2018 - Use something else than value error
            raise ValueError("You can't copy file into itself")
        if new_parent:
            workspace = new_parent.workspace
            parent = new_parent
        else:
            workspace = item.workspace
            parent = item.parent
        label = new_label or item.label

        content = item.copy(parent)
        # INFO - GM - 15-03-2018 - add "copy" revision
        with new_revision(
            session=self._session,
            tm=transaction.manager,
            content=content,
            force_create_new_revision=True
        ) as rev:
            rev.parent = parent
            rev.workspace = workspace
            rev.label = label
            rev.revision_type = ActionDescription.COPY
            rev.properties['origin'] = {
                'content': item.id,
                'revision': item.last_revision.revision_id,
            }
        if do_save:
            self.save(content, ActionDescription.COPY, do_notify=do_notify)
        return content

    def copy_children(self, origin_content: Content, new_content: Content):
        for child in origin_content.children:
            self.copy(child, new_content)

    def move_recursively(self, item: Content,
                         new_parent: Content, new_workspace: Workspace):
        self.move(item, new_parent, False, new_workspace)
        self.save(item, do_notify=False)

        for child in item.children:
            with new_revision(child):
                self.move_recursively(child, item, new_workspace)
        return

    def update_content(self, item: Content, new_label: str, new_content: str=None) -> Content:
        if item.label==new_label and item.description==new_content:
            # TODO - G.M - 20-03-2018 - Fix internatization for webdav access.
            # Internatization disabled in libcontent for now.
            raise SameValueError('The content did not changed')
        item.owner = self._user
        item.label = new_label
        item.description = new_content if new_content else item.description # TODO: convert urls into links
        item.revision_type = ActionDescription.EDITION
        return item

    def update_file_data(self, item: Content, new_filename: str, new_mimetype: str, new_content: bytes) -> Content:
        if new_mimetype == item.file_mimetype and \
                new_content == item.depot_file.file.read():
            raise SameValueError('The content did not changed')
        item.owner = self._user
        item.file_name = new_filename
        item.file_mimetype = new_mimetype
        item.depot_file = FileIntent(
            new_content,
            new_filename,
            new_mimetype,
        )
        item.revision_type = ActionDescription.REVISION
        return item

    def archive(self, content: Content):
        content.owner = self._user
        content.is_archived = True
        # TODO - G.M - 12-03-2018 - Inspect possible label conflict problem
        # INFO - G.M - 12-03-2018 - Set label name to avoid trouble when
        # un-archiving file.
        content.label = '{label}-{action}-{date}'.format(
            label=content.label,
            action='archived',
            date=current_date_for_filename()
        )
        content.revision_type = ActionDescription.ARCHIVING

    def unarchive(self, content: Content):
        content.owner = self._user
        content.is_archived = False
        content.revision_type = ActionDescription.UNARCHIVING

    def delete(self, content: Content):
        content.owner = self._user
        content.is_deleted = True
        # TODO - G.M - 12-03-2018 - Inspect possible label conflict problem
        # INFO - G.M - 12-03-2018 - Set label name to avoid trouble when
        # un-deleting file.
        content.label = '{label}-{action}-{date}'.format(
            label=content.label,
            action='deleted',
            date=current_date_for_filename()
        )
        content.revision_type = ActionDescription.DELETION

    def undelete(self, content: Content):
        content.owner = self._user
        content.is_deleted = False
        content.revision_type = ActionDescription.UNDELETION

    def mark_read__all(self,
                       read_datetime: datetime=None,
                       do_flush: bool=True,
                       recursive: bool=True
                       ):

        itemset = self.get_last_unread(None, ContentType.Any)

        for item in itemset:
            self.mark_read(item, read_datetime, do_flush, recursive)

    def mark_read__workspace(self,
                       workspace : Workspace,
                       read_datetime: datetime=None,
                       do_flush: bool=True,
                       recursive: bool=True
                       ):

        itemset = self.get_last_unread(None, ContentType.Any, workspace)

        for item in itemset:
            self.mark_read(item, read_datetime, do_flush, recursive)

    def mark_read(self, content: Content,
                  read_datetime: datetime=None,
                  do_flush: bool=True, recursive: bool=True) -> Content:

        assert self._user
        assert content

        # The algorithm is:
        # 1. define the read datetime
        # 2. update all revisions related to current Content
        # 3. do the same for all child revisions
        #    (ie parent_id is content_id of current content)

        if not read_datetime:
            read_datetime = datetime.datetime.now()

        viewed_revisions = self._session.query(ContentRevisionRO) \
            .filter(ContentRevisionRO.content_id==content.content_id).all()

        for revision in viewed_revisions:
            revision.read_by[self._user] = read_datetime

        if recursive:
            # mark read :
            # - all children
            # - parent stuff (if you mark a comment as read,
            #                 then you have seen the parent)
            # - parent comments
            for child in content.get_valid_children():
                self.mark_read(child, read_datetime=read_datetime,
                               do_flush=False)

            if ContentType.Comment == content.type:
                self.mark_read(content.parent, read_datetime=read_datetime,
                               do_flush=False, recursive=False)
                for comment in content.parent.get_comments():
                    if comment != content:
                        self.mark_read(comment, read_datetime=read_datetime,
                                       do_flush=False, recursive=False)

        if do_flush:
            self.flush()

        return content

    def mark_unread(self, content: Content, do_flush=True) -> Content:
        assert self._user
        assert content

        revisions = self._session.query(ContentRevisionRO) \
            .filter(ContentRevisionRO.content_id==content.content_id).all()

        for revision in revisions:
            del revision.read_by[self._user]

        for child in content.get_valid_children():
            self.mark_unread(child, do_flush=False)

        if do_flush:
            self.flush()

        return content

    def flush(self):
        self._session.flush()

    def save(self, content: Content, action_description: str=None, do_flush=True, do_notify=True):
        """
        Save an object, flush the session and set the revision_type property
        :param content:
        :param action_description:
        :return:
        """
        assert action_description is None or action_description in ActionDescription.allowed_values()

        if not action_description:
            # See if the last action has been modified
            if content.revision_type==None or len(get_history(content.revision, 'revision_type'))<=0:
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
            config=self._config,
            current_user=self._user,
            session=self._session,
        ).notify_content_update(content)

    def get_keywords(self, search_string, search_string_separators=None) -> [str]:
        """
        :param search_string: a list of coma-separated keywords
        :return: a list of str (each keyword = 1 entry
        """

        search_string_separators = search_string_separators or ContentApi.SEARCH_SEPARATORS

        keywords = []
        if search_string:
            keywords = [keyword.strip() for keyword in re.split(search_string_separators, search_string)]

        return keywords

    def search(self, keywords: [str]) -> Query:
        """
        :return: a sorted list of Content items
        """

        if len(keywords)<=0:
            return None

        filter_group_label = list(Content.label.ilike('%{}%'.format(keyword)) for keyword in keywords)
        filter_group_desc = list(Content.description.ilike('%{}%'.format(keyword)) for keyword in keywords)
        title_keyworded_items = self._hard_filtered_base_query().\
            filter(or_(*(filter_group_label+filter_group_desc))).\
            options(joinedload('children_revisions')).\
            options(joinedload('parent'))

        return title_keyworded_items

    def get_all_types(self) -> typing.List[ContentType]:
        labels = ContentType.all()
        content_types = []
        for label in labels:
            content_types.append(ContentType(label))

        return ContentType.sorted(content_types)

    def exclude_unavailable(
        self,
        contents: typing.List[Content],
    ) -> typing.List[Content]:
        """
        Update and return list with content under archived/deleted removed.
        :param contents: List of contents to parse
        """
        for content in contents[:]:
            if self.content_under_deleted(content) or self.content_under_archived(content):
                contents.remove(content)
        return contents

    def content_under_deleted(self, content: Content) -> bool:
        if content.parent:
            if content.parent.is_deleted:
                return True
            if content.parent.parent:
                return self.content_under_deleted(content.parent)
        return False

    def content_under_archived(self, content: Content) -> bool:
        if content.parent:
            if content.parent.is_archived:
                return True
            if content.parent.parent:
                return self.content_under_archived(content.parent)
        return False

    def find_one_by_unique_property(
            self,
            property_name: str,
            property_value: str,
            workspace: Workspace=None,
    ) -> Content:
        """
        Return Content who contains given property.
        Raise sqlalchemy.orm.exc.MultipleResultsFound if more than one Content
        contains this property value.
        :param property_name: Name of property
        :param property_value: Value of property
        :param workspace: Workspace who contains Content
        :return: Found Content
        """
        # TODO - 20160602 - Bastien: Should be JSON type query
        # see https://www.compose.io/articles/using-json-extensions-in-\
        # postgresql-from-python-2/
        query = self._base_query(workspace=workspace).filter(
            Content._properties.like(
                '%"{property_name}": "{property_value}"%'.format(
                    property_name=property_name,
                    property_value=property_value,
                )
            )
        )
        return query.one()

    def generate_folder_label(
            self,
            workspace: Workspace,
            parent: Content=None,
    ) -> str:
        """
        Generate a folder label
        :param workspace: Future folder workspace
        :param parent: Parent of foture folder (can be None)
        :return: Generated folder name
        """
        query = self._base_query(workspace=workspace)\
            .filter(Content.label.ilike('{0}%'.format(
                _('New folder'),
            )))
        if parent:
            query = query.filter(Content.parent == parent)

        return _('New folder {0}').format(
            query.count() + 1,
        )
