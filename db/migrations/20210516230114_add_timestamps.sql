-- migrate:up

CREATE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

alter table users add column created_at timestamp default now();
alter table users add column updated_at timestamp default now();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

alter table maps add column created_at timestamp default now();
alter table maps add column updated_at timestamp default now();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON maps FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

alter table builds add column created_at timestamp default now();
alter table builds add column updated_at timestamp default now();
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON builds FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- migrate:down
DROP FUNCTION set_updated_at;

alter table users drop column created_at;
alter table users drop column updated_at;
drop trigger handle_updated_at on users;

alter table maps drop column created_at;
alter table maps drop column updated_at;
drop trigger handle_updated_at on maps;

alter table builds drop column created_at;
alter table builds drop column updated_at;
drop trigger handle_updated_at on builds;
