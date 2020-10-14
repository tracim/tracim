import argparse
import traceback
import typing

from pyramid.scripting import AppEnvironment

from tracim_backend import UserDoesNotExist
from tracim_backend.apps import AGENDA__APP_SLUG
from tracim_backend.command import AppContextCommand
from tracim_backend.exceptions import AgendaNotFoundError
from tracim_backend.exceptions import UserCannotBeDeleted
from tracim_backend.extensions import app_list
from tracim_backend.lib.cleanup.cleanup import CleanupLib
from tracim_backend.lib.cleanup.cleanup import UserNeedAnonymization
from tracim_backend.lib.core.application import ApplicationApi
from tracim_backend.lib.core.user import UserApi
from tracim_backend.models.auth import User
from tracim_backend.models.tracim_session import unprotected_content_revision


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
            help="delete all user revisions. Warning ! This may put the database into an inconsistent state",
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

        delete_user_revision = parsed_args.force or parsed_args.delete_revisions
        delete_owned_sharespaces = (
            parsed_args.force or parsed_args.best_effort or parsed_args.delete_sharespaces
        )
        anonymize_if_required = parsed_args.best_effort or parsed_args.anonymize_if_required

        if parsed_args.dry_run_mode:
            print("(!) Running in dry-run mode, no changes will be applied.")
        if parsed_args.force:
            print("(!) Running in force mode")
        if parsed_args.best_effort:
            print("(!) Running in best-effort mode")

        if delete_user_revision:
            print("/!\\ Delete all user revisions, database created may be broken /!\\.")
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
                    force_delete_all_user_revisions=delete_user_revision,
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
                            cleanup_lib.delete_workspace_agenda(workspace_id)
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
                            cleanup_lib.delete_user_agenda(user_id)
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
        self, user: User, owned_workspaces_will_be_deleted: bool, cleanup_lib: CleanupLib
    ) -> UserNeedAnonymization:
        # INFO - G.M - 2019-12-20 - check user revisions that need to be deleted for consistent database
        # if we do not want to anonymize user but delete him
        should_anonymize = cleanup_lib.should_anonymize(
            user, owned_workspace_will_be_deleted=owned_workspaces_will_be_deleted
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
        force_delete_all_user_revisions: bool = False,
        anonymize_if_required: bool = False,
        anonymized_user_display_name: typing.Optional[str] = None,
    ):
        print('trying to delete user {}: "{}"\n'.format(user.user_id, user.login))

        deleted_workspace_ids = []
        deleted_user_id = user.user_id
        should_anonymize = self.should_anonymize(
            user, owned_workspaces_will_be_deleted=delete_owned_workspaces, cleanup_lib=cleanup_lib
        )
        force_delete_all_associated_data = (
            force_delete_all_user_revisions and delete_owned_workspaces
        )

        revision_conflict_for_deleting_user = (
            should_anonymize.blocking_revisions and not force_delete_all_associated_data
        )
        workspace_conflict_for_deleting_user = (
            should_anonymize.blocking_workspaces and not delete_owned_workspaces
        )
        if (
            revision_conflict_for_deleting_user or workspace_conflict_for_deleting_user
        ) and not anonymize_if_required:
            raise UserCannotBeDeleted(
                'user "{}" has revisions or workspaces left, cannot delete it'.format(user.user_id)
            )

        if delete_owned_workspaces:
            deleted_workspace_ids = cleanup_lib.delete_user_owned_workspace(user)
            print('owned workspace for user "{}" deleted'.format(user.user_id))

        if force_delete_all_user_revisions:
            cleanup_lib.delete_user_revisions(user)
            print('all user "{}" revisions deleted'.format(user.user_id))

        if should_anonymize.need_anonymization and not force_delete_all_associated_data:
            cleanup_lib.safe_delete(user.config)
            cleanup_lib.delete_user_associated_data(user)
            cleanup_lib.anonymize_user(
                user, anonymized_user_display_name=anonymized_user_display_name
            )
            print(
                'user {} anonymized to "{} <{}/{}>".'.format(
                    user.user_id, user.display_name, user.email, user.username
                )
            )
        else:
            print('delete user "{}"'.format(user.user_id))
            cleanup_lib.safe_delete(user.config)
            cleanup_lib.delete_user_associated_data(user)
            cleanup_lib.safe_delete(user)
            print('user "{}" deleted'.format(user.user_id))

        self._session.flush()
        return DeleteResultIds(deleted_user_id, deleted_workspace_ids)


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
