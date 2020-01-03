import argparse
import traceback
import typing

from pyramid.scripting import AppEnvironment

from tracim_backend import UserDoesNotExist
from tracim_backend.command import AppContextCommand
from tracim_backend.exceptions import AgendaNotFoundError
from tracim_backend.exceptions import UserCannotBeDeleted
from tracim_backend.lib.cleanup.cleanup import CleanupLib
from tracim_backend.lib.cleanup.cleanup import UserNeedAnonymization
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
        return """Remove user and associated information from database"""

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "-w",
            "--delete-owned-sharespaces",
            help="Delete also owned sharespaces of user",
            dest="delete_sharespaces",
            default=False,
            action="store_true",
        )
        parser.add_argument(
            "-a",
            "--anonymize-if-needed",
            help="anonymizes the user where he cannot be deleted",
            dest="anonymize_if_needed",
            default=False,
            action="store_true",
        )
        parser.add_argument(
            "-r",
            "--delete-all-user-revisions",
            help="this allow to delete all user revisions. This may create inconsistent database",
            dest="delete_revisions",
            default=False,
            action="store_true",
        )

        parser.add_argument(
            "-b",
            "--best-effort",
            help="trying doing the best deletion possible, same as -w -a",
            dest="best_effort",
            default=False,
            action="store_true",
        )
        parser.add_argument(
            "-f",
            "--force",
            help="force user deletion, same as -r -w. May create inconsistent database",
            dest="force",
            default=False,
            action="store_true",
        )

        parser.add_argument(
            "--dry-run",
            help="dry-run mode",
            dest="dry_run_mode",
            default=False,
            action="store_true",
        )

        parser.add_argument(
            "-l", "--login", nargs="+", help="User logins (email)", dest="logins", required=True
        )
        parser.add_argument(
            "--anonymous-name",
            help="Anonymous user display name to use if anonymize option is activated",
            dest="anonymous_name",
            required=False,
        )
        return parser

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]

        delete_user_revision = parsed_args.force or parsed_args.delete_revisions
        delete_owned_sharespaces = (
            parsed_args.force or parsed_args.best_effort or parsed_args.delete_sharespaces
        )
        anonymize_user_if_needed = parsed_args.best_effort or parsed_args.anonymize_if_needed

        if parsed_args.dry_run_mode:
            print("(!) Running in dry-run mode, no changes will be applied.")
        if parsed_args.force:
            print("(!) Running in force mode")
        if parsed_args.best_effort:
            print("(!) Running in best_effort mode")

        if delete_user_revision:
            print("/!\\ Delete all user revisions, database created may be broken /!\\.")
        if delete_owned_sharespaces:
            print("(!) User owned sharespaces will be deleted too.")
        if anonymize_user_if_needed:
            print("(!) Will Anonymize user if not possible to delete it")
            if parsed_args.anonymous_name:
                print(
                    '(!) Custom anonymous name choosen is : "{}"'.format(parsed_args.anonymous_name)
                )

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
                    user = uapi.get_one_by_email(login)
                    user_list.append(user)
                except UserDoesNotExist as exc:
                    print('ERROR: user with email "{}" does not exist'.format(login))
                    raise exc
            print("~~~~~~~~~~")

            for user in user_list:
                cleanup_lib = CleanupLib(
                    session, self._app_config, dry_run_mode=parsed_args.dry_run_mode
                )
                deleted_user_ids_result = self._delete_user_database_info(
                    user,
                    force_delete_all_user_revisions=delete_user_revision,
                    anonymize_if_needed=anonymize_user_if_needed,
                    delete_owned_workspaces=delete_owned_sharespaces,
                    anonymized_user_display_name=parsed_args.anonymous_name,
                    cleanup_lib=cleanup_lib,
                )
                deleted_user_ids.add(deleted_user_ids_result.user_id)
                deleted_workspace_ids.update(deleted_user_ids_result.workspace_ids)
                print("~~~~~~~~~~")

            # INFO - G.M - 2019-12-13 - cleanup agenda at end of process
            if deleted_workspace_ids:
                deleted_workspace_ids_str = [
                    '"{}"'.format(workspace_id) for workspace_id in deleted_workspace_ids
                ]
                print("Delete agenda of workspaces {}".format(", ".join(deleted_workspace_ids_str)))
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
                print("Delete agenda of users {}".format(", ".join(deleted_user_ids_str)))
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

    def should_be_anonymized(
        self, user: User, owned_workspaces_will_be_deleted: bool, cleanup_lib: CleanupLib
    ) -> UserNeedAnonymization:
        # INFO - G.M - 2019-12-20 - check user revisions that need to be deleted for consistent database
        # if we do not want to anonymize user but delete him
        should_be_anonymized = cleanup_lib.should_be_anonymized(
            user, owned_workspace_will_be_deleted=owned_workspaces_will_be_deleted
        )

        if should_be_anonymized.blocking_revisions:
            print(
                '{} revision of user "{}" in sharespaces found, deleting them, can cause inconsistent'
                " database.".format(len(should_be_anonymized.blocking_revisions), user.user_id)
            )

        if should_be_anonymized.blocking_workspaces:
            print(
                '{} workspace(s) of user "{}" found, cannot delete user without deleting/changing ownership'.format(
                    len(should_be_anonymized.blocking_workspaces), user.user_id
                )
            )
        return should_be_anonymized

    def _delete_user_database_info(
        self,
        user: User,
        cleanup_lib: CleanupLib,
        delete_owned_workspaces: bool = False,
        force_delete_all_user_revisions: bool = False,
        anonymize_if_needed: bool = False,
        anonymized_user_display_name: typing.Optional[str] = None,
    ):
        print('Trying to delete user {}: "{}"'.format(user.user_id, user.email))

        deleted_workspace_ids = []
        deleted_user_id = user.user_id
        print("---------")
        should_be_anonymized = self.should_be_anonymized(
            user, owned_workspaces_will_be_deleted=delete_owned_workspaces, cleanup_lib=cleanup_lib
        )
        force_delete_all_associated_data = (
            force_delete_all_user_revisions and delete_owned_workspaces
        )

        revision_conflict_for_deleting_user = (
            should_be_anonymized.blocking_revisions and not force_delete_all_associated_data
        )
        workspace_conflict_for_deleting_user = (
            should_be_anonymized.blocking_workspaces and not delete_owned_workspaces
        )
        if (
            revision_conflict_for_deleting_user or workspace_conflict_for_deleting_user
        ) and not anonymize_if_needed:
            raise UserCannotBeDeleted(
                'user "{}" has revisions or workspaces left, cannot delete it'.format(user.user_id)
            )

        if delete_owned_workspaces:
            deleted_workspace_ids = cleanup_lib.delete_user_owned_workspace(user)
            print('Owned workspace for user "{}" deleted'.format(user.user_id))

        if force_delete_all_user_revisions:
            cleanup_lib.delete_user_revisions(user)
            print('All user "{}" revisions deleted'.format(user.user_id))

        if should_be_anonymized.need_anonymization and not force_delete_all_associated_data:
            cleanup_lib.delete_user_associated_data(user)
            cleanup_lib.anonymize_user(
                user, anonymized_user_display_name=anonymized_user_display_name
            )
            print(
                'user {} anonymized to "{} <{}>".'.format(
                    user.user_id, user.display_name, user.email
                )
            )
        else:
            print('delete user "{}"'.format(user.user_id))
            cleanup_lib.delete_user_associated_data(user)
            cleanup_lib.safe_delete(user)

        self._session.flush()
        return DeleteResultIds(deleted_user_id, deleted_workspace_ids)


class AnonymizeUserCommand(AppContextCommand):
    def get_description(self) -> str:
        return """anonymize user from database"""

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
            "--anonymous-name",
            help="Anonymous user display name to use",
            dest="anonymous_name",
            required=False,
        )
        parser.add_argument(
            "-l", "--login", nargs="+", help="User logins (email)", dest="logins", required=True
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
                    user = uapi.get_one_by_email(login)
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
                    user, anonymized_user_display_name=parsed_args.anonymous_name
                )
                self._session.flush()
                print(
                    'user {} anonymized to "{} <{}>".'.format(
                        user.user_id, user.display_name, user.email
                    )
                )
                print("~~~~~~~~~~")
