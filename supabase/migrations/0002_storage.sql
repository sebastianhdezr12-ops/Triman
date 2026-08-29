-- Storage bucket for chat photo uploads (injuries, meals, device screenshots).
-- Private bucket: files are only reachable through signed URLs generated
-- server-side for the owning user.
insert into storage.buckets (id, name, public)
values ('chat-photos', 'chat-photos', false)
on conflict (id) do nothing;

-- Users may only read/write objects inside a folder named after their own
-- user id, i.e. paths shaped "<user_id>/<conversation_id>/<filename>".
create policy "chat_photos_select_own" on storage.objects
  for select using (
    bucket_id = 'chat-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "chat_photos_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'chat-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "chat_photos_delete_own" on storage.objects
  for delete using (
    bucket_id = 'chat-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
