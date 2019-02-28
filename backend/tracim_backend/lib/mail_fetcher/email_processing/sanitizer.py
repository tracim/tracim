import typing
from bs4 import BeautifulSoup, Tag
from tracim_backend.lib.mail_fetcher.email_processing.sanitizer_config.attrs_whitelist import ATTRS_WHITELIST  # nopep8
from tracim_backend.lib.mail_fetcher.email_processing.sanitizer_config.class_blacklist import CLASS_BLACKLIST  # nopep8
from tracim_backend.lib.mail_fetcher.email_processing.sanitizer_config.id_blacklist import ID_BLACKLIST  # nopep8
from tracim_backend.lib.mail_fetcher.email_processing.sanitizer_config.tag_blacklist import TAG_BLACKLIST  # nopep8
from tracim_backend.lib.mail_fetcher.email_processing.sanitizer_config.tag_whitelist import TAG_WHITELIST  # nopep8


class HtmlSanitizerConfig(object):

    def __init__(
            self,
            tag_whitelist: list = TAG_WHITELIST,
            attrs_whitelist: list = ATTRS_WHITELIST,
            tag_blacklist: list = TAG_BLACKLIST,
            class_blacklist: list = CLASS_BLACKLIST,
            id_blacklist: list = ID_BLACKLIST,
            parser: str = 'html.parser'
    ):
        self.tag_whitelist = tag_whitelist
        self.attrs_whitelist = attrs_whitelist
        self.tag_blacklist = tag_blacklist
        self.class_blacklist = class_blacklist
        self.id_blacklist = id_blacklist
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

    def __init__(self, html_body: str, config: HtmlSanitizerConfig = None):
        if config is None:
            config = HtmlSanitizerConfig()
        self.config = config
        self.soup = BeautifulSoup(html_body, config.parser)

    def sanitize(self) -> typing.Optional[str]:
        for tag in self.soup.findAll():
            if self._tag_to_extract(tag):
                tag.extract()
            elif tag.name.lower() in self.config.tag_whitelist:
                attrs = dict(tag.attrs)
                for attr in attrs:
                    if attr not in self.config.attrs_whitelist:
                        del tag.attrs[attr]
            else:
                tag.unwrap()

        if self._is_content_empty(self.soup):
            return None
        else:
            return str(self.soup)

    def _is_content_empty(self, soup: Tag) -> bool:
        img = soup.find('img')
        txt = soup.get_text().replace('\n', '').strip()
        return (not img and not txt)

    def _tag_to_extract(self, tag: Tag) -> bool:
        if tag.name.lower() in self.config.tag_blacklist:
            return True
        if 'class' in tag.attrs:
            for elem in self.config.class_blacklist:
                if elem in tag.attrs['class']:
                    return True
        if 'id' in tag.attrs:
            for elem in self.config.id_blacklist:
                if elem in tag.attrs['id']:
                    return True
        return False

    def html_is_empty(self, node_to_inspect: Tag = None) -> bool:
        """
        Inspects all nodes of an html tag and returns True if all of them are
        empty.

        :param node_to_inspect: Node to inspect, if None the root node is used
        :type node_to_inspect: bs4.Tag
        :returns: boolean

        :Example:
        <p></p> return True
        <p><p></p></p> returns True
        <p><p>some text</p></p> return False

        """
        if not node_to_inspect:
            node_to_inspect = self.soup
        if not self._is_content_empty(node_to_inspect):
            return False
        return all(
            (self.html_is_empty(child) for child in node_to_inspect.children)
        )

    def is_html(self) -> bool:
        """
        Checks if the html_body given to the constructor contains html

        :returns: boolean

        :Example:
        <p>some text</p> return True
        'some text' return False
        """
        return self.soup.find() is not None
