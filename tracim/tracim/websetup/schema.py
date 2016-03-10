# -*- coding: utf-8 -*-
"""Setup the tracim application"""
from __future__ import print_function

import logging
from tg import config
import transaction

def setup_schema(command, conf, vars):
    """Place any commands to setup tracim here"""
    # Load the models

    # <websetup.websetup.schema.before.model.import>
    from tracim import model
    # <websetup.websetup.schema.after.model.import>

    
    # <websetup.websetup.schema.before.metadata.create_all>
    print("Creating tables")
    model.metadata.create_all(bind=config['tg.app_globals'].sa_engine)

    #ALTER TABLE bibi ADD COLUMN popo integer;

    # <websetup.websetup.schema.after.metadata.create_all>
    transaction.commit()
    print("Create additionnal tables.")
    model.metadata.create_all(bind=config['tg.app_globals'].sa_engine)

    print('Initializing Migrations')
    import alembic.config, alembic.command
    alembic_cfg = alembic.config.Config()
    alembic_cfg.set_main_option("script_location", "migration")
    alembic_cfg.set_main_option("sqlalchemy.url", config['sqlalchemy.url'])
    alembic.command.stamp(alembic_cfg, "head")
