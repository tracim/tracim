# -*- coding: utf-8 -*-

__author__ = 'damien'

import tg

from sqlalchemy.orm.attributes import get_history
from tracim.model import DBSession
from tracim.model.auth import User
from tracim.model.data import ContentStatus, ContentRevisionRO, ActionDescription
from tracim.model.data import PBNode
from tracim.model.data import PBNodeType
from tracim.model.data import Workspace

class ContentApi(object):

    def __init__(self, current_user: User, show_archived=False, show_deleted=False):
        self._user = current_user
        self._show_archived = show_archived
        self._show_deleted = show_deleted

    def _base_query(self, workspace: Workspace=None):
        result = DBSession.query(PBNode)
        if workspace:
            result = result.filter(PBNode.workspace_id==workspace.workspace_id)

        if not self._show_deleted:
            result = result.filter(PBNode.is_deleted==False)

        if not self._show_archived:
            result = result.filter(PBNode.is_archived==False)

        return result

    def get_child_folders(self, parent: PBNode=None, workspace: Workspace=None, filter_by_allowed_content_types: list=[], removed_item_ids: list=[]) -> [PBNode]:
        # assert parent is None or isinstance(parent, PBNode) # DYN_REMOVE
        # assert workspace is None or isinstance(workspace, Workspace) # DYN_REMOVE

        parent_id = parent.node_id if parent else None
        folders = self._base_query(workspace).\
            filter(PBNode.parent_id==parent_id).\
            filter(PBNode.node_type==PBNodeType.Folder).\
            filter(PBNode.node_id.notin_(removed_item_ids)).\
            all()

        if not filter_by_allowed_content_types or len(filter_by_allowed_content_types)<=0:
            return folders

        # Now, the case is to filter folders by the content that they are allowed to contain
        result = []
        for folder in folders:
            for allowed_content_type in filter_by_allowed_content_types:
                print('ALLOWED = ', filter_by_allowed_content_types)
                print('CONTENT = ', folder.properties['allowed_content'])
                # exit()
                if folder.properties['allowed_content'][allowed_content_type]==True:
                    result.append(folder)

        return result

    def create(self, content_type: str, workspace: Workspace=None, parent: PBNode=None, label:str ='', do_save=False) -> PBNode:
        assert content_type in PBNodeType.allowed_types()
        content = PBNode()
        content.owner = self._user
        content.parent = parent
        content.workspace = workspace
        content.node_type = content_type
        content.data_label = label
        content.last_action = ActionDescription.CREATION

        if do_save:
            self.save(content)
        return content


    def create_comment(self, workspace: Workspace=None, parent: PBNode=None, content:str ='', do_save=False) -> PBNode:
        assert parent  and parent.node_type!=PBNodeType.Folder
        item = PBNode()
        item.owner = self._user
        item.parent = parent
        item.workspace = workspace
        item.node_type = PBNodeType.Comment
        item.data_content = content
        item.data_label = ''
        item.last_action = ActionDescription.COMMENT

        if do_save:
            self.save(item)
        return content


    def get_one_from_revision(self, content_id: int, content_type: str, workspace: Workspace=None, revision_id=None) -> PBNode:
        """
        This method is a hack to convert a node revision item into a node
        :param content_id:
        :param content_type:
        :param workspace:
        :param revision_id:
        :return:
        """

        content = self.get_one(content_id, content_type, workspace)
        revision = DBSession.query(ContentRevisionRO).filter(ContentRevisionRO.version_id==revision_id).one()

        if revision.node_id==content.node_id:
            content.revision_to_serialize = revision.version_id
        else:
            raise ValueError('Revision not found for given content')

        return content

    def get_one(self, content_id: int, content_type: str, workspace: Workspace=None) -> PBNode:
        assert content_id is None or isinstance(content_id, int) # DYN_REMOVE
        assert content_type is not None # DYN_REMOVE
        assert isinstance(content_type, str) # DYN_REMOVE

        if not content_id:
            return

        if content_type==PBNodeType.Any:
            return self._base_query(workspace).\
                filter(PBNode.node_id==content_id).\
                one()

        return self._base_query(workspace).\
            filter(PBNode.node_id==content_id).\
            filter(PBNode.node_type==content_type).\
            one()

    def get_all(self, parent_id: int, content_type: str, workspace: Workspace=None) -> PBNode:
        assert parent_id is None or isinstance(parent_id, int) # DYN_REMOVE
        assert content_type is not None # DYN_REMOVE
        assert isinstance(content_type, str) # DYN_REMOVE

        if not parent_id:
            return

        return self._base_query(workspace).\
            filter(PBNode.parent_id==parent_id).\
            filter(PBNode.node_type==content_type).\
            all()

    def set_allowed_content(self, folder: PBNode, allowed_content_dict:dict):
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
        assert folder.node_type==PBNodeType.Folder
        assert 'file' in allowed_content_dict.keys()
        assert 'folder' in allowed_content_dict.keys()
        assert 'page' in allowed_content_dict.keys()
        assert 'thread' in allowed_content_dict.keys()

        properties = dict(allowed_content = allowed_content_dict)
        folder.properties = properties


    def set_status(self, content: PBNode, new_status: str):
        if new_status in ContentStatus.allowed_values():
            content.node_status = new_status
            content.last_action = ActionDescription.STATUS_UPDATE
        else:
            raise ValueError('The given value {} is not allowed'.format(new_status))


    def move(self, item: PBNode, new_parent: PBNode, must_stay_in_same_workspace:bool=True):
        if must_stay_in_same_workspace:
            if new_parent and new_parent.workspace_id!=item.workspace_id:
                raise ValueError('the item should stay in the same workspace')

        item.parent = new_parent
        item.last_action = ActionDescription.EDITION


    def update_content(self, item: PBNode, new_label: str, new_content: str) -> PBNode:
        item.data_label = new_label
        item.data_content = new_content # TODO: convert urls into links
        item.last_action = ActionDescription.EDITION
        return item

    def update_file_data(self, item: PBNode, new_filename: str, new_mimetype: str, new_file_content) -> PBNode:
        item.data_file_name = new_filename
        item.data_file_mime_type = new_mimetype
        item.data_file_content = new_file_content
        return item

    def archive(self, content: PBNode):
        content.is_archived = True
        content.last_action = ActionDescription.ARCHIVING

    def unarchive(self, content: PBNode):
        content.is_archived = False
        content.last_action = ActionDescription.UNARCHIVING


    def delete(self, content: PBNode):
        content.is_deleted = True
        content.last_action = ActionDescription.DELETION

    def undelete(self, content: PBNode):
        content.is_deleted = False
        content.last_action = ActionDescription.UNDELETION

    def save(self, content: PBNode, action_description: str=None, do_flush=True):
        """
        Save an object, flush the session and set the last_action property
        :param content:
        :param action_description:
        :return:
        """
        assert action_description is None or action_description in ActionDescription.allowed_values()

        if not action_description:
            # See if the last action has been modified
            if content.last_action==None or len(get_history(content, 'last_action'))<=0:
                # The action has not been modified, so we set it to default edition
                action_description = ActionDescription.EDITION

        content.last_action = action_description

        if do_flush:
            DBSession.flush()

