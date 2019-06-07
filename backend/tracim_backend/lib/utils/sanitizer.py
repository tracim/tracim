import typing

from bs4 import BeautifulSoup
from bs4 import Tag

from tracim_backend.lib.mail_fetcher.email_processing.sanitizer_config.attrs_whitelist import (
    ATTRS_WHITELIST,
)
from tracim_backend.lib.mail_fetcher.email_processing.sanitizer_config.class_blacklist import (
    CLASS_BLACKLIST,
)
from tracim_backend.lib.mail_fetcher.email_processing.sanitizer_config.id_blacklist import (
    ID_BLACKLIST,
)
from tracim_backend.lib.mail_fetcher.email_processing.sanitizer_config.tag_blacklist import (
    TAG_BLACKLIST,
)
from tracim_backend.lib.mail_fetcher.email_processing.sanitizer_config.tag_whitelist import (
    TAG_WHITELIST,
)

ALLOWED_EMPTY_TAGS = ["video", "img", "source", "iframe"]


class HtmlSanitizerConfig(object):
    def __init__(
        self,
        tag_whitelist: list = TAG_WHITELIST,
        attrs_whitelist: list = ATTRS_WHITELIST,
        tag_blacklist: list = TAG_BLACKLIST,
        class_blacklist: list = CLASS_BLACKLIST,
        id_blacklist: list = ID_BLACKLIST,
        allowed_empty_tags: list = ALLOWED_EMPTY_TAGS,
        parser: str = "html.parser",
    ):
        self.tag_whitelist = tag_whitelist
        self.attrs_whitelist = attrs_whitelist
        self.tag_blacklist = tag_blacklist
        self.class_blacklist = class_blacklist
        self.id_blacklist = id_blacklist
        self.allowed_empty_tags = allowed_empty_tags
        self.parser = parser


class HtmlSanitizer(object):
    """
    Sanitize Html Rules :
    - Tag :
      - Remove Tag_blacklist tag
      - Keep Tag_whitelist tag
      - Unwrap others tags
    - Attrs :
      - Remove non-whitelisted attributes
    """

    # TODO - B.L - make the sanitizer config from tracim ini
    def __init__(self, html_body: str, config: HtmlSanitizerConfig = None):
        if config is None:
            config = HtmlSanitizerConfig()
        self.config = config
        self.soup = BeautifulSoup(html_body, config.parser)

    # INFO - B.L - 2019/05/03 - legacy code for emails do not use.
    def sanitize(self) -> typing.Optional[str]:
        for tag in self.soup.findAll():
            if self._tag_to_extract(tag):
                # INFO - BL - 2019/4/8 - extract removes the tag and all
                # its children
                tag.extract()
            elif tag.name.lower() in self.config.tag_whitelist:
                attrs = dict(tag.attrs)
                for attr in attrs:
                    if attr not in self.config.attrs_whitelist:
                        del tag.attrs[attr]
            else:
                # INFO - BL - 2019/4/8 - unwrap removes the tag but
                # not its children
                tag.unwrap()

        if self._is_content_empty(self.soup):
            return None
        else:
            return str(self.soup)

    # INFO - B.L - 2019/05/03 - legacy code for emails do not use.
    def _is_content_empty(self, soup):
        img = soup.find("img")
        txt = soup.get_text().replace("\n", "").strip()
        return not img and not txt

    # INFO - B.L - 2019/05/03 - legacy code for emails do not use.
    def _tag_to_extract(self, tag: Tag) -> bool:
        # INFO - BL - 2019/4/8 - returns True if tag is blacklisted or
        # contains a blacklisted class or id
        if tag.name.lower() in self.config.tag_blacklist:
            return True
        if "class" in tag.attrs:
            for elem in self.config.class_blacklist:
                if elem in tag.attrs["class"]:
                    return True
        if "id" in tag.attrs:
            for elem in self.config.id_blacklist:
                if elem in tag.attrs["id"]:
                    return True
        return False

    def html_is_empty(self, soup: Tag = None) -> bool:
        if not soup:
            soup = self.soup
        for tag in ALLOWED_EMPTY_TAGS:
            if soup.find(tag):
                return False
        return not soup.get_text().replace("\n", "").strip()

    def sanitize_html(self) -> str:
        assert not (
            self.config.tag_blacklist and self.soup.tag_whitelist
        ), "You must use either whitelist or blacklist"
        if self.config.tag_blacklist:
            self.soup = self._remove_black_listed_tags(self.soup)
        if self.config.tag_whitelist:
            self.soup = self._keep_white_listed_tags(self.soup)

        return str(self.soup)

    def _remove_black_listed_tags(self, soup: Tag) -> Tag:
        for tag in soup.findAll():
            if tag.name.lower() in self.config.tag_blacklist:
                tag.extract()
        return soup

    def _keep_white_listed_tags(self, soup: Tag) -> Tag:
        for tag in soup.findAll():
            if tag.name.lower() not in self.config.tag_whitelist:
                tag.extract()
        return soup
