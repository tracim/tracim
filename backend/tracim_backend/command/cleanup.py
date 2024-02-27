import argparse
from pyramid.scripting import AppEnvironment
from sqlalchemy.engine import Engine
from sqlalchemy.event import listen
import traceback
import typing

from tracim_backend.applications.agenda.models import AgendaResourceType
from tracim_backend.apps import AGENDA__APP_SLUG
from tracim_backend.command import AppContextCommand
from tracim_backend.exceptions import AgendaNotFoundError
from tracim_backend.exceptions import CannotDeleteUniqueRevisionWithoutDeletingContent
from tracim_backend.exceptions import ContentNotFound
from tracim_backend.exceptions import ContentRevisionNotFound
from tracim_backend.exceptions import UserCannotBeDeleted
from tracim_backend.exceptions import UserDoesNotExist
from tracim_backend.exceptions import WorkspaceNotFound
from tracim_backend.extensions import app_list
from tracim_backend.lib.cleanup.cleanup import CleanupLib
from tracim_backend.lib.cleanup.cleanup import UserNeedAnonymization
from tracim_backend.lib.core.application import ApplicationApi
from tracim_backend.lib.core.content import ContentApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.lib.core.workspace import WorkspaceApi
from tracim_backend.models.auth import User
from tracim_backend.models.tracim_session import unprotected_content_revision


# INFO - F.S - 2023-05-30 - Enable cascade delete on sqlite database
def enable_sqlite_foreign_keys(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


# INFO - F.S - 2023-06-05 - Disable cascade delete on sqlite database
def disable_sqlite_foreign_keys(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=OFF")
    cursor.close()


class DeleteResultIds(object):
    def __init__(
        self, user_id: int, workspace_ids: typing.Optional[typing.List[int]] = None
    ) -> None:
        self.user_id = user_id
        self.workspace_ids = workspace_ids or []


class DeleteUserCommand(AppContextCommand):
    def get_description(self) -> str:
        return """Remove user account(s) and related information from the database"""

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "--dry-run",
            help="dry-run mode, simulate action to be done but do not modify anything",
            dest="dry_run_mode",
            default=False,
            action="store_true",
        )
        parser.add_argument(
            "-b",
            "--best-effort",
            help="trying doing the best deletion possible, same as '-w -a'",
            dest="best_effort",
            default=False,
            action="store_true",
        )
        parser.add_argument(
            "-f",
            "--force",
            help="force user deletion, same as '-r -w'. Warning ! This may create inconsistent database",
            dest="force",
            default=False,
            action="store_true",
        )
        parser.add_argument(
            "-a",
            "--anonymize-if-required",
            help="anonymize the user account when it cannot be deleted",
            dest="anonymize_if_required",
            default=False,
            action="store_true",
        )

        parser.add_argument(
            "--anonymize-name",
            help="anonymized user display name to use if anonymize option is activated",
            dest="anonymize_name",
            required=False,
        )
        parser.add_argument(
            "-r",
            "--delete-all-user-revisions",
            help="delete all user revisions and reactions. Warning ! This may put the database into an inconsistent state",
            dest="delete_revisions",
            default=False,
            action="store_true",
        )

        parser.add_argument(
            "-w",
            "--delete-owned-sharespaces",
            help="also delete owned sharespaces of user",
            dest="delete_sharespaces",
            default=False,
            action="store_true",
        )
        parser.add_argument(
            "-l",
            "--login",
            nargs="+",
            help="user logins (email or username) to delete one or more users",
            dest="logins",
            required=True,
        )
        return parser

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]

        delete_user_revision_and_reaction = parsed_args.force or parsed_args.delete_revisions
        delete_owned_sharespaces = (
            parsed_args.force or parsed_args.best_effort or parsed_args.delete_sharespaces
        )
        anonymize_if_required = parsed_args.best_effort or parsed_args.anonymize_if_required

        if parsed_args.dry_run_mode:
            print("(!) Running in dry-run mode, no changes will be applied.")
            app_context["request"].tm.doom()
        if parsed_args.force:
            print("(!) Running in force mode")
        if parsed_args.best_effort:
            print("(!) Running in best-effort mode")

        if delete_user_revision_and_reaction:
            print(
                "/!\\ Delete all user revision and reactions, database created may be broken /!\\."
            )
        if delete_owned_sharespaces:
            print("(!) User owned sharespaces will be deleted too.")
        if anonymize_if_required:
            print("(!) Will anonymize user if not possible to delete it")
            if parsed_args.anonymize_name:
                print(
                    '(!) Custom anonymize name choosen is: "{}"'.format(parsed_args.anonymize_name)
                )
        print("")
        deleted_user_ids = set()  # typing.Set[int]
        deleted_workspace_ids = set()  # typing.Set[int]
        with unprotected_content_revision(self._session) as session:
            uapi = UserApi(
                config=self._app_config,
                session=session,
                current_user=None,
                show_deleted=True,
                show_deactivated=True,
            )
            user_list = []  # type: typing.List[User]
            for login in parsed_args.logins:
                try:
                    user = uapi.get_one_by_login(login)
                    user_list.append(user)
                except UserDoesNotExist as exc:
                    print('ERROR: user with email/username "{}" does not exist'.format(login))
                    raise exc
            print("~~~~")
            print("Deletion of user from Database")
            print("~~~~\n")
            print("~~~~")
            for user in user_list:
                cleanup_lib = CleanupLib(
                    session, self._app_config, dry_run_mode=parsed_args.dry_run_mode
                )
                deleted_user_ids_result = self._delete_user_database_info(
                    user,
                    force_delete_all_user_revisions_and_reactions=delete_user_revision_and_reaction,
                    anonymize_if_required=anonymize_if_required,
                    delete_owned_workspaces=delete_owned_sharespaces,
                    anonymized_user_display_name=parsed_args.anonymize_name,
                    cleanup_lib=cleanup_lib,
                )
                deleted_user_ids.add(deleted_user_ids_result.user_id)
                deleted_workspace_ids.update(deleted_user_ids_result.workspace_ids)
                print("~~~~")
            print(
                "deletion of user(s) from database process almost finished, change will be applied at end "
                "of this script.\n"
            )
            print("~~~~")
            print("Deletion of Caldav Agenda\n")
            app_lib = ApplicationApi(app_list=app_list)
            if app_lib.exist(AGENDA__APP_SLUG):
                # INFO - G.M - 2019-12-13 - cleanup agenda at end of process
                if deleted_workspace_ids:
                    deleted_workspace_ids_str = [
                        '"{}"'.format(workspace_id) for workspace_id in deleted_workspace_ids
                    ]
                    print(
                        "delete agenda of workspaces {}".format(
                            ", ".join(deleted_workspace_ids_str)
                        )
                    )
                    for workspace_id in deleted_workspace_ids:
                        try:
                            cleanup_lib.delete_workspace_agenda(
                                workspace_id, resource_type=AgendaResourceType.calendar
                            )
                            cleanup_lib.delete_workspace_agenda(
                                workspace_id,
                                resource_type=AgendaResourceType.addressbook,
                            )
                        except AgendaNotFoundError:
                            print(
                                'Warning: Cannot delete agenda for workspace "{}", agenda not found. Agenda path may be incorrect or agenda not created'.format(
                                    workspace_id
                                )
                            )
                            print(traceback.format_exc())

                if deleted_user_ids:
                    deleted_user_ids_str = ['"{}"'.format(user_id) for user_id in deleted_user_ids]
                    print("delete agenda of users {}".format(", ".join(deleted_user_ids_str)))
                    for user_id in deleted_user_ids:
                        try:
                            cleanup_lib.delete_user_agenda(user_id, AgendaResourceType.calendar)
                            cleanup_lib.delete_user_agenda(user_id, AgendaResourceType.addressbook)
                            cleanup_lib.delete_user_dav_symlinks(user_id)
                        except AgendaNotFoundError:
                            print(
                                'Warning: Cannot delete agenda for user "{}", agenda not found. Agenda path may be incorrect or agenda not created'.format(
                                    user_id
                                )
                            )
                            print(traceback.format_exc())
            else:
                print("Warning ! Agenda app not enabled, agenda will not be deleted.")
            print("~~~~")
            print("deletion of Agenda process finished")
            print("~~~~")
            if parsed_args.dry_run_mode:
                print("Finished (dry-run mode, no change applied)")
            else:
                print("Finished")

    def should_anonymize(
        self,
        user: User,
        owned_workspaces_will_be_deleted: bool,
        cleanup_lib: CleanupLib,
    ) -> UserNeedAnonymization:
        # INFO - G.M - 2019-12-20 - check user revisions that need to be deleted for consistent database
        # if we do not want to anonymize user but delete him
        should_anonymize = cleanup_lib.should_anonymize(
            user, owned_workspace_will_be_deleted=owned_workspaces_will_be_deleted
        )

        if should_anonymize.blocking_reactions:
            print(
                '{} reactions of user "{}" in sharespaces found, deleting them, can cause inconsistent'
                " database.".format(len(should_anonymize.blocking_reactions), user.user_id)
            )
        if should_anonymize.blocking_revisions:
            print(
                '{} revision of user "{}" in sharespaces found, deleting them, can cause inconsistent'
                " database.".format(len(should_anonymize.blocking_revisions), user.user_id)
            )

        if should_anonymize.blocking_workspaces:
            print(
                '{} workspace(s) of user "{}" found, cannot delete user without deleting/changing ownership'.format(
                    len(should_anonymize.blocking_workspaces), user.user_id
                )
            )

        return should_anonymize

    def _delete_user_database_info(
        self,
        user: User,
        cleanup_lib: CleanupLib,
        delete_owned_workspaces: bool = False,
        force_delete_all_user_revisions_and_reactions: bool = False,
        anonymize_if_required: bool = False,
        anonymized_user_display_name: typing.Optional[str] = None,
    ):
        print('trying to delete user {}: "{}"\n'.format(user.user_id, user.login))

        deleted_workspace_ids = []
        deleted_user_id = user.user_id
        should_anonymize = self.should_anonymize(
            user,
            owned_workspaces_will_be_deleted=delete_owned_workspaces,
            cleanup_lib=cleanup_lib,
        )
        force_delete_all_associated_data = (
            force_delete_all_user_revisions_and_reactions and delete_owned_workspaces
        )

        revision_conflict_for_deleting_user = (
            should_anonymize.blocking_revisions and not force_delete_all_associated_data
        )
        workspace_conflict_for_deleting_user = (
            should_anonymize.blocking_workspaces and not delete_owned_workspaces
        )
        reaction_conflict_for_deleting_user = (
            should_anonymize.blocking_reactions and not force_delete_all_associated_data
        )
        if (
            revision_conflict_for_deleting_user
            or workspace_conflict_for_deleting_user
            or reaction_conflict_for_deleting_user
        ) and not anonymize_if_required:
            raise UserCannotBeDeleted(
                'user "{}" has revisions,reactions, or workspaces left, cannot delete it'.format(
                    user.user_id
                )
            )

        if delete_owned_workspaces:
            deleted_workspace_ids = cleanup_lib.delete_user_owned_workspace(user)
            print('owned workspace for user "{}" deleted'.format(user.user_id))

        if force_delete_all_user_revisions_and_reactions:
            cleanup_lib.delete_user_revisions(user)
            print('all user "{}" revisions deleted'.format(user.user_id))
            cleanup_lib.delete_user_reactions(user)
            print('all user "{}" reactions deleted'.format(user.user_id))

        if should_anonymize.need_anonymization and not force_delete_all_associated_data:
            # NOTE S.G. 2020-10-14 - Need to load the user config now as loading it after
            # delete_user_associated_data() in dry-run mode doesn't work
            user_config = user.config
            user_custom_properties = user.custom_properties
            cleanup_lib.delete_user_associated_data(user)
            # INFO - G.M 2021-06-29 - Flush to send all Workspace members deleted event.
            self._session.flush()
            cleanup_lib.prepare_deletion_or_anonymization(user)
            # INFO - G.M 2021-06-29 - Flush to send user deletion event.
            self._session.flush()
            cleanup_lib.anonymize_user(
                user, anonymized_user_display_name=anonymized_user_display_name
            )
            cleanup_lib.safe_delete(user_config)
            cleanup_lib.safe_delete(user_custom_properties)
            print(
                'user {} anonymized to "{} <{}/{}>".'.format(
                    user.user_id, user.display_name, user.email, user.username
                )
            )
        else:
            print('delete user "{}"'.format(user.user_id))
            # NOTE S.G. 2020-10-14 - Need to load the user config now as loading it after
            # delete_user_associated_data() in dry-run mode doesn't work
            user_config = user.config
            user_custom_properties = user.custom_properties
            cleanup_lib.delete_user_associated_data(user)
            # INFO - G.M 2021-06-29 - Flush to send all Workspace members deleted event.
            self._session.flush()
            cleanup_lib.prepare_deletion_or_anonymization(user)
            # INFO - G.M 2021-06-29 - Flush to send user deletion event.
            self._session.flush()
            # INFO - G.M 2021-03-15 - Check None case to avoid error when deleting
            # a previously anonymized user
            if user_config is not None:
                cleanup_lib.safe_delete(user_config)
            if user_custom_properties is not None:
                cleanup_lib.safe_delete(user_custom_properties)
            cleanup_lib.safe_delete(user)
            print('user "{}" deleted'.format(user.user_id))

        self._session.flush()
        return DeleteResultIds(deleted_user_id, deleted_workspace_ids)


class DeleteContentRevisionCommand(AppContextCommand):
    def get_description(self) -> str:
        return """delete content_revision from database"""

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "--dry-run",
            help="dry-run mode",
            dest="dry_run_mode",
            default=False,
            action="store_true",
        )
        parser.add_argument(
            "-i",
            "--content-revision-id",
            nargs="+",
            help="content revision ids",
            dest="revision_ids",
            required=True,
        )
        return parser

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]
        if self._session.bind.dialect.name == "sqlite":
            listen(Engine, "connect", enable_sqlite_foreign_keys)

        if parsed_args.dry_run_mode:
            print("(!) Running in dry-run mode, no change will be applied.")
            app_context["request"].tm.doom()

        with unprotected_content_revision(self._session) as session:
            capi = ContentApi(
                config=self._app_config, session=session, current_user=None, show_deleted=True
            )
            revision_list = []  # type: typing.List[ContentRevisionRO]
            for revision_id in parsed_args.revision_ids:
                try:
                    revision = capi.get_one_revision(revision_id)
                    revision_list.append(revision)
                except ContentRevisionNotFound as exc:
                    print('ERROR: revision with id "{}" does not exist'.format(revision_id))
                    raise exc

            for revision in revision_list:
                print("~~~~~~~~~~")
                cleanup_lib = CleanupLib(
                    session, self._app_config, dry_run_mode=parsed_args.dry_run_mode
                )
                print("delete revision {}.".format(revision.revision_id))
                try:
                    cleanup_lib.delete_revision(revision)
                except CannotDeleteUniqueRevisionWithoutDeletingContent as exc:
                    print(
                        "ERROR: You should explictly delete content instead of trying removing the"
                        ' last revision of a content. You should delete content "{}" instead of revision "{}".'.format(
                            revision.content_id, revision.revision_id
                        )
                    )
                    raise exc
                self._session.flush()
                print('revision "{}" deleted".'.format(revision.revision_id))
                print("~~~~~~~~~~")
        if self._session.bind.dialect.name == "sqlite":
            listen(Engine, "connect", disable_sqlite_foreign_keys)


class DeleteContentCommand(AppContextCommand):
    def get_description(self) -> str:
        return """delete content from database"""

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "--dry-run",
            help="dry-run mode",
            dest="dry_run_mode",
            default=False,
            action="store_true",
        )
        parser.add_argument(
            "-f",
            "--force",
            help="force delete",
            dest="force_delete",
            default=False,
            action="store_true",
        )
        parser.add_argument(
            "-i", "--content-id", nargs="+", help="content ids", dest="content_ids", required=True
        )
        return parser

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]
        if self._session.bind.dialect.name == "sqlite":
            listen(Engine, "connect", enable_sqlite_foreign_keys)

        if parsed_args.dry_run_mode:
            print("(!) Running in dry-run mode, no change will be applied.")
            app_context["request"].tm.doom()

        capi = ContentApi(
            config=self._app_config, session=self._session, current_user=None, show_deleted=True
        )
        content_list = []  # type: typing.List[Content]
        for content_id in parsed_args.content_ids:
            try:
                content = capi.get_one(content_id)
                content_list.append(content)
            except ContentNotFound as exc:
                print('ERROR: content with id "{}" does not exist'.format(content_id))
                raise exc

        for content in content_list:
            print("~~~~~~~~~~")
            cleanup_lib = CleanupLib(
                self._session, self._app_config, dry_run_mode=parsed_args.dry_run_mode
            )
            print("delete content {}.".format(content.id))
            if parsed_args.force_delete or content.is_deleted:
                # FIXME - G.M - 2022-04-11 - For unclear reason doing soft delete in dry_run
                # give Attribute error in recursive children.
                if not parsed_args.dry_run_mode:
                    cleanup_lib.soft_delete_content(content)
                self._session.flush()
                self._session.expire_all()
                with unprotected_content_revision(self._session) as session:
                    cleanup_lib_unprotected = CleanupLib(
                        session, self._app_config, dry_run_mode=parsed_args.dry_run_mode
                    )
                    cleanup_lib_unprotected.delete_content(content)
                    session.flush()
                print('content "{}" deleted".'.format(content.content_id))
            else:
                print(
                    "couldn't delete content {}, use --force to force delete content or set it as delete".format(
                        content.id
                    )
                )
            print("~~~~~~~~~~")
        if self._session.bind.dialect.name == "sqlite":
            listen(Engine, "connect", disable_sqlite_foreign_keys)


class DeleteSpaceCommand(AppContextCommand):
    def get_description(self) -> str:
        return """delete space from database"""

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "--dry-run",
            help="dry-run mode",
            dest="dry_run_mode",
            default=False,
            action="store_true",
        )
        parser.add_argument(
            "-f",
            "--force",
            help="force delete",
            dest="force_delete",
            default=False,
            action="store_true",
        )
        parser.add_argument(
            "-i", "--space-id", nargs="+", help="space ids", dest="space_ids", required=True
        )
        return parser

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]
        if self._session.bind.dialect.name == "sqlite":
            listen(Engine, "connect", enable_sqlite_foreign_keys)

        if parsed_args.dry_run_mode:
            print("(!) Running in dry-run mode, no change will be applied.")
            app_context["request"].tm.doom()

        with unprotected_content_revision(self._session) as session:
            wapi = WorkspaceApi(
                config=self._app_config, session=session, current_user=None, show_deleted=True
            )
            space_list = []  # type: typing.List[Workspace]
            for space_id in parsed_args.space_ids:
                try:
                    space = wapi.get_one(space_id)
                    space_list.append(space)
                except WorkspaceNotFound as exc:
                    print('ERROR: space with id "{}" does not exist'.format(space_id))
                    raise exc
            for space in space_list:
                print("~~~~~~~~~~")
                force_delete_retour = "no"
                if not parsed_args.force_delete:
                    nb_children = space.get_children().__len__()
                    nb_content = len(space.contents)
                    print(
                        "space {0} have {1} children and {2} content,".format(
                            space.workspace_id, nb_children, nb_content
                        )
                    )
                    print(
                        "are you sure you want to delete this space and all it's content (this action is permanant) ? yes/(no)"
                    )
                    force_delete_retour = input()
                    force_delete_retour = force_delete_retour.lower()
                if (
                    parsed_args.force_delete
                    or force_delete_retour == "yes"
                    or force_delete_retour == "y"
                    or parsed_args.dry_run_mode
                ):
                    cleanup_lib = CleanupLib(
                        session, self._app_config, dry_run_mode=parsed_args.dry_run_mode
                    )
                    # FIXME - G.M - 2022-04-11 - For unclear reason doing soft delete in dry_run
                    # give DetachedInstanceError.
                    if not parsed_args.dry_run_mode:
                        cleanup_lib.soft_delete_workspace(space)
                    session.flush()
                    session.expire_all()
                    print("delete space {}.".format(space.workspace_id))
                    cleanup_lib.delete_workspace(space)
                    session.flush()
                    print('space "{}" deleted".'.format(space.workspace_id))
                else:
                    print(
                        "couldn't delete space {}, use --force to force delete".format(
                            space.workspace_id
                        )
                    )
                print("~~~~~~~~~~")
        if self._session.bind.dialect.name == "sqlite":
            listen(Engine, "connect", disable_sqlite_foreign_keys)


class AnonymizeUserCommand(AppContextCommand):
    def get_description(self) -> str:
        return """anonymize user account(s) from database"""

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "--dry-run",
            help="dry-run mode",
            dest="dry_run_mode",
            default=False,
            action="store_true",
        )
        parser.add_argument(
            "--anonymize-name",
            help="anonymized user display name to use if anonymize option is activated",
            dest="anonymize_name",
            required=False,
        )
        parser.add_argument(
            "-l",
            "--login",
            nargs="+",
            help="user logins (email or username)",
            dest="logins",
            required=True,
        )
        return parser

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]

        if parsed_args.dry_run_mode:
            print("(!) Running in dry-run mode, not change will be applied.")
            app_context["request"].tm.doom()

        with unprotected_content_revision(self._session) as session:
            uapi = UserApi(
                config=self._app_config,
                session=session,
                current_user=None,
                show_deleted=True,
                show_deactivated=True,
            )
            user_list = []  # type: typing.List[User]
            for login in parsed_args.logins:
                try:
                    user = uapi.get_one_by_login(login)
                    user_list.append(user)
                except UserDoesNotExist as exc:
                    print('ERROR: user with email "{}" does not exist'.format(login))
                    raise exc
            for user in user_list:
                print("~~~~~~~~~~")
                cleanup_lib = CleanupLib(
                    session, self._app_config, dry_run_mode=parsed_args.dry_run_mode
                )
                print("anonymize user {}.".format(user.user_id))
                cleanup_lib.prepare_deletion_or_anonymization(user)
                # INFO - G.M 2021-06-29 - Flush to send user deletion event.
                self._session.flush()
                cleanup_lib.anonymize_user(
                    user, anonymized_user_display_name=parsed_args.anonymize_name
                )
                self._session.flush()
                print(
                    'user {} anonymized to "{} <{}/{}>".'.format(
                        user.user_id, user.display_name, user.email, user.username
                    )
                )
                print("~~~~~~~~~~")
