from enum import Enum


class DavAuthorization(Enum):
    READ = "r"
    WRITE = "w"
    MANAGER = "m"
