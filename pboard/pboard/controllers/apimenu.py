# -*- coding: utf-8 -*-

import tg

from pod.lib import base as plb
from pod.lib import dbapi as pld
from pod.model import data as pmd
from pod.model import serializers as pms

class PODApiMenuController(plb.BaseController):

    @tg.expose('json')
    @pms.PBNodeForMenu
    def children(self, id='#'):
        try:
            real_id = int(id)
        except Exception:
            real_id = None

        current_user = pld.PODStaticController.getCurrentUser()
        api_controller = pld.PODUserFilteredApiController(current_user.user_id)

        allowed_nodes = api_controller.getListOfAllowedNodes()
        parent_node = api_controller.getNode(real_id)
        child_nodes = api_controller.getChildNodesForMenu(parent_node, allowed_nodes)

        return child_nodes

    @tg.expose('json')
    @pms.NodeTreeItemForMenu
    def initialize(self, current_node_id=0, id='#'):
        try:
            real_id = int(id)
        except Exception:
            real_id = None

        current_user = pld.PODStaticController.getCurrentUser()
        api_controller = pld.PODUserFilteredApiController(current_user.user_id)

        current_node = None
        try:
            current_node = api_controller.getNode(current_node_id)
        except:
            print("Node not found: {0}".format(current_node_id))

        allowed_nodes = api_controller.getListOfAllowedNodes()
        initial_menu_structure = api_controller.buildTreeListForMenu(current_node, allowed_nodes)

        return initial_menu_structure



