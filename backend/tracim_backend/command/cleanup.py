import argparse
import typing

from pyramid.scripting import AppEnvironment

from tracim_backend import UserDoesNotExist
from tracim_backend.command import AppContextCommand
from tracim_backend.lib.cleanup.cleanup import CleanupLib
from tracim_backend.lib.core.user import UserApi
from tracim_backend.models.auth import User
from tracim_backend.models.tracim_session import unprotected_content_revision


class DeleteResultIds(object):
    def __init__(self, user_id: int, workspace_ids: typing.Optional[typing.List[int]] = None) -> None:
        self.user_id = user_id
        self.workspace_ids = workspace_ids or []


class DeleteUserCommand(AppContextCommand):
    def get_description(self) -> str:
        return """Remove user and associated information from database"""

    def get_parser(self, prog_name: str) -> argparse.ArgumentParser:
        parser = super().get_parser(prog_name)
        parser.add_argument(
            "-best-effort",
            "--best-effort",
            help="anonymizes the user where he cannot be deleted",
            dest="best_effort",
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
            "-f",
            "--force",
            help="force user deletion, this allow to delete user and his revision in case user has"
            "created content in other user workspaces, this may create inconsistent database.",
            dest="force",
            default=False,
            action="store_true",
        )
        parser.add_argument(
            "-l", "--login", nargs="+", help="User logins (email)", dest="logins", required=True
        )
        parser.add_argument(
            "--anonymous-name",
            help="Anonymous user display name to use",
            dest="anonymous_name",
            required=False,
        )
        return parser

    def take_app_action(self, parsed_args: argparse.Namespace, app_context: AppEnvironment) -> None:
        self._session = app_context["request"].dbsession
        self._app_config = app_context["registry"].settings["CFG"]

        if parsed_args.dry_run_mode:
            print("(!) Running in dry-run mode, no changes will be applied.")
        if parsed_args.force:
            print("/!\\ Running in force mode, database created may be broken /!\\.")
        elif parsed_args.best_effort:
            print(
                "(!) Running in best effort mode, will anonymise account instead of deleting them if needed."
            )

        deleted_user_ids = set()
        deleted_workspace_ids = set()

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
                except UserDoesNotExist:
                    print("ERROR: user with email {} does not exist".format(login))
                    exit(1)
            print("~~~~~~~~~~")

            for user in user_list:
                cleanup_lib = CleanupLib(
                    session, self._app_config, dry_run_mode=parsed_args.dry_run_mode
                )
                deleted_user_ids_result = self._delete_user_database_info(
                    user,
                    force=parsed_args.force,
                    best_effort=parsed_args.best_effort,
                    cleanup_lib=cleanup_lib,
                    anonymised_user_display_name=parsed_args.anonymous_name,
                )
                deleted_user_ids.add(deleted_user_ids_result.user_id)
                deleted_workspace_ids.update(deleted_workspace_ids)
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
                    except FileNotFoundError:
                        print(
                            "Warning: Cannot delete agenda for workspace {}, agenda not found".format(
                                workspace_id
                            )
                        )

            if deleted_user_ids:
                deleted_user_ids_str = ['"{}"'.format(user_id) for user_id in deleted_user_ids]
                print("Delete agenda of users {}".format(", ".join(deleted_user_ids_str)))
                for user_id in deleted_user_ids:
                    try:
                        cleanup_lib.delete_user_agenda(user_id)
                    except FileNotFoundError:
                        print(
                            "Warning: Cannot delete agenda for user {}, agenda not found".format(
                                user_id
                            )
                        )

    def _delete_user_database_info(
        self,
        user: User,
        cleanup_lib: CleanupLib,
        force: bool = False,
        best_effort: bool = False,
        anonymised_user_display_name: typing.Optional[str] = None,
    ):
        print('Trying to delete user {}: "{}"'.format(user.user_id, user.email))
        not_owned_workspace_revisions = cleanup_lib.get_user_revisions_on_other_user_workspace(user)
        print("---------")
        if not_owned_workspace_revisions:
            print(
                '{} revision of user "{}" in other user workspace found, deleting them, can cause inconsistent'
                " database.".format(len(not_owned_workspace_revisions), user.user_id)
            )
        if best_effort and not_owned_workspace_revisions:
            # INFO - G.M - 2019-12-13 - We can anonymise user
            print(
                'Delete most user "{}" data in database but revision outside his workspace and anonymise it.'.format(
                    user.user_id
                )
            )
            cleanup_lib.delete_user_associated_data(user)
            deleted_workspace_ids = cleanup_lib.delete_user_owned_workspace(user)
            deleted_user_id = cleanup_lib.anonymise_user(
                user, anonymised_user_display_name=anonymised_user_display_name
            ).user_id
            print(
                'user {} anonymised to "{} <{}>".'.format(
                    user.user_id, user.display_name, user.email
                )
            )
        elif not_owned_workspace_revisions and not best_effort and not force:
            print(
                "ERROR: User {} has revisions in other user workspace. Cannot delete it without"
                " creating inconsistent database. Rollback changes.".format(user.user_id)
            )
            exit(3)
        else:
            print('Delete all user "{}" data in database'.format(user.user_id))
            # INFO - G.M - 2019-12-13 - We can delete full user data
            deleted_workspace_ids = cleanup_lib.delete_user_owned_workspace(user)
            deleted_user_id = cleanup_lib.delete_full_user(user)
        self._session.flush()
        return DeleteResultIds(deleted_user_id, deleted_workspace_ids)


class AnonymiseUserCommand(AppContextCommand):
    def get_description(self) -> str:
        return """anonymise user from database"""

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
                except UserDoesNotExist:
                    print("ERROR: user with email {} does not exist".format(login))
                    exit(2)
            for user in user_list:
                print("~~~~~~~~~~")
                cleanup_lib = CleanupLib(
                    session, self._app_config, dry_run_mode=parsed_args.dry_run_mode
                )
                print("anonymise user {}.".format(user.user_id))
                cleanup_lib.anonymise_user(
                    user, anonymised_user_display_name=parsed_args.anonymous_name
                )
                self._session.flush()
                print(
                    'user {} anonymised to "{} <{}>".'.format(
                        user.user_id, user.display_name, user.email
                    )
                )
                print("~~~~~~~~~~")
