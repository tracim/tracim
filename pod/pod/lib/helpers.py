# -*- coding: utf-8 -*-

"""WebHelpers used in pod."""

#from webhelpers import date, feedgenerator, html, number, misc, text
from markupsafe import Markup
from datetime import datetime
from tg.i18n import ugettext as _, lazy_ugettext as l_
import tg

def current_year():
  now = datetime.now()
  return now.strftime('%Y')

def icon(icon_name, white=False):
    if (white):
        return Markup('<i class="icon-%s icon-white"></i>' % icon_name)
    else:
        return Markup('<i class="icon-%s"></i>' % icon_name)


def getExplanationAboutStatus(psStatusId, psCurrentStatusId):
  lsMsg = ""
  if psStatusId==psCurrentStatusId:
    return _("This is the current status.")
  else:
    if psStatusId=='information':
      return _("The item is a normal document, like a howto or a text document.")
    if psStatusId=='automatic':
      return _("The item will be automatically computed as \"in progress\" or \"done\" according to its children status.")
    if psStatusId=='new':
      return _("No action done on the item.")
    if psStatusId=='inprogress':
      return _("The item is being worked on.")
    if psStatusId=='standby':
      return _("Waiting for some external actions.")
    if psStatusId=='done':
      return _("The work associated with the item is finished.")
    if psStatusId=='closed':
      return _("Close the item if you want not to see it anymore. The data won't be deleted")
    if psStatusId=='deleted':
      return _("This status tells that the item has been deleted.")

class ID(object):
  """ Helper class that will manage html items ids that need to be shared"""

  @classmethod
  def AddDocumentModalForm(cls, poNode=None):
    if poNode:
      return 'add-document-modal-form-%d'%poNode.node_id
    else:
      return 'add-document-modal-form'

  @classmethod
  def AddContactModalForm(cls, poNode=None):
    if poNode:
      return 'add-contact-modal-form-%d'%poNode.node_id
    else:
      return 'add-contact-modal-form'

  @classmethod
  def AddFileModalForm(cls, poNode=None):
    if poNode:
      return 'add-file-modal-form-%d'%poNode.node_id
    else:
      return 'add-file-modal-form'

  @classmethod
  def MoveDocumentModalForm(cls, poNode):
      return 'move-document-modal-form-{0}'.format(poNode.node_id)

  @classmethod
  def AddEventModalForm(cls, poNode=None):
    if poNode:
      return 'add-event-modal-form-%d'%poNode.node_id
    else:
      return 'add-event-modal-form'
    ## Original id is 'current-document-add-event-form'

  @classmethod
  def AddCommentInlineForm(cls):
    return 'current-document-add-comment-form'

class ICON(object):
  Shared = '<i class="fa fa-group"></i>'
  Private = '<i class="fa fa-key"></i>'

def tracker_js():
    js_file_path = tg.config.get('js_tracker_path', None)
    if js_file_path is not None:
        with open (js_file_path, "r") as js_file:
            data=js_file.read()
        return data
    else:
        return ""
