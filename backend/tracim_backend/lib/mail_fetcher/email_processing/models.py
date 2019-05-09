from bs4 import BeautifulSoup

# -*- coding: utf-8 -*-


class BodyMailPartType(object):
    Signature = "sign"
    Main = "main"
    Quote = "quote"


class BodyMailPart(object):
    def __init__(self, text: str, part_type: str) -> None:
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
        # FIXME - G.M - 2017-11-27 - Preserve BodyMailParts consistence
        # check elem after and before index and merge them if necessary.

    def append(self, value) -> None:
        BodyMailParts._check_value(value)
        self._append(value)

    def _append(self, value, follow=None) -> None:
        if follow is None:
            follow = self.follow

        if len(self._list) < 1:
            self._list.append(value)
        else:
            if self._list[-1].part_type == value.part_type or follow:
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
            self._append(elem, follow=False)

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
        s_mail = ""
        for elem in self._list:
            s_mail += elem.text
        return str(s_mail)


class HtmlBodyMailParts(BodyMailParts):
    def append(self, value):
        # INFO - G.M - 2017-12-01 - Override part_type is elem has no content.
        # Choose last elem part_type instead of the proposed one.
        if len(self._list) > 0:
            txt = BeautifulSoup(value.text, "html.parser").get_text()
            txt = txt.replace("\n", "").strip()
            img = BeautifulSoup(value.text, "html.parser").find("img")
            if not txt and not img:
                value.part_type = self._list[-1].part_type
        BodyMailParts._check_value(value)
        BodyMailParts._append(self, value)
