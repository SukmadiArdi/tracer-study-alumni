-- Fungsi untuk mengambil daftar tahun unik dari tabel alumni
CREATE OR REPLACE FUNCTION get_unique_years()
RETURNS TABLE(year INTEGER) 
LANGUAGE sql STABLE
AS $$
  SELECT DISTINCT year FROM alumni WHERE year IS NOT NULL ORDER BY year DESC;
$$;

-- Fungsi untuk mengambil daftar program studi unik dari tabel alumni
CREATE OR REPLACE FUNCTION get_unique_programs()
RETURNS TABLE(program TEXT) 
LANGUAGE sql STABLE
AS $$
  SELECT DISTINCT program FROM alumni WHERE program IS NOT NULL ORDER BY program ASC;
$$;

-- Fungsi untuk mengambil daftar fakultas unik dari tabel alumni
CREATE OR REPLACE FUNCTION get_unique_fakultas()
RETURNS TABLE(fakultas TEXT) 
LANGUAGE sql STABLE
AS $$
  SELECT DISTINCT fakultas FROM alumni WHERE fakultas IS NOT NULL ORDER BY fakultas ASC;
$$;
