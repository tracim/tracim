from bs4 import BeautifulSoup

from tracim_backend.config import CFG
from tracim_backend.exceptions import UserDoesNotExist
from tracim_backend.models.tracim_session import TracimSession


class HtmlParser:
    def __init__(self, html, app_config: CFG, session: TracimSession):
        self.soup = BeautifulSoup(html, "html.parser")
        self.app_config = app_config
        self.session = session

    def add_hostname_to_internal_link(self):
        # INFO - 2025-07-07 - class name for internal link is defined by
        # frontend_lib/src/mentionOrLinkOrSanitize.js::searchContentAndReplaceWithTag
        internal_link_list = self.soup.find_all("a", class_="internal_link")
        for link in internal_link_list:
            try:
                link["href"] = self.app_config.WEBSITE__BASE_URL + link["href"]
            except KeyError:
                continue

    def add_public_name_to_mention(self):
        mention_list = self.soup.find_all("html-mention")

        # HACK - 2025-07-09 - Importing UserApi at the top of the file generate
        # circular import
        from tracim_backend.lib.core.user import UserApi

        user_api = UserApi(None, session=self.session, config=self.app_config)
        for mention in mention_list:
            try:
                user = user_api.get_one(mention["userid"])
                mention.string = user.public_name
            except UserDoesNotExist:
                continue
            except KeyError:
                continue
