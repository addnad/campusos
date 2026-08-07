#!/usr/bin/env bash
# All seventeen CCMAS discipline documents. Each covers every Nigerian
# university running those programmes, so one download seeds many schools.
set -u
cd "$(dirname "$0")/../../../curricula" || exit 1

base="https://www.nuc.edu.ng/wp-content/uploads/2026/03"

declare -a docs=(
  "administration:Administration-and-Management.pdf"
  "allied-health:Allied-Health-Sciences-2023.pdf"
  "architecture:Architecture-CCMAS-2023-FINAL.pdf"
  "arts:Arts-CCMAS-2023-FINAL.pdf"
  "basic-medical:Basic-Medical-Sciences-CCMAS-FINAL-December-26-2022.pdf"
  "computing:Computing-CCMAS-2023-FINAL.pdf"
  "communication:Communication-and-Media-Studies-CCMAS-2023-FINAL.pdf"
  "education:Education-CCMAS-2023-New.pdf"
  "environmental:Environmental-Sciences-CCMAS-2023-FINAL.pdf"
  "law:Law-ALL.pdf"
  "medicine:Medicine-and-Dentistry-CCMAS-2023-FINAL.pdf"
  "pharmacy:Pharmacy-and-Pharmaceutical-Sciences-CCMAS-2023-FINAL.pdf"
  "sciences:Sciences-CCMAS-2023-FINAL.pdf"
  "social-sciences:Social-Sciences-CCMAS-FINAL-2023-A.pdf"
  "veterinary:Veterinary-Medicine-CCMAS-2023-FINAL.pdf"
  "engineering:Engineering-Technology-CCMAS-2023-FINAL.pdf"
  "agriculture:Agriculture-2023.pdf"
)

for entry in "${docs[@]}"; do
  name="${entry%%:*}"
  file="${entry#*:}"
  if [ -f "$name.pdf" ]; then
    echo "have  $name"
    continue
  fi
  echo "get   $name"
  curl -sfL -o "$name.pdf" "$base/$file" || echo "FAILED $name"
done

ls -lh *.pdf
