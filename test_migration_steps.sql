-- Step 1: Check if enum already exists
SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'MappingVerificationStatus') as enum_exists;

-- Step 2: Try to create the enum (this is likely where it fails)
CREATE TYPE "MappingVerificationStatus" AS ENUM ('PENDING_REVIEW', 'VERIFIED', 'REJECTED');
