"""create tables

Revision ID: b7d2c31e9a3b
Revises: 
Create Date: 2026-09-29 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7d2c31e9a3b'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('forecasts',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('region', sa.String(), nullable=False),
    sa.Column('ts', sa.DateTime(), nullable=False),
    sa.Column('lead_hours', sa.Integer(), nullable=False),
    sa.Column('parameter', sa.String(), nullable=False),
    sa.Column('source', sa.String(), nullable=False),
    sa.Column('value', sa.Float(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('region', 'ts', 'lead_hours', 'parameter', 'source', name='uix_forecast_region_ts_lead_param_src')
    )
    op.create_index(op.f('ix_forecasts_id'), 'forecasts', ['id'], unique=False)
    op.create_index(op.f('ix_forecasts_region'), 'forecasts', ['region'], unique=False)
    op.create_index(op.f('ix_forecasts_ts'), 'forecasts', ['ts'], unique=False)

    op.create_table('observations',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('region', sa.String(), nullable=False),
    sa.Column('ts', sa.DateTime(), nullable=False),
    sa.Column('parameter', sa.String(), nullable=False),
    sa.Column('value', sa.Float(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_observations_id'), 'observations', ['id'], unique=False)
    op.create_index(op.f('ix_observations_region'), 'observations', ['region'], unique=False)
    op.create_index(op.f('ix_observations_ts'), 'observations', ['ts'], unique=False)

    op.create_table('skill_scores',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('region', sa.String(), nullable=False),
    sa.Column('season', sa.String(), nullable=False),
    sa.Column('lead_hours', sa.Integer(), nullable=False),
    sa.Column('parameter', sa.String(), nullable=False),
    sa.Column('source', sa.String(), nullable=False),
    sa.Column('rmse', sa.Float(), nullable=True),
    sa.Column('mae', sa.Float(), nullable=True),
    sa.Column('brier', sa.Float(), nullable=True),
    sa.Column('computed_on', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_skill_scores_id'), 'skill_scores', ['id'], unique=False)
    op.create_index(op.f('ix_skill_scores_region'), 'skill_scores', ['region'], unique=False)

    op.create_table('weights',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('region', sa.String(), nullable=False),
    sa.Column('season', sa.String(), nullable=False),
    sa.Column('lead_hours', sa.Integer(), nullable=False),
    sa.Column('parameter', sa.String(), nullable=False),
    sa.Column('source', sa.String(), nullable=False),
    sa.Column('weight', sa.Float(), nullable=False),
    sa.Column('previous_weight', sa.Float(), nullable=True),
    sa.Column('reason', sa.String(), nullable=True),
    sa.Column('updated_on', sa.DateTime(), nullable=True),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_weights_id'), 'weights', ['id'], unique=False)
    op.create_index(op.f('ix_weights_region'), 'weights', ['region'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_weights_region'), table_name='weights')
    op.drop_index(op.f('ix_weights_id'), table_name='weights')
    op.drop_table('weights')
    op.drop_index(op.f('ix_skill_scores_region'), table_name='skill_scores')
    op.drop_index(op.f('ix_skill_scores_id'), table_name='skill_scores')
    op.drop_table('skill_scores')
    op.drop_index(op.f('ix_observations_ts'), table_name='observations')
    op.drop_index(op.f('ix_observations_region'), table_name='observations')
    op.drop_index(op.f('ix_observations_id'), table_name='observations')
    op.drop_table('observations')
    op.drop_index(op.f('ix_forecasts_ts'), table_name='forecasts')
    op.drop_index(op.f('ix_forecasts_region'), table_name='forecasts')
    op.drop_index(op.f('ix_forecasts_id'), table_name='forecasts')
    op.drop_table('forecasts')
