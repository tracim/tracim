# -*- coding: utf-8 -*-
import tg
from pod.model import data as pmd

def node_to_dict(node: pmd.PBNode, children_content, new_item_state):
    """
        children_content may be boolean or a list containing json values
    """
    url = tg.url('/document/', dict(node_id=node.node_id)) ## FIXME - 2014-05-27 - Make this more flexible

    return dict(
        id = node.node_id,
        children = children_content,
        text = node.data_label,
        a_attr = { "href" : url },
        li_attr = { "title": node.data_label },
        type = node.node_type, # this property is understandable by jstree (through "types" plugin)
        state = new_item_state,
        node_status = node.getStatus().getId() # this is not jstree understandable data. This requires a JS 'success' callback
    )


def PBNodeForMenu(func):

    def process_item(item: pmd.PBNode):
        """ convert given item into a dictionnary """
        return node_to_dict(item, item.getChildNb()>0, None)

    def pre_serialize(*args, **kws):
        initial_result = func(*args, **kws)
        real_result = None

        print("DEBUG ===================>", initial_result)
        if isinstance(initial_result, list):
            real_result = list()
            for value_item in initial_result:
                real_result.append(process_item(value_item))
        else:
            # We suppose here that we have an object only
            real_result = process_item(initial_result)

        return dict(d = real_result)

    return pre_serialize


def NodeTreeItemForMenu(func):
    """ works with structure NodeTreeItem """
    def process_item(structure_item: pmd.NodeTreeItem, current_node_id=None):
        """ convert given item into a dictionnary """

        item = structure_item.node
        children = []

        for child_item in structure_item.children:
            children.append(process_item(child_item, current_node_id))

        children_field_value = None
        if len(children)>0:
            children_field_value = children
        elif item.getChildNb()>0:
            children_field_value = True
        else:
            children_field_value = False

        new_item_state = dict(
            opened = item.getChildNb()<=0 or len(children)>0,
            selected = current_node_id!=None and item.node_id==current_node_id,
        )

        return node_to_dict(item, children_field_value, new_item_state)

    def pre_serialize(*args, **kws):
        initial_result = func(*args, **kws)
        real_result = None

        current_node_id = None
        if "current_node_id" in kws:
            current_node_id = int(kws['current_node_id'])

        if isinstance(initial_result, list):
            real_result = list()
            for value_item in initial_result:
                real_result.append(process_item(value_item, current_node_id))
        else:
            # We suppose here that we have an object only
            real_result = process_item(initial_result, current_node_id)

        return dict(d = real_result)

    return pre_serialize
