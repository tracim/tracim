import typing

from bs4 import BeautifulSoup
from bs4 import Tag
from bs4 import NavigableString


class BodyMailPartType(object):
    Signature = 'sign'
    Main = 'main'
    Quote = 'quote'


class BodyMailPart(object):
    def __init__(
            self,
            text: str,
            part_type: str
    )-> None:
        self.text = text
        self.part_type = part_type


class BodyMailParts(object):
    """
    Data Structure to Distinct part of a Mail body into a "list" of BodyMailPart
    When 2 similar BodyMailPart (same part_type) are added one after the other,
    it doesn't create a new Part, it just merge those elements into one.
    It should always have only one Signature type part, normally
    at the end of the body.
    This object doesn't provide other set method than append() in order to
    preserve object coherence.
    """
    def __init__(self) -> None:
        self._list = []  # type; List[BodyMailPart]
        # INFO - G.M -
        # automatically merge new value with last item if true, without any
        # part_type check, same type as the older one, useful when some tag
        # say "all elem after me is Signature"
        self.follow = False

    def __len__(self) -> int:
        return len(self._list)

    def __getitem__(self, index) -> BodyMailPart:
        return self._list[index]

    def __delitem__(self, index) -> None:
        del self._list[index]
        # Todo : check consistance

    def append(self, value) -> None:
        BodyMailParts._check_value(value)
        self._append(value)

    def _append(self, value) -> None:
        same_type_as_last = len(self._list) > 0 and \
                            self._list[-1].part_type == value.part_type
        if same_type_as_last or self.follow:
            self._list[-1].text += value.text
        else:
            self._list.append(value)

    @classmethod
    def _check_value(cls, value) -> None:
        if not isinstance(value, BodyMailPart):
            raise TypeError()

    def drop_part_type(self, part_type: str) -> None:
        """
        Drop all elem of one part_type
        :param part_type: part_type to completely remove
        :return: None
        """
        new_list = [x for x in self._list if x.part_type != part_type]
        self._list = []
        # INFO - G.M - 2017-11-27 - use append() to have a consistent list
        for elem in new_list:
            self.append(elem)

    def get_nb_part_type(self, part_type: str) -> int:
        """
        Get number of elements of one part_type
        :param part_type: part_type to check
        :return: number of part_type elements
        """
        count = 0
        for elem in self._list:
            if elem.part_type == part_type:
                count += 1
        return count

    def __str__(self) -> str:
        s_mail = ''
        for elem in self._list:
            s_mail += elem.text
        return str(s_mail)


class SignatureIndexError(Exception):
    pass


class HtmlChecker(object):

    @classmethod
    def _has_attr_value(
            cls,
            elem: typing.Union[Tag, NavigableString],
            attribute_name: str,
            attribute_value: str,
    )-> bool:
        if isinstance(elem, Tag) and \
                        attribute_name in elem.attrs and \
                        attribute_value in elem.attrs[attribute_name]:
            return True
        return False


class HtmlMailQuoteChecker(HtmlChecker):

    @classmethod
    def is_quote(
            cls,
            elem: typing.Union[Tag, NavigableString]
    ) -> bool:
        return cls._is_standard_quote(elem) \
               or cls._is_thunderbird_quote(elem) \
               or cls._is_gmail_quote(elem) \
               or cls._is_outlook_com_quote(elem) \
               or cls._is_yahoo_quote(elem) \
               or cls._is_roundcube_quote(elem)

    @classmethod
    def _is_standard_quote(
            cls,
            elem: typing.Union[Tag, NavigableString]
    ) -> bool:
        if isinstance(elem, Tag) \
                and elem.name.lower() == 'blockquote':
            return True
        return False

    @classmethod
    def _is_thunderbird_quote(
            cls,
            elem: typing.Union[Tag, NavigableString]
    ) -> bool:
        return cls._has_attr_value(elem, 'class', 'moz-cite-prefix')

    @classmethod
    def _is_gmail_quote(
            cls,
            elem: typing.Union[Tag, NavigableString]
    ) -> bool:
        if cls._has_attr_value(elem, 'class', 'gmail_extra'):
            for child in elem.children:
                if cls._has_attr_value(child, 'class', 'gmail_quote'):
                    return True
        return False

    @classmethod
    def _is_outlook_com_quote(
        cls,
        elem: typing.Union[Tag, NavigableString]
    ) -> bool:
        if cls._has_attr_value(elem, 'id', 'divRplyFwdMsg'):
            return True
        return False

    @classmethod
    def _is_yahoo_quote(
            cls,
            elem: typing.Union[Tag, NavigableString]
    ) -> bool:
        return cls._has_attr_value(elem, 'class', 'yahoo_quoted')

    @classmethod
    def _is_roundcube_quote(
            cls,
            elem: typing.Union[Tag, NavigableString]
    ) -> bool:
        return cls._has_attr_value(elem, 'id', 'reply-intro')


class HtmlMailSignatureChecker(HtmlChecker):

    @classmethod
    def is_signature(
            cls,
            elem: typing.Union[Tag, NavigableString]
    ) -> bool:
        return cls._is_thunderbird_signature(elem) \
               or cls._is_gmail_signature(elem) \
               or cls._is_outlook_com_signature(elem)

    @classmethod
    def _is_thunderbird_signature(
            cls,
            elem: typing.Union[Tag, NavigableString]
    ) -> bool:
        return cls._has_attr_value(elem,
                                   'class',
                                   'moz-signature')

    @classmethod
    def _is_gmail_signature(
            cls,
            elem: typing.Union[Tag, NavigableString]
    ) -> bool:
        if cls._has_attr_value(elem, 'class', 'gmail_signature'):
            return True
        if cls._has_attr_value(elem, 'class', 'gmail_extra'):
            for child in elem.children:
                if cls._has_attr_value(child, 'class', 'gmail_signature'):
                    return True
        if isinstance(elem, Tag) and elem.name.lower() == 'div':
            for child in elem.children:
                if cls._has_attr_value(child, 'class', 'gmail_signature'):
                    return True
        return False

    @classmethod
    def _is_outlook_com_signature(
            cls,
            elem: typing.Union[Tag, NavigableString]
    ) -> bool:
        if cls._has_attr_value(elem, 'id', 'Signature'):
            return True
        return False


class ParsedHTMLMail(object):
    """
    Parse HTML Mail depending of some rules.
    Distinct part of html mail body using BodyMailParts object and
    process different rules.
    """

    def __init__(self, html_body: str):
        self.src_html_body = html_body

    def __str__(self):
        return str(self._parse_mail())

    def get_elements(self) -> BodyMailParts:
        tree = self._make_sanitized_tree()
        return self._distinct_elements(tree)

    def _parse_mail(self) -> BodyMailParts:
        elements = self.get_elements()
        elements = self._process_elements(elements)
        return elements

    def _make_sanitized_tree(self) -> BeautifulSoup:
        """
        Get only html body content and remove some unneeded elements
        :return:
        """
        tree = BeautifulSoup(self.src_html_body, 'html.parser')

        # Only parse body part of html if available
        subtree = tree.find('body')
        if subtree:
            tree = BeautifulSoup(str(subtree), 'html.parser')

        # if some sort of "meta_div", unwrap it
        while len(tree.findAll(recursive=None)) == 1 and \
                tree.find().name.lower() in ['body', 'div']:
            tree.find().unwrap()

        # drop some html elem
        for tag in tree.findAll():
            # HACK - G.M - 2017-11-28 - Unwrap outlook.com mail
            # if Text -> Signature -> Quote Mail
            # Text and signature are wrapped into divtagdefaultwrapper
            if tag.attrs.get('id'):
                if 'divtagdefaultwrapper' in tag.attrs['id']:
                    tag.unwrap()
            # Hack - G.M - 2017-11-28 : remove tag with no enclosure
            # <br> and <hr> tag alone broke html.parser tree,
            # Using another parser may be a solution.
            if tag.name.lower() in ['br', 'hr']:
                tag.unwrap()
                continue
            if tag.name.lower() in ['script', 'style']:
                tag.extract()

        return tree

    @classmethod
    def _distinct_elements(cls, tree: BeautifulSoup) -> BodyMailParts:
        elements = BodyMailParts()
        for tag in list(tree):
            txt = str(tag)
            part_type = BodyMailPartType.Main
            if isinstance(tag, NavigableString):
                txt = tag.replace('\n', '').strip()
            if not txt:
                continue
            if HtmlMailQuoteChecker.is_quote(tag):
                part_type = BodyMailPartType.Quote
            elif HtmlMailSignatureChecker.is_signature(tag):
                part_type = BodyMailPartType.Signature
            element = BodyMailPart(txt, part_type)
            elements.append(element)
            # INFO - G.M - 2017-11-28 - Outlook.com special case
            # all after quote tag is quote
            if HtmlMailQuoteChecker._is_outlook_com_quote(tag):
                elements.follow = True
        return elements

    @classmethod
    def _process_elements(cls, elements: BodyMailParts) -> BodyMailParts:
        if len(elements) >= 2:
            # Case 1 and 2, only one main and one quote
            if elements.get_nb_part_type('main') == 1 and \
                            elements.get_nb_part_type('quote') == 1:
                # Case 1 : Main first
                if elements[0].part_type == BodyMailPartType.Main:
                    cls._process_main_first_case(elements)
                # Case 2 : Quote first
                if elements[0].part_type == BodyMailPartType.Quote:
                    cls._process_quote_first_case(elements)
            else:
                # Case 3 : Multiple quotes and/or main
                cls._process_multiples_elems_case(elements)
        else:
            cls._process_default_case(elements)
            # default case (only one element or empty list)
        return elements

    @classmethod
    def _process_quote_first_case(cls, elements: BodyMailParts) -> None:
        elements.drop_part_type(BodyMailPartType.Signature)

    @classmethod
    def _process_main_first_case(cls, elements: BodyMailParts) -> None:
        elements.drop_part_type(BodyMailPartType.Quote)
        elements.drop_part_type(BodyMailPartType.Signature)

    @classmethod
    def _process_multiples_elems_case(cls, elements: BodyMailParts) -> None:
        elements.drop_part_type(BodyMailPartType.Signature)

    @classmethod
    def _process_default_case(cls, elements: BodyMailParts) -> None:
        elements.drop_part_type(BodyMailPartType.Quote)
        elements.drop_part_type(BodyMailPartType.Signature)
