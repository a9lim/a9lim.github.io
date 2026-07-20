CREATE TABLE IF NOT EXISTS survey_contributions (
  submission_id TEXT PRIMARY KEY,
  schema_version INTEGER NOT NULL CHECK (schema_version = 1),
  submitted_month TEXT NOT NULL CHECK (length(submitted_month) = 7),
  demographics_json TEXT NOT NULL,
  battery_json TEXT NOT NULL,
  responses_json TEXT NOT NULL,
  quality_flags_json TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  data_license TEXT NOT NULL CHECK (data_license = 'CC0-1.0')
);

CREATE INDEX IF NOT EXISTS survey_contributions_month
  ON survey_contributions (submitted_month);
