#!/usr/bin/env python3
"""Build the committed survey data artifacts from the verified source files.

The raw research files are intentionally not committed. See README.md for the
source URLs and expected filenames. This script is deterministic for a fixed
source directory and writes only the deployable JSON and rotation images.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import shutil
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np
import pandas as pd
from lxml import html


QUANTILES = [1, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 99]
AGE_BANDS = ((10, 20, "10-20"), (21, 40, "21-40"), (41, 60, "41-60"), (61, 95, "61-95"))
GENDERS = {1: "male", 2: "female"}


def clean_text(value: object) -> str:
    text = str(value).strip()
    replacements = {
        "\u2018": "'", "\u2019": "'", "\u201c": '"', "\u201d": '"',
        "\u2013": "-", "\u2014": "-", "\u00a0": " ",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return re.sub(r"\s+", " ", text)


def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def stable_item_id(text: str, prefix: str = "ipip") -> str:
    canonical = re.sub(r"[^a-z0-9]+", " ", clean_text(text).lower()).strip()
    return f"{prefix}-{hashlib.sha1(canonical.encode()).hexdigest()[:12]}"


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")


class ItemRegistry:
    def __init__(self) -> None:
        self.items: dict[str, dict] = {}

    def add(self, text: str, source: str) -> str:
        text = clean_text(text)
        item_id = stable_item_id(text)
        current = self.items.setdefault(item_id, {"id": item_id, "text": text, "sources": []})
        if source not in current["sources"]:
            current["sources"].append(source)
        return item_id

    def payload(self) -> dict:
        return {
            "schema_version": 1,
            "response_format": "accuracy-5",
            "choices": [
                {"value": 1, "label": "Very inaccurate"},
                {"value": 2, "label": "Moderately inaccurate"},
                {"value": 3, "label": "Neither accurate nor inaccurate"},
                {"value": 4, "label": "Moderately accurate"},
                {"value": 5, "label": "Very accurate"},
            ],
            "license": {"name": "Public domain", "url": "https://ipip.ori.org/newPermission.htm"},
            "items": sorted(self.items.values(), key=lambda item: item["id"]),
        }


def parse_html(path: Path, encoding: str = "windows-1252"):
    return html.parse(str(path), html.HTMLParser(encoding=encoding)).getroot()


def table_rows(root, table_index: int | None = None) -> list[list[str]]:
    selector = "//table" if table_index is None else f"//table[{table_index + 1}]"
    tables = root.xpath(selector)
    nodes = tables if table_index is None else tables[:1]
    rows: list[list[str]] = []
    for table in nodes:
        for tr in table.xpath(".//tr"):
            cells = [clean_text(cell.text_content()) for cell in tr.xpath("./th|./td")]
            if cells:
                rows.append(cells)
    return rows


def parse_neo_alphas(path: Path) -> tuple[dict[str, dict], dict[str, dict]]:
    root = parse_html(path, "iso-8859-1")
    facet_rows: dict[str, dict] = {}
    domain_rows: dict[str, dict] = {}
    domain_key = None
    domain_by_name = {
        "Neuroticism": "N", "Extraversion": "E", "Openness To Experience": "O",
        "Agreeableness": "A", "Conscientiousness": "C",
    }
    for cells in table_rows(root, 0):
        if not cells or len(cells) < 11:
            continue
        if cells[0] in domain_by_name:
            domain_key = domain_by_name[cells[0]]
            domain_rows[domain_key] = {
                "id": domain_key, "name": cells[0],
                "alpha_300": float(cells[9]),
            }
            continue
        match = re.search(r"\(([NEOAC]\d)\)", cells[1] if len(cells) > 1 else "")
        if match and domain_key:
            key = match.group(1)
            facet_rows[key] = {
                "id": key, "name": cells[0], "domain": domain_key,
                "alpha_300": float(cells[9]),
            }
    if len(facet_rows) != 30:
        raise RuntimeError(f"Expected 30 NEO facet rows, found {len(facet_rows)}")
    return facet_rows, domain_rows


def make_key_payload(key_id: str, name: str, citation: str, priority_method: str,
                     items: list[dict], scales: list[dict], domains: list[dict],
                     warnings: list[str] | None = None) -> dict:
    return {
        "schema_version": 1,
        "id": key_id,
        "name": name,
        "citation": citation,
        "license": {"name": "Public domain", "url": "https://ipip.ori.org/newPermission.htm"},
        "priority_method": priority_method,
        "warnings": warnings or [],
        "domains": domains,
        "scales": scales,
        "items": items,
    }


def build_neo(source: Path, registry: ItemRegistry, facet_meta: dict[str, dict],
              domain_meta: dict[str, dict]) -> tuple[dict, pd.DataFrame]:
    neo300_df = pd.read_excel(source / "neo300.xlsx", sheet_name="Input")
    neo300_df = neo300_df[neo300_df["Key"].astype(str).str.match(r"^[NEOAC]\d$")].copy()
    neo300_df["source_index"] = neo300_df["Full#"].astype(int)
    neo300_df["direction"] = neo300_df["Sign"].astype(str).str.startswith("+").map({True: 1, False: -1})
    neo300_df["item_id"] = [registry.add(text, "IPIP-NEO-300") for text in neo300_df["Item"]]
    scale_items = Counter(neo300_df["Key"])
    scales = []
    for key, meta in facet_meta.items():
        scales.append({
            "id": key, "name": meta["name"], "domain": meta["domain"],
            "alpha": meta["alpha_300"], "full_item_count": scale_items[key],
        })
    domains = []
    for key, meta in domain_meta.items():
        domains.append({
            "id": key, "name": meta["name"], "facets": [f["id"] for f in scales if f["domain"] == key],
            "alpha": meta["alpha_300"],
            "full_item_count": int(sum(f["full_item_count"] for f in scales if f["domain"] == key)),
        })
    items = [{
        "item_id": row.item_id, "scale": row.Key, "direction": int(row.direction),
        "source_index": int(row.source_index),
    } for row in neo300_df.itertuples()]
    return make_key_payload(
        "neo300", "IPIP-NEO-300",
        "Goldberg (1999). A broad-bandwidth, public-domain personality inventory measuring lower-level facets of five-factor models.",
        "Within-scale item-rest correlations from Johnson's OSF response data.",
        items, scales, domains,
    ), neo300_df


def alpha_from_label(text: str) -> float:
    match = re.search(r"Alpha\s*=\s*\.?([0-9]+)", text, re.I)
    if not match:
        raise ValueError(f"No alpha in {text!r}")
    value = match.group(1)
    return float(f"0.{value}") if len(value) <= 2 else float(value)


def balanced_ranks(entries: list[dict]) -> None:
    by_scale: dict[str, list[dict]] = defaultdict(list)
    for entry in entries:
        by_scale[entry["scale"]].append(entry)
    for scale_entries in by_scale.values():
        positive = [entry for entry in scale_entries if entry["direction"] == 1]
        negative = [entry for entry in scale_entries if entry["direction"] == -1]
        ordered = []
        while positive or negative:
            if positive:
                ordered.append(positive.pop(0))
            if negative:
                ordered.append(negative.pop(0))
        for rank, entry in enumerate(ordered, 1):
            entry["priority_rank"] = rank


def build_bfas(source: Path, registry: ItemRegistry) -> dict:
    root = parse_html(source / "BFASKeys.raw")
    rows = []
    for tr in root.xpath("//tr"):
        cells = [clean_text(cell.text_content()) for cell in tr.xpath("./th|./td")]
        if cells and any(cells):
            rows.append(cells)

    domain_names = {"Neuroticism", "Agreeableness", "Conscientiousness", "Extraversion", "Openness/Intellect"}
    current_domain = None
    current_scale = None
    current_direction = None
    scale_meta: dict[str, dict] = {}
    entries: list[dict] = []
    pending_scale = None
    swaps = {
        "Am not a very enthusiastic person.c": "Am not easily amused.",
        "Do not have an assertive personality.d": "Don't like to draw attention to myself.",
    }
    for cells in rows:
        first = cells[0] if cells else ""
        second = cells[1] if len(cells) > 1 else ""
        if first in domain_names:
            current_domain = slug(first.replace("/", "-"))
            continue
        if first and first not in {"+ keyed", "- keyed", "– keyed"} and second == "" and first not in {"The Items in the Big Five Aspects Scales"}:
            pending_scale = first
            continue
        if pending_scale and "10-item scale" in second:
            current_scale = slug(pending_scale)
            scale_meta[current_scale] = {
                "id": current_scale, "name": pending_scale, "domain": current_domain,
                "alpha": alpha_from_label(second), "full_item_count": 10,
            }
            pending_scale = None
            continue
        if first in {"+ keyed", "- keyed", "– keyed"}:
            current_direction = 1 if first.startswith("+") else -1
        if current_scale and second and current_direction and "scale" not in second.lower():
            original = second
            text = swaps.get(original, original)
            item_id = registry.add(text, "BFAS")
            entry = {"item_id": item_id, "scale": current_scale, "direction": current_direction}
            if original in swaps:
                entry["replacement_for"] = original[:-2]
            entries.append(entry)

    # The nested note table can look like a row; retain exactly 10 items per aspect.
    valid_scales = set(scale_meta)
    entries = [entry for entry in entries if entry["scale"] in valid_scales]
    counts = Counter(entry["scale"] for entry in entries)
    if len(scale_meta) != 10 or any(counts[key] != 10 for key in scale_meta):
        raise RuntimeError(f"Invalid BFAS parse: {len(scale_meta)} scales, counts={counts}")
    balanced_ranks(entries)
    domain_display = {
        "neuroticism": "Neuroticism", "agreeableness": "Agreeableness",
        "conscientiousness": "Conscientiousness", "extraversion": "Extraversion",
        "openness-intellect": "Openness / Intellect",
    }
    domains = []
    for domain_id, name in domain_display.items():
        facets = [scale["id"] for scale in scale_meta.values() if scale["domain"] == domain_id]
        domains.append({"id": domain_id, "name": name, "facets": facets, "full_item_count": 20})
    return make_key_payload(
        "bfas", "Big Five Aspect Scales", "DeYoung, Quilty, & Peterson (2007). Between facets and domains.",
        "Sign-balanced source order; no public item-level calibration sample was used.",
        entries, list(scale_meta.values()), domains,
        ["Two non-IPIP items were replaced with public-domain IPIP equivalents; see data manifest."],
    )


def build_hexaco(source: Path, registry: ItemRegistry) -> dict:
    root = parse_html(source / "newHEXACO_PI_key.raw", "us-ascii")
    domain_map = {
        "H": "Honesty-Humility", "E": "Emotionality", "X": "Extraversion",
        "A": "Agreeableness", "C": "Conscientiousness", "O": "Openness to Experience",
    }
    entries: list[dict] = []
    scales: list[dict] = []
    for table in root.xpath("//table")[:24]:
        rows = []
        for tr in table.xpath(".//tr"):
            cells = [clean_text(cell.text_content()) for cell in tr.xpath("./th|./td")]
            if cells and any(cells):
                rows.append(cells)
        heading = next((" ".join(row) for row in rows if re.search(r"\([HEXACO]:[A-Za-z]+\)", " ".join(row))), "")
        match = re.search(r"(.+?)\s*\(([HEXACO]):([A-Za-z]+)\)\s*\[Alpha\s*=\s*(\.[0-9]+)\]", heading)
        if not match:
            raise RuntimeError(f"Could not parse HEXACO heading: {heading}")
        name, domain, short, alpha = match.groups()
        scale_id = f"{domain.lower()}-{short.lower()}"
        scales.append({"id": scale_id, "name": clean_text(name), "domain": domain, "alpha": float(alpha), "full_item_count": 10})
        direction = None
        heading_index = next(index for index, row in enumerate(rows) if heading == " ".join(row))
        for cells in rows[heading_index + 1:]:
            first = cells[0] if cells else ""
            second = cells[1] if len(cells) > 1 else ""
            if first.startswith("+"):
                direction = 1
            elif first.startswith("-") or first.startswith("–"):
                direction = -1
            if second and direction:
                entries.append({"item_id": registry.add(second, "IPIP-HEXACO"), "scale": scale_id, "direction": direction})
    counts = Counter(entry["scale"] for entry in entries)
    if len(scales) != 24 or any(counts[scale["id"]] != 10 for scale in scales):
        raise RuntimeError(f"Invalid HEXACO parse: {len(scales)} scales, counts={counts}")
    balanced_ranks(entries)
    domains = [{
        "id": key, "name": name, "facets": [scale["id"] for scale in scales if scale["domain"] == key],
        "full_item_count": 40,
    } for key, name in domain_map.items()]
    return make_key_payload(
        "hexaco", "IPIP-HEXACO", "Ashton, Lee, & Goldberg (2007). The IPIP-HEXACO scales.",
        "Sign-balanced source order; no public item-level calibration sample was used.",
        entries, scales, domains,
    )


def load_fixed_width(path: Path, record_length: int, item_offset: int, item_count: int,
                     country_start: int, country_end: int) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    size = path.stat().st_size
    remainder = size % record_length
    if remainder not in {0, record_length - 2}:
        raise RuntimeError(f"Unexpected record length for {path}")
    rows = size // record_length
    mapped = np.memmap(path, dtype=np.uint8, mode="r", shape=(rows, record_length))
    raw = np.asarray(mapped)
    if remainder:
        with path.open("rb") as handle:
            handle.seek(rows * record_length)
            tail = handle.read() + b"\r\n"
        raw = np.concatenate([raw, np.frombuffer(tail, dtype=np.uint8).reshape(1, record_length)], axis=0)
    items = np.asarray(raw[:, item_offset:item_offset + item_count], dtype=np.int16) - 48
    sex = np.asarray(raw[:, 6], dtype=np.int16) - 48
    age = (np.asarray(raw[:, 7], dtype=np.int16) - 48) * 10 + (np.asarray(raw[:, 8], dtype=np.int16) - 48)
    countries_raw = np.ascontiguousarray(raw[:, country_start:country_end]).view(f"S{country_end - country_start}").reshape(-1)
    countries = np.array([clean_text(value.decode("latin-1", "ignore")) for value in countries_raw], dtype=object)
    return items, sex, age, countries


def add_priorities(key: dict, frame: pd.DataFrame, item_values: np.ndarray) -> dict[str, list[str]]:
    priority: dict[str, list[str]] = {}
    by_scale = defaultdict(list)
    for entry in key["items"]:
        by_scale[entry["scale"]].append(entry)
    source_index_by_id = dict(zip(frame["item_id"], frame["source_index"]))
    for scale, entries in by_scale.items():
        cols = [source_index_by_id[entry["item_id"]] - 1 for entry in entries]
        values = item_values[:, cols]
        valid = np.all((values >= 1) & (values <= 5), axis=1)
        values = values[valid].astype(np.float64)
        total = values.sum(axis=1)
        ranked = []
        for index, entry in enumerate(entries):
            x = values[:, index]
            rest = total - x
            corr = float(np.corrcoef(x, rest)[0, 1]) if x.std() and rest.std() else 0.0
            entry["item_rest_r"] = round(corr, 4)
            ranked.append((corr, entry["item_id"]))
        ranked.sort(reverse=True)
        order = [item_id for _, item_id in ranked]
        priority[scale] = order
        ranks = {item_id: rank for rank, item_id in enumerate(order, 1)}
        for entry in entries:
            entry["priority_rank"] = ranks[entry["item_id"]]
    return priority


def norm_cells(key: dict, frame: pd.DataFrame, item_values: np.ndarray, sex: np.ndarray,
               age: np.ndarray, country: np.ndarray) -> list[dict]:
    index_by_id = dict(zip(frame["item_id"], frame["source_index"]))
    scale_cols = {
        scale["id"]: [index_by_id[entry["item_id"]] - 1 for entry in key["items"] if entry["scale"] == scale["id"]]
        for scale in key["scales"]
    }
    scale_scores: dict[str, np.ndarray] = {}
    for scale, cols in scale_cols.items():
        values = item_values[:, cols]
        valid = np.all((values >= 1) & (values <= 5), axis=1)
        scores = np.zeros(len(values), dtype=np.int16)
        scores[valid] = values[valid].sum(axis=1)
        scale_scores[scale] = scores

    country_counts = Counter(value for value in country if value)
    supported_countries = sorted(value for value, count in country_counts.items() if count >= 1000)
    specs: list[tuple[dict, np.ndarray]] = [({}, np.ones(len(sex), dtype=bool))]
    for low, high, label in AGE_BANDS:
        specs.append(({"age": label}, (age >= low) & (age <= high)))
    for code, label in GENDERS.items():
        specs.append(({"gender": label}, sex == code))
    for value in supported_countries:
        specs.append(({"country": value}, country == value))
    for low, high, age_label in AGE_BANDS:
        for code, gender_label in GENDERS.items():
            specs.append(({"age": age_label, "gender": gender_label}, (age >= low) & (age <= high) & (sex == code)))
    for value in supported_countries:
        country_mask = country == value
        for low, high, age_label in AGE_BANDS:
            specs.append(({"country": value, "age": age_label}, country_mask & (age >= low) & (age <= high)))
        for code, gender_label in GENDERS.items():
            specs.append(({"country": value, "gender": gender_label}, country_mask & (sex == code)))
        for low, high, age_label in AGE_BANDS:
            for code, gender_label in GENDERS.items():
                specs.append((
                    {"country": value, "age": age_label, "gender": gender_label},
                    country_mask & (age >= low) & (age <= high) & (sex == code),
                ))

    cells = []
    seen = set()
    for dimensions, mask in specs:
        key_tuple = tuple(sorted(dimensions.items()))
        if key_tuple in seen:
            continue
        seen.add(key_tuple)
        valid_any = mask & (next(iter(scale_scores.values())) > 0)
        n = int(valid_any.sum())
        if n < 1000:
            continue
        stats = {}
        for scale, scores in scale_scores.items():
            values = scores[mask & (scores > 0)]
            stats[scale] = {
                "n": int(len(values)), "mean": round(float(values.mean()), 4), "sd": round(float(values.std(ddof=1)), 4),
                "q": [round(float(value), 3) for value in np.percentile(values, QUANTILES)],
            }
        cell_id = "overall" if not dimensions else "--".join(f"{key}-{slug(value)}" for key, value in sorted(dimensions.items()))
        cells.append({"id": cell_id, "dimensions": dimensions, "n": n, "scales": stats})
    return cells


def build_neo_calibration(source: Path, output: Path, neo300: dict, neo300_df: pd.DataFrame) -> None:
    items, sex, age, country = load_fixed_width(source / "IPIP300.dat", 335, 33, 300, 22, 33)
    priority = add_priorities(neo300, neo300_df, items)
    write_json(output / "priority" / "neo300.json", {
        "schema_version": 1, "key": neo300["id"], "method": neo300["priority_method"], "scales": priority,
    })
    cells = norm_cells(neo300, neo300_df, items, sex, age, country)
    write_json(output / "norms" / "ipip-neo" / "neo300.json", {
        "schema_version": 1, "key": neo300["id"], "quantiles": QUANTILES,
        "source": "Johnson's IPIP-NEO OSF response data", "minimum_cell_n": 1000,
        "cells": cells,
    })


PVQ_ITEMS = [
    (1, "self-direction", "Thinking up new ideas and being creative is important to them. They like to do things in their own original way."),
    (2, "power", "It is important to them to be rich. They want to have a lot of money and expensive things."),
    (3, "universalism", "They think it is important that every person in the world be treated equally. They want justice for everybody, even for people they don't know."),
    (4, "achievement", "It is very important to them to show their abilities. They want people to admire what they do."),
    (5, "security", "It is important to them to live in secure surroundings. They avoid anything that might endanger their safety."),
    (6, "stimulation", "They like surprises and are always looking for new things to do. They think it is important to do lots of different things in life."),
    (7, "conformity", "They believe that people should do what they're told. They think people should follow rules at all times, even when no one is watching."),
    (8, "universalism", "It is important to them to listen to people who are different from them. Even when they disagree, they still want to understand them."),
    (9, "tradition", "They think it's important not to ask for more than what they have. They believe people should be satisfied with what they have."),
    (10, "hedonism", "Having a good time is important to them. They like to spoil themselves."),
    (11, "self-direction", "It is important to them to make their own decisions about what they do. They like to be free to plan and choose their activities."),
    (12, "benevolence", "It is very important to them to help the people around them. They want to care for other people."),
    (13, "achievement", "Being very successful is important to them. They like to impress other people."),
    (14, "security", "It is very important to them that their country be safe from threats from within and without. They are concerned that social order be protected."),
    (15, "stimulation", "They look for adventures and like to take risks. They want to have an exciting life."),
    (16, "conformity", "It is important to them always to behave properly. They want to avoid doing anything people would say is wrong."),
    (17, "power", "It is important to them to be in charge and tell others what to do. They want people to do what they say."),
    (18, "benevolence", "It is important to them to be loyal to their friends. They want to devote themselves to people close to them."),
    (19, "universalism", "They strongly believe that people should care for nature. Looking after the environment is important to them."),
    (20, "tradition", "Religious belief is important to them. They try hard to do what their religion requires."),
    (21, "hedonism", "They seek every chance they can to have fun. It is important to them to do things that give them pleasure."),
]


def build_pvq(output: Path) -> None:
    write_json(output / "items" / "pvq21.json", {
        "schema_version": 1,
        "name": "ESS Human Values Scale (PVQ-21)",
        "prompt": "How much like you is this person?",
        "adaptation": "The ESS male/female portraits were adapted to singular they; meaning and item order are preserved.",
        "license": {"name": "CC BY-SA 4.0", "url": "https://creativecommons.org/licenses/by-sa/4.0/"},
        "source": "https://www.europeansocialsurvey.org/sites/default/files/2023-06/ESS_core_questionnaire_human_values.pdf",
        "choices": [
            {"value": 6, "label": "Very much like me"}, {"value": 5, "label": "Like me"},
            {"value": 4, "label": "Somewhat like me"}, {"value": 3, "label": "A little like me"},
            {"value": 2, "label": "Not like me"}, {"value": 1, "label": "Not like me at all"},
        ],
        "items": [{"id": f"pvq-{number:02d}", "order": number, "scale": scale, "text": text} for number, scale, text in PVQ_ITEMS],
    })


def item_information(a: float, b: float, theta: float) -> float:
    p = 1 / (1 + math.exp(-a * (theta - b)))
    return a * a * p * (1 - p)


def information_priority(items: list[dict]) -> list[str]:
    targets = [-2, -1, 0, 1, 2]
    totals = [0.0] * len(targets)
    remaining = list(items)
    ordered = []
    while remaining:
        best = max(remaining, key=lambda item: min(
            totals[i] + item_information(item["a"], item["b"], theta)
            for i, theta in enumerate(targets)
        ))
        ordered.append(best["id"])
        for i, theta in enumerate(targets):
            totals[i] += item_information(best["a"], best["b"], theta)
        remaining.remove(best)
    return ordered


def build_omib(source: Path, output: Path) -> None:
    frame = pd.read_excel(source / "omib-item-data.xlsx", sheet_name="Item Data")
    items = []
    for _, row in frame.iterrows():
        try:
            a, b = float(row["a"]), float(row["b"])
        except (TypeError, ValueError):
            continue
        code = clean_text(row["Complete Item Code"])
        solution = f"{int(row['Item Solution']):020d}"
        items.append({
            "id": f"omib-{int(row['Item']):03d}", "source_item": int(row["Item"]), "set": int(row["Set"]),
            "a": round(a, 4), "b": round(b, 4), "solution": solution, "code": code,
            "rules": int(row["Rules"]),
        })
    order = information_priority(items)
    rank = {item_id: index + 1 for index, item_id in enumerate(order)}
    for item in items:
        item["priority_rank"] = rank[item["id"]]
    write_json(output / "irt" / "omib.json", {
        "schema_version": 1, "name": "Open Matrices Item Bank", "model": "2PL",
        "calibration_sample": "German medical-school applicants; N=2,561 after exclusions.",
        "license": {"name": "GPL-3.0", "url": "https://www.gnu.org/licenses/gpl-3.0.html", "grant_source": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9326670/"},
        "source": "https://osf.io/4km79/", "items": sorted(items, key=lambda item: item["source_item"]),
    })
    write_json(output / "priority" / "omib.json", {"schema_version": 1, "method": "Greedy maximin 2PL test information across theta = -2,-1,0,1,2.", "items": order})


def build_rotation(source: Path, output: Path, asset_output: Path) -> None:
    # Table 2 of Ganis & Kievit (2015) maps the bold validation objects to
    # the numbered JPG assets. The fifth number in the PsyScope condition
    # name distinguishes alternate objects with the same arm lengths.
    validation_assets = {
        "2_3_3_2_0": 1, "2_3_4_2_90": 8, "2_4_4_2_0": 19,
        "2_4_4_2_180": 21, "2_4_4_3_90": 23, "3_3_3_2_0": 25,
        "3_3_3_3_90": 29, "3_3_3_3_180": 30, "3_3_4_2_0": 31,
        "3_4_3_2_90": 39, "3_4_3_3_180": 43, "3_4_4_3_180": 48,
    }
    responses = []
    data_dir = source / "rotation-data" / "Behavioural_data"
    for path in sorted(data_dir.glob("sub*.xlsx"), key=lambda value: int(re.search(r"\d+", value.stem).group())):
        subject = int(re.search(r"\d+", path.stem).group())
        frame = pd.read_excel(path, sheet_name="S&M", header=None).iloc[4:100, :7]
        frame.columns = ["trial", "condition", "time", "correct_key", "response", "angle", "correct"]
        for row in frame.itertuples(index=False):
            if not isinstance(row.condition, str):
                continue
            responses.append({"subject": subject, "condition": row.condition, "correct": int(row.correct or 0)})
    frame = pd.DataFrame(responses)
    matrix = frame.pivot_table(index="subject", columns="condition", values="correct", aggfunc="first")
    total = matrix.sum(axis=1, skipna=True)
    candidates = []
    for condition in matrix.columns:
        values = matrix[condition]
        valid = values.notna()
        n = int(valid.sum())
        p = float(values[valid].mean())
        rest = total[valid] - values[valid]
        r = float(np.corrcoef(values[valid], rest)[0, 1]) if values[valid].std() and rest.std() else 0.0
        a = min(2.5, max(0.5, 0.8 + 2.4 * max(0.0, r)))
        b = math.log((1 - min(0.98, max(0.02, p))) / min(0.98, max(0.02, p))) / a
        stem = condition.rsplit(".", 1)[0]
        different = stem.startswith("R")
        match = re.match(r"R?(.+)Y(0|50|100|150)$", stem)
        if not match:
            continue
        base, angle_text = match.groups()
        shape = validation_assets.get(base)
        if not shape:
            continue
        angle = int(angle_text)
        candidates.append({
            "id": f"rotation-{slug(stem)}", "condition": condition, "shape": shape, "angle": angle,
            "correct": "different" if different else "same", "a": round(a, 4), "b": round(b, 4),
            "validation_p": round(p, 4), "validation_n": n,
        })
    bank = candidates
    order = information_priority(bank)
    ranks = {item_id: index + 1 for index, item_id in enumerate(order)}
    source_assets = source / "rotation-images" / "All stimuli as jpg "
    asset_output.mkdir(parents=True, exist_ok=True)
    for item in bank:
        suffix = "_R" if item["correct"] == "different" else ""
        left_name = f"{item['shape']}_0.jpg"
        right_name = f"{item['shape']}_{item['angle']}{suffix}.jpg"
        for name in {left_name, right_name}:
            shutil.copy2(source_assets / name, asset_output / name)
        item["left"] = f"/surveys/assets/rotation/{left_name}"
        item["right"] = f"/surveys/assets/rotation/{right_name}"
        item["priority_rank"] = ranks[item["id"]]
    write_json(output / "irt" / "rotation.json", {
        "schema_version": 1, "name": "Ganis-Kievit Mental Rotation", "model": "2PL approximation",
        "calibration_sample": "Published validation sample; N=54. Difficulty is empirical; discrimination is a bounded point-biserial approximation.",
        "license": {"name": "CC BY 4.0", "url": "https://creativecommons.org/licenses/by/4.0/"},
        "source": "https://doi.org/10.6084/m9.figshare.1045385", "items": bank,
    })
    write_json(output / "priority" / "rotation.json", {"schema_version": 1, "method": "Greedy maximin information over the validation-derived 2PL approximation.", "items": order})


def source_hashes(source: Path) -> dict[str, str]:
    names = [
        "BFASKeys.raw", "newHEXACO_PI_key.raw", "IPIP300-120ComparisonTable.raw",
        "neo300.xlsx", "omib-item-data.xlsx", "IPIP300.dat",
    ]
    result = {}
    for name in names:
        path = source / name
        digest = hashlib.sha256()
        with path.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(chunk)
        result[name] = digest.hexdigest()
    return result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, default=Path(__file__).parents[1] / "data")
    parser.add_argument("--asset-dir", type=Path, default=Path(__file__).parents[1] / "assets" / "rotation")
    args = parser.parse_args()
    source = args.source_dir.resolve()
    output = args.output_dir.resolve()

    registry = ItemRegistry()
    facets, domains = parse_neo_alphas(source / "IPIP300-120ComparisonTable.raw")
    neo300, neo300_df = build_neo(source, registry, facets, domains)
    bfas = build_bfas(source, registry)
    hexaco = build_hexaco(source, registry)
    build_neo_calibration(source, output, neo300, neo300_df)
    for key in (neo300, bfas, hexaco):
        write_json(output / "keys" / f"{key['id']}.json", key)
    write_json(output / "items" / "ipip.json", registry.payload())
    build_pvq(output)
    build_omib(source, output)
    build_rotation(source, output, args.asset_dir.resolve())
    write_json(output / "manifest.json", {
        "schema_version": 1,
        "generated": "2026-07-19",
        "source_hashes": source_hashes(source),
        "bfas_replacements": [
            {"removed": "Am not a very enthusiastic person.", "reason": "Newly written BFAS item (footnote c).", "replacement": "Am not easily amused.", "replacement_source": "IPIP-NEO E6 Cheerfulness."},
            {"removed": "Do not have an assertive personality.", "reason": "BFI-derived item (footnote d).", "replacement": "Don't like to draw attention to myself.", "replacement_source": "IPIP-NEO E3 Assertiveness."},
        ],
        "norms": {
            "ipip": "Empirical quantiles; cells require n >= 1,000.",
            "pvq21": "Not generated: ESS API download requires a registered user ID.",
            "omib": "2PL calibration supplied by the instrument authors.",
            "rotation": "Validation-sample 2PL approximation; explicitly labeled in the UI.",
        },
    })


if __name__ == "__main__":
    main()
