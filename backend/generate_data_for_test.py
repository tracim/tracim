"""
This script generate many dir, note and comment of note in a new space
The goal of this script is to produce a "big" space in order to test
performance issue on it.
"""
import random
import string

import requests

base = "http://localhost:7999"

folder_number = 18
workspace_id = 1
parents_ids = [a for a in range(1, folder_number)]
session = requests.Session()
note_number = 200
note_length = 2000
comment_number = 5
session.post(
    "{base}/api/auth/login".format(base=base),
    json={"email": "admin@admin.admin", "password": "admin@admin.admin"},
)


def generate_random_text(letters=string.ascii_lowercase, length=10):
    return "".join(random.choice(letters) for i in range(length))


label = generate_random_text(length=8)
response = session.post(
    "{base}/api/workspaces".format(base=base),
    json={
        "label": "{}".format(label),
        "default_user_role": "reader",
        "description": "",
        "access_type": "confidential",
    },
)
for a in range(0, folder_number):
    label = generate_random_text(length=8)

    randombool = bool(random.getrandbits(1))
    parent_id = None
    if randombool:
        parent_id = random.choice(parents_ids)
        parent_id = parent_id if parent_id < a else None
    response = session.post(
        "{base}/api/workspaces/{workspace_id}/contents".format(
            workspace_id=workspace_id, base=base
        ),
        json={
            "content_namespace": "content",
            "content_type": "folder",
            "label": "{}".format(label),
            "parent_id": parent_id,
        },
    )

for a in range(0, note_number):
    label = generate_random_text(length=30)
    content = generate_random_text(length=note_length)
    response = session.post(
        "{base}/api/workspaces/{workspace_id}/contents".format(
            workspace_id=workspace_id, base=base
        ),
        json={
            "content_namespace": "content",
            "content_type": "html-document",
            "label": "{}".format(label),
            "parent_id": random.choice(parents_ids),
        },
    )
    content_id = response.json()["content_id"]
    response = session.put(
        "{base}/api/workspaces/{workspace_id}/html-documents/{content_id}".format(
            workspace_id=workspace_id, content_id=content_id, base=base
        ),
        json={"raw_content": content, "label": "{}".format(label)},
    )

    for a in range(0, comment_number):
        response = session.post(
            "{base}/api/workspaces/{workspace_id}/contents/{content_id}/comments".format(
                workspace_id=workspace_id, content_id=content_id, base=base
            ),
            json={"raw_content": generate_random_text(length=400)},
        )
