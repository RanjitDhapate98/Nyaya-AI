"""
SYNTHETIC SAMPLE DATA GENERATOR
================================
Generates ml-service/data/sample/sample_cases.csv.

IMPORTANT: Sample data is synthetic and intended only for development/testing.
It is NOT real Indian judicial data. Party names, case numbers and descriptions
are randomly generated. Replace this file with a legally obtained dataset that
follows the same column schema (see docs/ml-pipeline.md) for real research.

Usage (from ml-service/):
    python -m training.generate_sample_data --rows 3000 --seed 42
"""
import argparse
import os
from datetime import date, timedelta

import numpy as np
import pandas as pd

COURTS = {
    "District Court": 1.0,
    "Sessions Court": 1.1,
    "High Court": 1.35,
    "Family Court": 0.8,
    "Consumer Forum": 0.7,
    "Magistrate Court": 0.9,
}
STATES = {
    "Maharashtra": ["Pune", "Mumbai", "Nagpur", "Nashik"],
    "Karnataka": ["Bengaluru", "Mysuru", "Hubballi"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Prayagraj", "Varanasi"],
    "Tamil Nadu": ["Chennai", "Madurai", "Coimbatore"],
    "Delhi": ["New Delhi", "South Delhi", "North Delhi"],
    "West Bengal": ["Kolkata", "Howrah", "Siliguri"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur"],
}
STATE_LOAD = {"Uttar Pradesh": 1.3, "West Bengal": 1.2, "Maharashtra": 1.1, "Rajasthan": 1.05,
              "Delhi": 1.0, "Tamil Nadu": 0.95, "Karnataka": 0.95, "Gujarat": 0.9}

CASE_TYPES = {
    "Civil": (260, ["Order 39 CPC", "Section 9 CPC", "Specific Relief Act S.38", "Order 7 Rule 11 CPC"],
              ["Dispute over possession of ancestral property", "Suit for permanent injunction over boundary wall",
               "Recovery of money under contract", "Partition suit among co-owners", "Breach of sale agreement for land"]),
    "Criminal": (300, ["IPC 302", "IPC 420", "IPC 498A", "IPC 307", "BNS 318", "CrPC 439"],
                 ["Allegation of cheating in investment scheme", "Assault case with injury report pending",
                  "Bail application in theft matter", "Domestic cruelty complaint", "Charge sheet filed for fraud"]),
    "Family": (180, ["Hindu Marriage Act S.13", "CrPC 125", "Guardians and Wards Act S.7", "Special Marriage Act S.27"],
               ["Petition for divorce on grounds of cruelty", "Maintenance claim for spouse and child",
                "Child custody dispute", "Restitution of conjugal rights petition"]),
    "Property": (330, ["Transfer of Property Act S.53A", "Registration Act S.17", "Land Acquisition Act S.18"],
                 ["Title dispute over agricultural land", "Challenge to land acquisition compensation",
                  "Eviction of tenant from commercial premises", "Encroachment on municipal land"]),
    "Commercial": (240, ["Commercial Courts Act S.12A", "Arbitration Act S.34", "Companies Act S.241"],
                   ["Challenge to arbitral award", "Recovery of dues under supply agreement",
                    "Oppression and mismanagement petition", "Trademark infringement claim"]),
    "Consumer": (120, ["Consumer Protection Act S.35", "Consumer Protection Act S.2(11)"],
                 ["Deficiency in service by builder", "Defective product complaint against manufacturer",
                  "Insurance claim repudiation dispute", "Medical negligence complaint"]),
    "Labour": (200, ["Industrial Disputes Act S.2A", "Payment of Wages Act S.15", "Industrial Disputes Act S.25F"],
               ["Wrongful termination of workman", "Non-payment of wages claim", "Retrenchment compensation dispute"]),
    "Cheque Bounce": (150, ["NI Act S.138", "NI Act S.142"],
                      ["Dishonour of cheque for insufficient funds", "Cheque returned with signature mismatch"]),
}
STAGES = {
    "Filing": 1.25, "Admission": 1.15, "Notice Issued": 1.1, "Pleadings": 1.0,
    "Evidence": 0.85, "Arguments": 0.55, "Judgment Reserved": 0.3,
}
STATUS = ["Pending", "Pending", "Pending", "Adjourned", "Stayed", "Disposed"]
PRIORITIES = {"Low": 1.1, "Normal": 1.0, "High": 0.85, "Urgent": 0.7}
FIRST = ["Aarav", "Meera", "Rohan", "Kavya", "Arjun", "Isha", "Vikram", "Ananya", "Sahil", "Priya", "Kabir", "Nisha"]
LAST = ["Sharma", "Patil", "Iyer", "Reddy", "Khan", "Das", "Mehta", "Gupta", "Nair", "Joshi", "Singh", "Rao"]
ORGS = ["Sample Infra Pvt Ltd", "Demo Finance Ltd", "Test Builders LLP", "State of {state}", "Synthetic Insurance Co"]


def risk_from_delay(days: float) -> str:
    if days < 420:
        return "LOW"
    if days < 680:
        return "MEDIUM"
    return "HIGH"


def generate(rows: int, seed: int) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    reference = date(2026, 6, 30)
    records = []
    ctype_names = list(CASE_TYPES.keys())
    for i in range(rows):
        ctype = rng.choice(ctype_names)
        base, sections_pool, desc_pool = CASE_TYPES[ctype]
        court = rng.choice(list(COURTS.keys()))
        state = rng.choice(list(STATES.keys()))
        district = rng.choice(STATES[state])
        stage = rng.choice(list(STAGES.keys()))
        status = rng.choice(STATUS)
        priority = rng.choice(list(PRIORITIES.keys()), p=[0.2, 0.5, 0.2, 0.1])

        age = int(rng.gamma(2.2, 330)) + 15
        filing = reference - timedelta(days=age)
        hearings = max(0, int(rng.poisson(max(1, age / 75))))
        adj_rate = rng.beta(2, 3.5)
        adjournments = int(round(hearings * adj_rate))
        last_gap = int(rng.exponential(55)) + 1
        last_gap = min(last_gap, age)
        next_gap = int(rng.exponential(45)) + 3
        last_hearing = reference - timedelta(days=last_gap) if hearings > 0 else None
        next_hearing = reference + timedelta(days=next_gap) if status != "Disposed" else None

        n_sections = int(rng.integers(1, min(3, len(sections_pool)) + 1))
        sections = list(rng.choice(sections_pool, size=n_sections, replace=False))
        desc = f"{rng.choice(desc_pool)}. Matter at {stage.lower()} stage before the {court.lower()}, {district}."
        if adjournments > 5:
            desc += " Repeated adjournments sought by parties."
        if rng.random() < 0.3:
            desc += " Documents and witness list awaited."

        # Latent delay (remaining days to disposal) - synthetic generative formula.
        delay = (
            base
            * COURTS[court]
            * STAGES[stage]
            * PRIORITIES[priority]
            * STATE_LOAD[state]
            + 22 * adjournments
            + 0.18 * age
            + 1.6 * last_gap
            + 0.8 * next_gap
            + 35 * (n_sections - 1)
            + (90 if status == "Stayed" else 0)
            - (120 if status == "Disposed" else 0)
        )
        delay = max(10, delay * rng.lognormal(0, 0.18) + rng.normal(0, 25))

        party1 = f"{rng.choice(FIRST)} {rng.choice(LAST)}"
        party2 = rng.choice([f"{rng.choice(FIRST)} {rng.choice(LAST)}", rng.choice(ORGS).format(state=state)])
        records.append({
            "caseNumber": f"SYN/{ctype[:3].upper()}/{filing.year}/{i + 1:05d}",
            "title": f"{party1} v. {party2}",
            "court": court,
            "state": state,
            "district": district,
            "caseType": ctype,
            "filingDate": filing.isoformat(),
            "currentStage": stage,
            "status": status,
            "priority": priority,
            "petitioner": party1,
            "respondent": party2,
            "judge": f"Hon. Judge {rng.choice(LAST)} (synthetic)",
            "numberOfHearings": hearings,
            "numberOfAdjournments": adjournments,
            "lastHearingDate": last_hearing.isoformat() if last_hearing else "",
            "nextHearingDate": next_hearing.isoformat() if next_hearing else "",
            "legalSections": "; ".join(sections),
            "description": desc,
            "referenceDate": reference.isoformat(),
            "delayDays": int(round(delay)),
            "riskLevel": risk_from_delay(delay),
        })
    df = pd.DataFrame(records)
    # Inject a small amount of missingness to exercise cleaning logic.
    for col in ["district", "legalSections", "description"]:
        mask = rng.random(len(df)) < 0.02
        df.loc[mask, col] = np.nan
    return df


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--rows", type=int, default=3000)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "..", "data", "sample", "sample_cases.csv"))
    args = parser.parse_args()
    df = generate(args.rows, args.seed)
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    df.to_csv(args.out, index=False)
    print(f"[SYNTHETIC] Wrote {len(df)} rows to {os.path.abspath(args.out)}")
    print(df["riskLevel"].value_counts().to_string())


if __name__ == "__main__":
    main()
