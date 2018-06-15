# -*- coding: utf-8 -*-
from depot.io.utils import FileIntent
import transaction

from tracim import models
from tracim.fixtures import Fixture
from tracim.fixtures.users_and_groups import Test
from tracim.lib.core.content import ContentApi
from tracim.lib.core.userworkspace import RoleApi
from tracim.lib.core.workspace import WorkspaceApi
from tracim.models.data import ContentType
from tracim.models.data import UserRoleInWorkspace
from tracim.models.revision_protection import new_revision


class Content(Fixture):
    require = [Test]

    def insert(self):
        admin = self._session.query(models.User) \
            .filter(models.User.email == 'admin@admin.admin') \
            .one()
        bob = self._session.query(models.User) \
            .filter(models.User.email == 'bob@fsf.local') \
            .one()
        admin_workspace_api = WorkspaceApi(
            current_user=admin,
            session=self._session,
            config=self._config,
        )
        bob_workspace_api = WorkspaceApi(
            current_user=bob,
            session=self._session,
            config=self._config
        )
        content_api = ContentApi(
            current_user=admin,
            session=self._session,
            config=self._config
        )
        role_api = RoleApi(
            current_user=admin,
            session=self._session,
            config=self._config,
        )

        # Workspaces
        business_workspace = admin_workspace_api.create_workspace(
            'Business',
            description='All importants documents',
            save_now=True,
        )
        recipe_workspace = admin_workspace_api.create_workspace(
            'Recipes',
            description='Our best recipes',
            save_now=True,
        )
        other_workspace = bob_workspace_api.create_workspace(
            'Others',
            description='Other Workspace',
            save_now=True,
        )

        # Workspaces roles
        role_api.create_one(
            user=bob,
            workspace=recipe_workspace,
            role_level=UserRoleInWorkspace.CONTENT_MANAGER,
            with_notif=False,
        )
        # Folders

        tool_workspace = content_api.create(
            content_type=ContentType.Folder,
            workspace=business_workspace,
            label='Tools',
            do_save=True,
            do_notify=False,
        )
        menu_workspace = content_api.create(
            content_type=ContentType.Folder,
            workspace=business_workspace,
            label='Menus',
            do_save=True,
            do_notify=False,
        )

        dessert_folder = content_api.create(
            content_type=ContentType.Folder,
            workspace=recipe_workspace,
            label='Desserts',
            do_save=True,
            do_notify=False,
        )
        salads_folder = content_api.create(
            content_type=ContentType.Folder,
            workspace=recipe_workspace,
            label='Salads',
            do_save=True,
            do_notify=False,
        )
        other_folder = content_api.create(
            content_type=ContentType.Folder,
            workspace=other_workspace,
            label='Infos',
            do_save=True,
            do_notify=False,
        )

        # Pages, threads, ..
        tiramisu_page = content_api.create(
            content_type=ContentType.Page,
            workspace=recipe_workspace,
            parent=dessert_folder,
            label='Tiramisu Recipe',
            do_save=True,
            do_notify=False,
        )
        best_cake_thread = content_api.create(
            content_type=ContentType.Thread,
            workspace=recipe_workspace,
            parent=dessert_folder,
            label='Best Cakes ?',
            do_save=False,
            do_notify=False,
        )
        best_cake_thread.description = 'What is the best cake ?'
        self._session.add(best_cake_thread)
        apple_pie_recipe = content_api.create(
            content_type=ContentType.File,
            workspace=recipe_workspace,
            parent=dessert_folder,
            label='Apple_Pie',
            do_save=False,
            do_notify=False,
        )
        apple_pie_recipe.file_extension = '.txt'
        apple_pie_recipe.depot_file = FileIntent(
            b'Apple pie Recipe',
            'apple_Pie.txt',
            'text/plain',
        )
        self._session.add(apple_pie_recipe)
        Brownie_recipe = content_api.create(
            content_type=ContentType.File,
            workspace=recipe_workspace,
            parent=dessert_folder,
            label='Brownie Recipe',
            do_save=False,
            do_notify=False,
        )
        Brownie_recipe.file_extension = '.html'
        Brownie_recipe.depot_file = FileIntent(
            b'<p>Brownie Recipe</p>',
            'brownie_recipe.html',
            'text/html',
        )
        self._session.add(Brownie_recipe)
        fruits_desserts_folder = content_api.create(
            content_type=ContentType.Folder,
            workspace=recipe_workspace,
            label='Fruits Desserts',
            parent=dessert_folder,
            do_save=True,
        )

        menu_page = content_api.create(
            content_type=ContentType.Page,
            workspace=business_workspace,
            parent=menu_workspace,
            label='Current Menu',
            do_save=True,
        )

        new_fruit_salad = content_api.create(
            content_type=ContentType.Page,
            workspace=recipe_workspace,
            parent=fruits_desserts_folder,
            label='New Fruit Salad',
            do_save=True,
        )
        old_fruit_salad = content_api.create(
            content_type=ContentType.Page,
            workspace=recipe_workspace,
            parent=fruits_desserts_folder,
            label='Fruit Salad',
            do_save=True,
            do_notify=False,
        )
        with new_revision(
                session=self._session,
                tm=transaction.manager,
                content=old_fruit_salad,
        ):
            content_api.archive(old_fruit_salad)
        content_api.save(old_fruit_salad)

        bad_fruit_salad = content_api.create(
            content_type=ContentType.Page,
            workspace=recipe_workspace,
            parent=fruits_desserts_folder,
            label='Bad Fruit Salad',
            do_save=True,
            do_notify=False,
        )
        with new_revision(
                session=self._session,
                tm=transaction.manager,
                content=bad_fruit_salad,
        ):
            content_api.delete(bad_fruit_salad)
        content_api.save(bad_fruit_salad)

        # File at the root for test
        new_fruit_salad = content_api.create(
            content_type=ContentType.Page,
            workspace=other_workspace,
            label='New Fruit Salad',
            do_save=True,
        )
        old_fruit_salad = content_api.create(
            content_type=ContentType.Page,
            workspace=other_workspace,
            label='Fruit Salad',
            do_save=True,
        )
        with new_revision(
                session=self._session,
                tm=transaction.manager,
                content=old_fruit_salad,
        ):
            content_api.archive(old_fruit_salad)
        content_api.save(old_fruit_salad)

        bad_fruit_salad = content_api.create(
            content_type=ContentType.Page,
            workspace=other_workspace,
            label='Bad Fruit Salad',
            do_save=True,
        )
        with new_revision(
                session=self._session,
                tm=transaction.manager,
                content=bad_fruit_salad,
        ):
            content_api.delete(bad_fruit_salad)
        content_api.save(bad_fruit_salad)


        self._session.flush()
