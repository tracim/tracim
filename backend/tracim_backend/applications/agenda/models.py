from enum import Enum


class AgendaType(Enum):
    private = "private"
    workspace = "workspace"
    remote = "remote"


class AgendaResourceType(Enum):
    directory = "directory"
    calendar = "calendar"
    addressbook = "addressbook"
