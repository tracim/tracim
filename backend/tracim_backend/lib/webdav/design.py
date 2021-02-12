# coding: utf8
from datetime import datetime

from babel.dates import format_datetime

from tracim_backend.lib.utils.translation import get_locale
from tracim_backend.models import data

# FIXME: fix temporaire ...
style = """
.title {
    background:#F5F5F5;
    padding-right:15px;
    padding-left:15px;
    padding-top:10px;
    border-bottom:1px solid #CCCCCC;
    overflow:auto;
} .title h1 { margin-top:0; }

.content {
    padding: 15px;
}

#left{ padding:0; }

#right {
    background:#F5F5F5;
    border-left:1px solid #CCCCCC;
    border-bottom: 1px solid #CCCCCC;
    padding-top:15px;
}
@media (max-width: 1200px) {
    #right {
        border-top:1px solid #CCCCCC;
        border-left: none;
        border-bottom: none;
    }
}

body { overflow:auto; }

.btn {
    text-align: left;
}

.table tbody tr .my-align {
    vertical-align:middle;
}

.title-icon {
    font-size:2.5em;
    float:left;
    margin-right:10px;
}
.title.page, .title-icon.page { color:#00CC00; }
.title.thread, .title-icon.thread { color:#428BCA; }

/* ****************************** */
.description-icon {
    color:#999;
    font-size:3em;
}

.description {
    border-left: 5px solid #999;
    padding-left: 10px;
    margin-left: 10px;
    margin-bottom:10px;
}

.description-text {
    display:block;
    overflow:hidden;
    color:#999;
}

.comment-row:nth-child(2n) {
    background-color:#F5F5F5;
}

.comment-row:nth-child(2n+1) {
    background-color:#FFF;
}

.comment-icon {
    color:#CCC;
    font-size:3em;
    display:inline-block;
    margin-right: 10px;
    float:left;
}

.comment-content {
    display:block;
    overflow:hidden;
}

.comment, .comment-revision {
    padding:10px;
    border-top: 1px solid #999;
}

.comment-revision-icon {
    color:#777;
    margin-right: 10px;
}

.title-text {
    display: inline-block;
}
"""

_LABELS = {
    "archiving": "Item archived",
    "content-comment": "Item commented",
    "creation": "Item created",
    "deletion": "Item deleted",
    "edition": "item modified",
    "revision": "New revision",
    "status-update": "New status",
    "unarchiving": "Item unarchived",
    "undeletion": "Item undeleted",
    "move": "Item moved",
    "comment": "Comment",
    "copy": "Item copied",
}

THREAD_MESSAGE = """
  <p>
    {posting_time},{comment_owner} wrote:
  </p>
  <p style="padding-left: 1em;">
    {comment_content}
  </p>

"""


def create_readable_date(created, delta_from_datetime: datetime = None):
    if not delta_from_datetime:
        delta_from_datetime = datetime.now()

    delta = delta_from_datetime - created

    if delta.days > 0:
        if delta.days >= 365:
            aff = "%d year%s ago" % (delta.days / 365, "s" if delta.days / 365 >= 2 else "")
        elif delta.days >= 30:
            aff = "%d month%s ago" % (delta.days / 30, "s" if delta.days / 30 >= 2 else "")
        else:
            aff = "%d day%s ago" % (delta.days, "s" if delta.days >= 2 else "")
    else:
        if delta.seconds < 60:
            aff = "%d second%s ago" % (delta.seconds, "s" if delta.seconds > 1 else "")
        elif delta.seconds / 60 < 60:
            aff = "%d minute%s ago" % (delta.seconds / 60, "s" if delta.seconds / 60 >= 2 else "")
        else:
            aff = "%d hour%s ago" % (delta.seconds / 3600, "s" if delta.seconds / 3600 >= 2 else "")

    return aff


def design_page(content: data.Content, content_revision: data.ContentRevisionRO) -> str:

    return content_revision.raw_content


def design_thread(content: data.Content, content_revision: data.ContentRevisionRO, comments) -> str:

    if len(comments) == 0:
        return ""

    first_comment = comments[0]
    thread = THREAD_MESSAGE.format(
        posting_time=format_datetime(first_comment.created, locale=get_locale()),
        comment_owner=first_comment.owner.display_name,
        comment_content=first_comment.raw_content_as_raw_text(),
    )
    if len(comments) == 1:
        return thread

    thread_closing_tags = ""
    for comment in comments[1:]:
        thread += (
            '<blockquote style="border-left: solid 2px #999; margin-left: 1em; padding-left: 1em;">'
        )
        thread += THREAD_MESSAGE.format(
            posting_time=format_datetime(comment.created, locale=get_locale()),
            comment_owner=comment.owner.display_name,
            comment_content=comment.raw_content_as_raw_text(),
        )
        thread_closing_tags += "</blockquote>"
    thread += thread_closing_tags

    return thread
