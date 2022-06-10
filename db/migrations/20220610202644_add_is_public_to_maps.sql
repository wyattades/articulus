-- migrate:up

alter table maps add column is_public boolean default false;

-- migrate:down

alter table maps drop column is_public;
