from .worker import worker_session


def do_database_job() -> None:
    from tracim_backend.models.event import Message

    with worker_session() as session:
        messages = session.query(Message).all()
        print("We have {} messages in the database".format(len(messages)))
