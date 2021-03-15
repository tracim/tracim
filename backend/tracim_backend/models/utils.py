import typing

from sqlalchemy import Column

from tracim_backend.models.meta import DeclarativeBase


def get_sort_expression(
    sort_string: str, model: DeclarativeBase, attribute_names_mapping: typing.Dict[str, str] = {}
) -> Column:
    """Return the SQL sort expression represented by the given string.
    Currently only one column is supported, in ascending or descending order.
    The string syntax is "attribute_alias_name:(asc|desc)".
    attribute_alias_name can either be the model's attribute name or a key of
    attribute_names_mapping which has the corresponding model'attribute as value.
    """
    name, order = sort_string.split(":")
    column = getattr(model, attribute_names_mapping.get(name, name))
    if order == "asc":
        return column.asc()
    elif order == "desc":
        return column.desc()
    raise ValueError("Invalid sort string: {}".format(sort_string))
