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


class HtmlSanitizerConfig(object):
    # whitelist : keep tag and content
    Tag_whitelist = TAG_WHITELIST
    Attrs_whitelist = ATTRS_WHITELIST
    # blacklist : remove content
    Tag_blacklist = TAG_BLACKLIST
    Class_blacklist = CLASS_BLACKLIST
    Id_blacklist = ID_BLACKLIST


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

    @classmethod
    def sanitize(cls, html_body: str) -> typing.Optional[str]:
        soup = BeautifulSoup(html_body, "html.parser")
        for tag in soup.findAll():
            if cls._tag_to_extract(tag):
                tag.extract()
            elif tag.name.lower() in HtmlSanitizerConfig.Tag_whitelist:
                attrs = dict(tag.attrs)
                for attr in attrs:
                    if attr not in HtmlSanitizerConfig.Attrs_whitelist:
                        del tag.attrs[attr]
            else:
                tag.unwrap()

        if cls._is_content_empty(soup):
            return None
        else:
            return str(soup)

    @classmethod
    def _is_content_empty(cls, soup):
        img = soup.find("img")
        txt = soup.get_text().replace("\n", "").strip()
        return not img and not txt

    @classmethod
    def _tag_to_extract(cls, tag: Tag) -> bool:
        if tag.name.lower() in HtmlSanitizerConfig.Tag_blacklist:
            return True
        if "class" in tag.attrs:
            for elem in HtmlSanitizerConfig.Class_blacklist:
                if elem in tag.attrs["class"]:
                    return True
        if "id" in tag.attrs:
            for elem in HtmlSanitizerConfig.Id_blacklist:
                if elem in tag.attrs["id"]:
                    return True
        return False
