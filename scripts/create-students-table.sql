-- Create students table with JSONB columns for documents and other details
CREATE TABLE IF NOT EXISTS students (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  first_name VARCHAR(255) NOT NULL,
  middle_name VARCHAR(255),
  last_name VARCHAR(255) NOT NULL,
  contact_number VARCHAR(20) NOT NULL,
  family_number VARCHAR(20),
  date_of_birth DATE NOT NULL,
  roll_number VARCHAR(50) NOT NULL UNIQUE,
  gender VARCHAR(50) NOT NULL,
  documents_submitted JSONB NOT NULL,
  other_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on roll_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at DESC);
