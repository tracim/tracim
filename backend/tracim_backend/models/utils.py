import typing

from sqlalchemy import Column

from tracim_backend.models.meta import DeclarativeBase


def get_sort_expression(
    sort_string: str, model: DeclarativeBase, column_names_mapping: typing.Dict[str, str] = {}
) -> Column:
    name, order = sort_string.split(":")
    column = getattr(model, column_names_mapping.get(name, name))
    if order == "asc":
        return column.asc()
    elif order == "desc":
        return column.desc()
    raise ValueError("Invalid sort string: {}".format(sort_string))
