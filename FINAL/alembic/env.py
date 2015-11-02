from __future__ import with_statement

import sys
from os.path import dirname, abspath
sys.path.append(dirname(dirname(abspath(__file__))))

from alembic import context
from sqlalchemy import engine_from_config, pool
from logging.config import fileConfig

from app.models import *
from app.extensions import db
from app import create_app
from app.config import ProdConfig, LocalConfig, StagingConfig


# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
fileConfig(config.config_file_name)

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def exclude_tables_from_config(config_):
    tables_ = config_.get("tables", None)
    if tables_ is not None:
        tables = tables_.split(",")
    return tables

exclude_tables = exclude_tables_from_config(config.get_section('alembic:exclude'))

def include_object(object, name, type_, reflected, compare_to):    
    if type_ == "table" and name in exclude_tables:
        return False
    else:
        return True


def run_migrations_offline():
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url)

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    env_type =  context.get_x_argument(as_dictionary=True).get('env_type')
    
    if env_type == 'local':
      app = create_app(config=LocalConfig)
    elif env_type == 'staging':
      app = create_app(config=StagingConfig)
    elif env_type == 'prod':
      app = create_app(config=ProdConfig)
    else:
      raise Exception("environment type not specified!")
    
    
    alembic_config = config.get_section(config.config_ini_section)
    alembic_config['sqlalchemy.url'] = app.config['SQLALCHEMY_DATABASE_URI']

    engine = engine_from_config(
                alembic_config,
                prefix='sqlalchemy.',
                poolclass=pool.NullPool)

    connection = engine.connect()
    context.configure(
                connection=connection,
                target_metadata=db.metadata,
                include_object=include_object
                )

    try:
        with context.begin_transaction():
            context.run_migrations()
    finally:
        connection.close()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()


