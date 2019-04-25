# -*- coding: utf-8 -*-
import typing

from bs4 import NavigableString
from bs4 import Tag


class ProprietaryHTMLAttrValues(object):
    """
    This are all Proprietary (mail client specific) html attr value we need to
    check Html Elements
    """

    # Gmail
    Gmail_extras_class = "gmail_extra"
    Gmail_quote_class = "gmail_quote"
    Gmail_signature_class = "gmail_signature"
    # Thunderbird
    Thunderbird_quote_prefix_class = "moz-cite-prefix"
    Thunderbird_signature_class = "moz-signature"
    # Outlook.com
    Outlook_com_quote_id = "divRplyFwdMsg"
    Outlook_com_signature_id = "Signature"
    Outlook_com_wrapper_id = "divtagdefaultwrapper"
    # Yahoo
    Yahoo_quote_class = "yahoo_quoted"
    # Roundcube
    # INFO - G.M - 2017-11-29 - New tag
    # see : https://github.com/roundcube/roundcubemail/issues/6049
    Roundcube_quote_prefix_class = "reply-intro"


class HtmlChecker(object):
    @classmethod
    def _has_attr_value(
        cls, elem: typing.Union[Tag, NavigableString], attribute_name: str, attribute_value: str
    ) -> bool:
        """
        Check if elem contains attribute named attribute_name with
        attribute_value : example <a id="ident"> elem contain attribute
        with id as attribute_name and ident as attribute_value.
        Checking is not case_sensitive.

        :param elem: Tag or String Html Element
        :param attribute_name: Html attribute name
        :param attribute_value: Html attribute value
        :return: True only if Element contain this attribute.
        """
        if isinstance(elem, Tag) and attribute_name in elem.attrs:
            # INFO - G.M - 2017-12-01 - attrs[value}] can be string or list
            # use get_attribute_list to always check in a list
            # see https://www.crummy.com/software/BeautifulSoup/bs4/doc/#multi-valued-attributes
            values_lower = [value.lower() for value in elem.get_attribute_list(attribute_name)]
            return attribute_value.lower() in values_lower
        return False


class HtmlMailQuoteChecker(HtmlChecker):
    """
    Check if one HTML Element from Body Mail look-like a quote or not.
    """

    @classmethod
    def is_quote(cls, elem: typing.Union[Tag, NavigableString]) -> bool:
        return (
            cls._is_standard_quote(elem)
            or cls._is_thunderbird_quote(elem)
            or cls._is_gmail_quote(elem)
            or cls._is_outlook_com_quote(elem)
            or cls._is_yahoo_quote(elem)
            or cls._is_roundcube_quote(elem)
        )

    @classmethod
    def _is_standard_quote(cls, elem: typing.Union[Tag, NavigableString]) -> bool:
        if isinstance(elem, Tag) and elem.name.lower() == "blockquote":
            return True
        return False

    @classmethod
    def _is_thunderbird_quote(cls, elem: typing.Union[Tag, NavigableString]) -> bool:
        return cls._has_attr_value(
            elem, "class", ProprietaryHTMLAttrValues.Thunderbird_quote_prefix_class
        )

    @classmethod
    def _is_gmail_quote(cls, elem: typing.Union[Tag, NavigableString]) -> bool:
        if cls._has_attr_value(elem, "class", ProprietaryHTMLAttrValues.Gmail_extras_class):
            for child in elem.children:
                if cls._has_attr_value(child, "class", ProprietaryHTMLAttrValues.Gmail_quote_class):
                    return True
        return False

    @classmethod
    def _is_outlook_com_quote(cls, elem: typing.Union[Tag, NavigableString]) -> bool:
        if cls._has_attr_value(elem, "id", ProprietaryHTMLAttrValues.Outlook_com_quote_id):
            return True
        return False

    @classmethod
    def _is_yahoo_quote(cls, elem: typing.Union[Tag, NavigableString]) -> bool:
        return cls._has_attr_value(elem, "class", ProprietaryHTMLAttrValues.Yahoo_quote_class)

    @classmethod
    def _is_roundcube_quote(cls, elem: typing.Union[Tag, NavigableString]) -> bool:
        return cls._has_attr_value(
            elem, "id", ProprietaryHTMLAttrValues.Roundcube_quote_prefix_class
        )


class HtmlMailSignatureChecker(HtmlChecker):
    """
    Check if one HTML Element from Body Mail look-like a signature or not.
    """

    @classmethod
    def is_signature(cls, elem: typing.Union[Tag, NavigableString]) -> bool:
        return (
            cls._is_thunderbird_signature(elem)
            or cls._is_gmail_signature(elem)
            or cls._is_outlook_com_signature(elem)
        )

    @classmethod
    def _is_thunderbird_signature(cls, elem: typing.Union[Tag, NavigableString]) -> bool:
        return cls._has_attr_value(
            elem, "class", ProprietaryHTMLAttrValues.Thunderbird_signature_class
        )

    @classmethod
    def _is_gmail_signature(cls, elem: typing.Union[Tag, NavigableString]) -> bool:
        if cls._has_attr_value(elem, "class", ProprietaryHTMLAttrValues.Gmail_signature_class):
            return True
        if cls._has_attr_value(elem, "class", ProprietaryHTMLAttrValues.Gmail_extras_class):
            for child in elem.children:
                if cls._has_attr_value(
                    child, "class", ProprietaryHTMLAttrValues.Gmail_signature_class
                ):
                    return True
        if isinstance(elem, Tag) and elem.name.lower() == "div":
            for child in elem.children:
                if cls._has_attr_value(
                    child, "class", ProprietaryHTMLAttrValues.Gmail_signature_class
                ):
                    return True
        return False

    @classmethod
    def _is_outlook_com_signature(cls, elem: typing.Union[Tag, NavigableString]) -> bool:
        if cls._has_attr_value(elem, "id", ProprietaryHTMLAttrValues.Outlook_com_signature_id):
            return True
        return False
