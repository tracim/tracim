# coding=utf-8
import typing


class Application(object):
    """
    Application class with data needed for frontend
    """
    def __init__(
            self,
            label: str,
            slug: str,
            fa_icon: str,
            hexcolor: str,
            is_active: bool,
            config: typing.Dict[str, str],
            main_route: str,
    ) -> None:
        """
        @param label: public label of application
        @param slug: identifier of application
        @param icon: font awesome icon class
        @param hexcolor: hexa color of application main color
        @param is_active: True if application enable, False if inactive
        @param config: a dict with eventual application config
        @param main_route: the route of the frontend "home" screen of
        the application. For exemple, if you have an application
        called "calendar", the main route will be something
        like /#/workspace/{wid}/calendar.
        """
        self.label = label
        self.slug = slug
        self.fa_icon = fa_icon
        self.hexcolor = hexcolor
        self.is_active = is_active
        self.config = config
        self.main_route = main_route


# default apps
calendar = Application(
    label='Calendar',
    slug='calendar',
    fa_icon='calendar',
    hexcolor='#757575',
    is_active=True,
    config={},
    main_route='/#/workspaces/{workspace_id}/calendar',
)

thread = Application(
    label='Threads',
    slug='contents/threads',
    fa_icon='comments-o',
    hexcolor='#ad4cf9',
    is_active=True,
    config={},
    main_route='/#/workspaces/{workspace_id}/contents?type=thread',

)

_file = Application(
    label='Files',
    slug='contents/files',
    fa_icon='paperclip',
    hexcolor='#FF9900',
    is_active=True,
    config={},
    main_route='/#/workspaces/{workspace_id}/contents?type=file',
)

markdownpluspage = Application(
    label='Markdown Plus Documents',  # TODO - G.M - 24-05-2018 - Check label
    slug='contents/markdownpluspage',
    fa_icon='file-code-o',
    hexcolor='#f12d2d',
    is_active=True,
    config={},
    main_route='/#/workspaces/{workspace_id}/contents?type=markdownpluspage',
)

html_documents = Application(
    label='Text Documents',  # TODO - G.M - 24-05-2018 - Check label
    slug='contents/html-documents',
    fa_icon='file-text-o',
    hexcolor='#3f52e3',
    is_active=True,
    config={},
    main_route='/#/workspaces/{workspace_id}/contents?type=html-documents',
)
# TODO - G.M - 08-06-2018 - This is hardcoded lists of app, make this dynamic.
# List of applications
applications = [
    html_documents,
    markdownpluspage,
    _file,
    thread,
    calendar,
]
