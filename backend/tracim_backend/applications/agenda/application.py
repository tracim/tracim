from tracim_backend.app_models.applications import Application
from tracim_backend.config import CFG
from tracim_backend.lib.utils.app import TracimAppFactory


class AgendaAppFactory(TracimAppFactory):
    def create_app(self, app_config: CFG) -> Application:
        return Application(
            label="Agenda",
            slug="agenda",
            fa_icon="calendar",
            is_active=app_config.CALDAV__ENABLED,
            config={},
            main_route="/ui/workspaces/{workspace_id}/agenda",
            app_config=app_config,
        )
