-- migrate:up
create table users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique
);

create table maps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  data jsonb not null,
  name text
);

create table builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  data jsonb not null,
  name text
);

-- migrate:down
drop table maps;

drop table builds;