#!/bin/bash

extras=(
  "testing:requirements-test.txt"
  "devtool:requirements-devtool.txt"
  "postgresql:requirements-db-postgres.txt"
  "s3:requirements-storage-s3.txt"
)

for entry in "${extras[@]}"; do
  extra=$(echo "$entry" | cut -d':' -f1)
  output_file=$(echo "$entry" | cut -d':' -f2)
  echo "Generating ${output_file} for extra <$extra>"
  pip-compile $1 --output-file "${output_file}" --extra="${extra}"
  echo "Generated ${output_file} for extra <$extra>"
done

pip-compile $1
echo "Generated ${output_file}"
