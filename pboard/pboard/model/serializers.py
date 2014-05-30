# -*- coding: utf-8 -*-
import tg
from pboard.model import data as pmd

def PBNodeForMenu(func):

    def process_item(item: pmd.PBNode):
        """ convert given item into a dictionnary """
        url = tg.url('/document/', dict(node_id=item.node_id)) ## FIXME - 2014-05-27 - Make this more flexible
        print("########## BEFORE ##########")
        new_item = dict(
            id = item.node_id,
            children = item.getChildNb()>0,
            text = item.data_label,
            # parent = item._oParent.node_id if (item._oParent!=None) else '#',
            a_attr = { "href" : url },
            li_attr = { "title": item.data_label }
        )
        print("########## AFTER ##########")
        return new_item

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
        url = tg.url('/document/', dict(node_id=item.node_id)) ## FIXME - 2014-05-27 - Make this more flexible
        children = []
        for child_item in structure_item.children:
            children.append(process_item(child_item, current_node_id))
        # print("########## BEFORE ##########")

        children_field_value = None
        if len(children)>0:
            children_field_value = children
        elif item.getChildNb()>0:
            children_field_value = True
        else:
            children_field_value = False

        new_item_state = dict(
            opened = len(children)>0,
            selected = current_node_id!=None and item.node_id==current_node_id,
        )

        new_item = dict(
            id = item.node_id,
            children = children_field_value,
            text = item.data_label,
            # parent = item._oParent.node_id if (item._oParent!=None) else '#',
            state = new_item_state,
            a_attr = { "href" : url },
            li_attr = { "title": item.data_label }
        )
        # print("########## AFTER ##########")
        return new_item

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
