from datetime import datetime

from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Sequence
from sqlalchemy.orm import deferred
from sqlalchemy.types import DateTime, Integer, LargeBinary, Unicode, UnicodeText, Float

from wsgidav.compat import to_unicode, to_bytes

# ==================================================
# Content
# ==================================================
class Workspace(object):
    __tablename__ = 'my_workspaces'

    workspace_id = Column(Integer, Sequence('my_seq__workspace__id'), autoincrement=True, primary_key=True)
    label = Column(Unicode(255), unique=False, nullable=False, default=to_unicode(''))

    created = Column(DateTime, unique=False, nullable=False, default=datetime.now)
    updated = Column(DateTime, unique=False, nullable=False, default=datetime.now)

    def __repr__(self):
        return "<Workspace %s : %s>" % (self.workspace_id, self.label)


class User(object):
    __tablename__ = 'my_users'

    user_id = Column(Integer, Sequence('my_seq__users__id'), autoincrement=True, primary_key=True)
    display_name = Column(Unicode(255), unique=True, nullable=False, default=to_unicode(''))
    password = Column(Unicode(255), unique=False, nullable=False, default=to_unicode(''))

    def __repr__(self):
        return "<User %s : %s>" % (self.user_id, self.display_name)


class UserWorkspace(object):
    __tablename__ = 'my_user_workspace'

    workspace_id = Column(Integer, ForeignKey('my_workspaces.workspace_id', ondelete="CASCADE"), nullable=False, primary_key=True)
    user_id = Column(Integer, ForeignKey('my_users.user_id', ondelete="CASCADE"), nullable=False, primary_key=True)
    role = Column(Unicode(255), unique=False, nullable=False, default=u'NOT_APPLICABLE')

    def __repr__(self):
        return "<Role (W:%s, U:%s) : %s" % (self.workspace_id, self.user_id, self.role)


class ItemRevision(object):
    __tablename__ = 'my_items_revisions'

    id = Column(Integer, Sequence('my_seq__items__id'), autoincrement=True, primary_key=True)
    workspace_id = Column(Integer, ForeignKey('my_workspaces.workspace_id', ondelete="CASCADE"), nullable=False)
    parent_id = Column(Integer, ForeignKey('my_items_revisions.id', ondelete="CASCADE"), nullable=True, default=None)

    item_type = Column(Unicode(32), unique=False, nullable=False)
    item_name = Column(Unicode(255), unique=False, nullable=False, default=to_unicode(''))
    item_content = deferred(Column(LargeBinary(), unique=False, nullable=True, default=to_bytes('')))

    created = Column(DateTime, unique=False, nullable=False, default=datetime.now)
    updated = Column(DateTime, unique=False, nullable=False, default=datetime.now)

    parent_revision_id = Column(Integer, ForeignKey('my_items_revisions.id', ondelete="CASCADE"), nullable=True, default=None)
    child_revision_id = Column(Integer, ForeignKey('my_items_revisions.id', ondelete="CASCADE"), nullable=True, default=None)

    def __repr__(self):
        return "<Content %s : %s in %s>" % (self.id, self.item_name, self.parent_id)


class Lock(object):
    __tablename__ = 'my_locks'

    token = Column(UnicodeText, primary_key=True, unique=True, nullable=False)
    depth = Column(Unicode(32), unique=False, nullable=False, default=to_unicode('infinity'))
    root = Column(UnicodeText, unique=False, nullable=False)
    type = Column(Unicode(32), unique=False, nullable=False, default=to_unicode('write'))
    scope = Column(Unicode(32), unique=False, nullable=False, default=to_unicode('exclusive'))
    owner = Column(UnicodeText, unique=False, nullable=False)
    expire = Column(Float, unique=False, nullable=False)
    principal = Column(Unicode(255), ForeignKey('my_users.display_name', ondelete="CASCADE"))
    timeout = Column(Float, unique=False, nullable=False)


class Url2Token(object):
    __tablename__ = 'my_url2token'

    token = Column(UnicodeText, primary_key=True, unique=True, nullable=False)
    path = Column(UnicodeText, primary_key=True, unique=False, nullable=False)
