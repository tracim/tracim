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
            icon: str,
            hexcolor: str,
            is_active: bool,
            config: typing.Dict[str, str],
            main_route: str,
    ) -> None:
        self.label = label
        self.slug = slug
        self.icon = icon
        self.hexcolor = hexcolor
        self.is_active = is_active
        self.config = config
        self.main_route = main_route


# default apps
calendar = Application(
    label='Calendar',
    slug='calendar',
    icon='calendar-alt',
    hexcolor='#757575',
    is_active=True,
    config={},
    main_route='/#/workspaces/{workspace_id}/calendar',
)

thread = Application(
    label='Threads',
    slug='contents/threads',
    icon='comments-o',
    hexcolor='#ad4cf9',
    is_active=True,
    config={},
    main_route='/#/workspaces/{workspace_id}/contents?type=thread',

)

file = Application(
    label='Files',
    slug='contents/files',
    icon='paperclip',
    hexcolor='#FF9900',
    is_active=True,
    config={},
    main_route='/#/workspaces/{workspace_id}/contents?type=file',
)

markdownpluspage = Application(
    label='Markdown Plus Documents',  # TODO - G.M - 24-05-2018 - Check label
    slug='contents/markdownpluspage',
    icon='file-code',
    hexcolor='#f12d2d',
    is_active=True,
    config={},
    main_route='/#/workspaces/{workspace_id}/contents?type=markdownpluspage',
)

htmlpage = Application(
    label='Text Documents',  # TODO - G.M - 24-05-2018 - Check label
    slug='contents/htmlpage',
    icon='file-text-o',
    hexcolor='#3f52e3',
    is_active=True,
    config={},
    main_route='/#/workspaces/{workspace_id}/contents?type=htmlpage',
)
# TODO - G.M - 08-06-2018 - This is hardcoded lists of app, make this dynamic.
# List of applications
applications = [
    htmlpage,
    markdownpluspage,
    file,
    thread,
    calendar,
]
