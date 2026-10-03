# Database (MongoDB / Mongoose)

## users
| field | type | notes |
|---|---|---|
| name | String | required |
| email | String | unique, lowercase |
| password | String | bcrypt hash, `select:false` |
| role | admin \| analyst \| viewer | indexed, default analyst |
| lastLoginAt, createdAt, updatedAt | Date | |

## cases
| field | type | notes |
|---|---|---|
| caseNumber | String | **unique** |
| title, petitioner, respondent, judge | String | |
| court, caseType, currentStage, status, priority | enum | see `shared/schemas/case-enums.json` |
| state, district | String | |
| filingDate, lastHearingDate, nextHearingDate | Date | |
| numberOfHearings, numberOfAdjournments | Number ≥ 0 | |
| caseAgeDays | Number | computed on save; recomputed relative to *now* in API responses |
| description | String ≤ 5000 | used for similarity |
| legalSections | [String] | |
| historicalData | [{date, event, notes}] | optional hearing history |
| riskLevel, riskProbability, predictedDelayDays, lastPredictionId, lastPredictedAt | | denormalised latest prediction |
| isSample | Boolean | true for synthetic seeded records |
| createdBy | ObjectId → users | |

Indexes: `caseNumber` (unique), `court`, `state`, `caseType`, `status`, `priority`, `riskLevel`, `filingDate`,
`createdBy`, `createdAt`, `{caseType, riskLevel}`, `{court, state, status}`.

## predictions
`caseId`, `riskLevel`, `probability`, `classProbabilities`, `predictedDelayDays`, `modelVersion`, `modelType`,
`featureContributions[] {feature,label,value,impact,predictedClassImpact,direction}`,
`explanation {method,label,basis,summary[],disclaimer,narrative,narrativeSource}`, `inputFeatures`, `requestedBy`, `createdAt`.
Indexes: `caseId`, `riskLevel`, `{caseId, createdAt:-1}`. Every run is kept (history).

## similarcases
`caseId`, `similarCaseId` (null when the match is from the synthetic historical corpus), `referenceId`, `source`,
snapshot fields (`caseNumber`, `title`, `caseType`, `court`, `riskLevel`, …), `similarityScore`, `explanation`, `method`,
`predictionId`. Indexes: `caseId`, `{caseId, similarityScore:-1}`. Replaced on each retrieval.

## recommendations
`caseId`, `predictionId`, `priority (High|Medium|Low)`, `category`, `recommendation`, `reason`,
`source (rule-engine|gemini)`, `riskLevel`, `createdAt`. Indexes: `caseId`, `priority`, `createdAt`. Replaced per prediction.
