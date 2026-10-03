# Sample dataset — SYNTHETIC

**Sample data is synthetic and intended only for development/testing.**

`sample_cases.csv` is produced by `training/generate_sample_data.py`. It is **not** real Indian judicial data:
party names, case numbers (`SYN/...`), judges and descriptions are randomly generated, and the delay target
(`delayDays`) comes from a hand-written generative formula with random noise. Any accuracy measured on this data
only shows that the pipeline works; it says nothing about real courts.

Regenerate:

```bash
python -m training.generate_sample_data --rows 3000 --seed 42
```

## Replacing it with a real dataset

Use a legally obtained dataset with the same columns (extra columns are ignored), then retrain:

| column | type | required |
|---|---|---|
| caseNumber, title | string | recommended |
| court, state, caseType, currentStage, status, priority | category | yes |
| district, petitioner, respondent, judge | string | no |
| filingDate | ISO date | yes |
| lastHearingDate, nextHearingDate | ISO date | no |
| numberOfHearings, numberOfAdjournments | int | yes |
| legalSections | `;`-separated string | no |
| description | text | no (used for similarity) |
| referenceDate | ISO date (snapshot date used to compute age/gaps) | no (defaults to today) |
| riskLevel | LOW / MEDIUM / HIGH | yes (classification target) |
| delayDays | number | no (enables the delay regressor) |

```bash
python -m training.train --data data/raw/your_dataset.csv
```
