alter table reviews
  add column reply text null,
  add column replied_at timestamptz null;
