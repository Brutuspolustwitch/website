-- Remove LIGA DOS SECA and LIGA DOS SEGAS pages from page_settings
DELETE FROM page_settings 
WHERE page_slug IN ('liga-dos-seca', 'liga-dos-segas')
   OR page_name IN ('Liga dos Seca', 'Liga dos Segas', 'LIGA DOS SECA', 'LIGA DOS SEGAS');
