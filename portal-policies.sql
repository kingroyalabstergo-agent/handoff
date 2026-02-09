-- Allow anonymous users to read portal tokens (to validate them)
CREATE POLICY "Anyone can validate portal tokens" ON portal_tokens
  FOR SELECT TO anon
  USING (true);

-- Allow anonymous to read projects linked to a valid portal token
CREATE POLICY "Portal clients can view projects" ON projects
  FOR SELECT TO anon
  USING (
    client_id IN (
      SELECT client_id FROM portal_tokens WHERE expires_at IS NULL OR expires_at > NOW()
    )
  );

-- Allow anonymous to read clients linked to portal tokens
CREATE POLICY "Portal clients can view own client record" ON clients
  FOR SELECT TO anon
  USING (
    id IN (
      SELECT client_id FROM portal_tokens WHERE expires_at IS NULL OR expires_at > NOW()
    )
  );

-- Allow anonymous to read messages on portal-accessible projects
CREATE POLICY "Portal clients can view messages" ON messages
  FOR SELECT TO anon
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN portal_tokens pt ON pt.client_id = p.client_id
      WHERE pt.expires_at IS NULL OR pt.expires_at > NOW()
    )
  );

-- Allow anonymous to INSERT messages on portal-accessible projects
CREATE POLICY "Portal clients can send messages" ON messages
  FOR INSERT TO anon
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN portal_tokens pt ON pt.client_id = p.client_id
      WHERE pt.expires_at IS NULL OR pt.expires_at > NOW()
    )
  );

-- Allow anonymous to read files on portal-accessible projects
CREATE POLICY "Portal clients can view files" ON files
  FOR SELECT TO anon
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN portal_tokens pt ON pt.client_id = p.client_id
      WHERE pt.expires_at IS NULL OR pt.expires_at > NOW()
    )
  );

-- Allow anonymous to read invoices on portal-accessible projects
CREATE POLICY "Portal clients can view invoices" ON invoices
  FOR SELECT TO anon
  USING (
    project_id IN (
      SELECT p.id FROM projects p
      JOIN portal_tokens pt ON pt.client_id = p.client_id
      WHERE pt.expires_at IS NULL OR pt.expires_at > NOW()
    )
  );

-- Allow anonymous to read profiles (for branding)
CREATE POLICY "Portal clients can view org branding" ON profiles
  FOR SELECT TO anon
  USING (
    id IN (
      SELECT user_id FROM portal_tokens WHERE expires_at IS NULL OR expires_at > NOW()
    )
  );

-- Storage: allow anon to read project files (for portal downloads)
CREATE POLICY "Portal clients can download files" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'project-files');
