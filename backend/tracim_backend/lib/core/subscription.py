from datetime import datetime
from typing import List
from typing import Optional

from sqlalchemy.orm import Query
from sqlalchemy.orm.exc import NoResultFound

from tracim_backend.config import CFG
from tracim_backend.exceptions import InvalidWorkspaceAccessType
from tracim_backend.exceptions import SubcriptionDoesNotExist
from tracim_backend.lib.core.userworkspace import RoleApi
from tracim_backend.models.auth import User
from tracim_backend.models.data import Workspace
from tracim_backend.models.data import WorkspaceAccessType
from tracim_backend.models.data import WorkspaceSubscription
from tracim_backend.models.data import WorkspaceSubscriptionState
from tracim_backend.models.roles import WorkspaceRoles
from tracim_backend.models.tracim_session import TracimSession


class SubscriptionLib(object):
    def __init__(self, current_user: Optional[User], session: TracimSession, config: CFG,) -> None:
        session.assert_event_mechanism()
        self._session = session
        self._user = current_user
        self._config = config
        self._role_lib = RoleApi(
            session=self._session, config=self._config, current_user=self._user
        )

    def _base_query(self) -> Query:
        return self._session.query(WorkspaceSubscription)

    def get_user_subscription(self, author_id: int) -> List[WorkspaceSubscription]:
        return (
            self._base_query()
            .filter(WorkspaceSubscription.author_id == author_id)
            .order_by(WorkspaceSubscription.workspace_id, WorkspaceSubscription.author_id)
            .all()
        )

    def get_workspace_subscriptions(self, workspace_id: int) -> List[WorkspaceSubscription]:
        return (
            self._base_query()
            .filter(WorkspaceSubscription.workspace_id == workspace_id)
            .order_by(WorkspaceSubscription.workspace_id, WorkspaceSubscription.author_id)
            .all()
        )

    def get_one(self, author_id: int, workspace_id: int) -> WorkspaceSubscription:
        try:
            return (
                self._base_query()
                .filter(WorkspaceSubscription.author_id == author_id)
                .filter(WorkspaceSubscription.workspace_id == workspace_id)
                .one()
            )
        except NoResultFound as exc:
            raise SubcriptionDoesNotExist(
                'Subscription for workspace "{}" '
                'and author "{}" not found in database'.format(workspace_id, author_id)
            ) from exc

    def submit_subscription(self, workspace: Workspace):
        if workspace.access_type != WorkspaceAccessType.ON_REQUEST:
            raise InvalidWorkspaceAccessType(
                "Workspace access type is not valid for subscription submission"
            )
        try:
            subscription = self.get_one(
                author_id=self._user.user_id, workspace_id=workspace.workspace_id
            )
        except SubcriptionDoesNotExist:
            subscription = WorkspaceSubscription(workspace=workspace, author=self._user)
        subscription.state = WorkspaceSubscriptionState.PENDING
        subscription.created_date = datetime.utcnow()
        subscription.evaluator_id = None
        subscription.evaluation_date = None
        self._session.add(subscription)
        self._session.add(subscription)
        self._session.flush()
        return subscription

    def accept_subscription(self, subscription: WorkspaceSubscription, user_role: WorkspaceRoles):
        subscription.state = WorkspaceSubscriptionState.ACCEPTED
        subscription.evaluator = self._user
        subscription.evaluation_date = datetime.utcnow()
        role = self._role_lib.create_one(
            user=subscription.author,
            workspace=subscription.workspace,
            role_level=user_role.level,
            with_notif=True,
        )
        self._session.add(subscription)
        self._session.add(role)
        self._session.flush()
        return subscription

    def reject_subscription(self, subscription: WorkspaceSubscription):
        subscription.state = WorkspaceSubscriptionState.REJECTED
        subscription.evaluator = self._user
        subscription.evaluation_date = datetime.utcnow()
        self._session.add(subscription)
        self._session.flush()
        return subscription
