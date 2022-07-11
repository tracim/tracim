class TodoPath(object):
    """
    Paths parameters for todo: workspace id, content id, todo id
    """

    def __init__(self, workspace_id: int, content_id: int, todo_id: int) -> None:
        self.content_id = content_id
        self.workspace_id = workspace_id
        self.todo_id = todo_id
