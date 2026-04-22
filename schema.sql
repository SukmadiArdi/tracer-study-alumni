-- Buat tabel alumni
CREATE TABLE alumni (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  nim TEXT NOT NULL,
  program TEXT NOT NULL,
  year INTEGER NOT NULL,
  status TEXT DEFAULT 'Pending',
  confidence INTEGER DEFAULT 0,
  enrichment JSONB DEFAULT '{}'::jsonb,
  "enrichmentScore" INTEGER DEFAULT 0,
  "enrichmentUpdatedAt" TEXT,
  "tanggalLulus" TEXT,
  fakultas TEXT
);

-- Atur kebijakan Row Level Security (RLS) jika dibutuhkan.
-- Untuk awal dan memudahkan koneksi, kita bisa menonaktifkan RLS dulu,
-- atau mengizinkan akses anonim (tergantung kebutuhan keamanan Anda).

-- Mengizinkan anon/admin (yang login lewat Supabase js) untuk membaca dan menulis
ALTER TABLE alumni ENABLE ROW LEVEL SECURITY;

-- Buat policy sederhana agar auth user bisa read/write
CREATE POLICY "Allow public read"
  ON alumni FOR READ
  USING (true);

CREATE POLICY "Allow public insert"
  ON alumni FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update"
  ON alumni FOR UPDATE
  USING (true);
  
CREATE POLICY "Allow public delete"
  ON alumni FOR DELETE
  USING (true);
