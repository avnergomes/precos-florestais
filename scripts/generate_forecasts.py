# -*- coding: utf-8 -*-
"""
Generate offline forecasts for all filter combinations and ML models.
Outputs dashboard/public/data/forecasts.json.
"""

import json
import math
import warnings
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import xgboost as xgb
import lightgbm as lgb
from sklearn.ensemble import RandomForestRegressor

BASE_DIR = Path.cwd()
DATA_PATH = BASE_DIR / "dashboard" / "public" / "data" / "detailed.json"
OUTPUT_PATH = BASE_DIR / "dashboard" / "public" / "data" / "forecasts.json"

TARGET_PERIOD = "2026-11"
MAX_HORIZON = 36


def months_between(start, end):
    sy, sm = [int(x) for x in start.split("-")]
    ey, em = [int(x) for x in end.split("-")]
    return (ey * 12 + (em - 1)) - (sy * 12 + (sm - 1))


def add_months(period, count):
    y, m = [int(x) for x in period.split("-")]
    total = (y * 12 + (m - 1)) + count
    year = total // 12
    month = (total % 12) + 1
    return f"{year}-{month:02d}"


def build_key(ano, regiao, categoria, subcategoria, produto):
    def val(x):
        return "*" if x is None else str(x)

    return (
        f"ano={val(ano)}|regiao={val(regiao)}|categoria={val(categoria)}"
        f"|subcategoria={val(subcategoria)}|produto={val(produto)}"
    )


def iter_keys(row):
    regiao = row.get("regiao")
    categoria = row.get("categoria")
    subcategoria = row.get("subcategoria")
    produto = row.get("produto")

    for reg_val in (regiao, None):
        # all categories
        yield build_key(None, reg_val, None, None, None)
        # category level
        yield build_key(None, reg_val, categoria, None, None)
        # subcategory level
        yield build_key(None, reg_val, categoria, subcategoria, None)
        # product level
        yield build_key(None, reg_val, categoria, subcategoria, produto)


def key_to_filters(key):
    parts = key.split("|")
    out = {}
    for part in parts:
        k, v = part.split("=", 1)
        out[k] = None if v == "*" else v
    if out.get("ano") is not None:
        out["ano"] = int(out["ano"])
    return out


def avg(values):
    return float(sum(values) / len(values)) if values else None


def build_features(values, periods, lags, windows):
    max_lag = max(lags)
    X = []
    y = []
    for i in range(max_lag, len(values)):
        features = []
        for lag in lags:
            features.append(values[i - lag])
        for window in windows:
            features.append(np.mean(values[i - window:i]))
        year, month = [int(x) for x in periods[i].split("-")]
        features.append(month)
        features.append(math.sin(2 * math.pi * month / 12))
        features.append(math.cos(2 * math.pi * month / 12))
        features.append(i)
        X.append(features)
        y.append(values[i])
    return np.array(X, dtype=float), np.array(y, dtype=float)


def build_next_features(history, period, lags, windows):
    features = []
    for lag in lags:
        features.append(history[-lag])
    for window in windows:
        features.append(np.mean(history[-window:]))
    year, month = [int(x) for x in period.split("-")]
    features.append(month)
    features.append(math.sin(2 * math.pi * month / 12))
    features.append(math.cos(2 * math.pi * month / 12))
    features.append(len(history))
    return np.array(features, dtype=float).reshape(1, -1)


def train_model(model_id, X, y):
    if model_id == "xgboost":
        model = xgb.XGBRegressor(
            n_estimators=80,
            max_depth=3,
            learning_rate=0.08,
            subsample=0.8,
            colsample_bytree=0.8,
            objective="reg:squarederror",
            random_state=42,
            verbosity=0
        )
    elif model_id == "lightgbm":
        model = lgb.LGBMRegressor(
            n_estimators=80,
            learning_rate=0.08,
            num_leaves=31,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            min_data_in_leaf=1,
            min_data_in_bin=1,
            verbosity=-1
        )
    elif model_id == "random_forest":
        model = RandomForestRegressor(
            n_estimators=80,
            max_depth=8,
            random_state=42
        )
    else:
        return None

    model.fit(X, y)
    return model


def model_metrics(model, X, y):
    if len(y) < 4:
        return {"mae": None, "rmse": None, "mape": None}

    test_size = max(int(len(y) * 0.2), 3)
    split = len(y) - test_size
    if split < 2:
        return {"mae": None, "rmse": None, "mape": None}
    X_train, y_train = X[:split], y[:split]
    X_test, y_test = X[split:], y[split:]
    try:
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
    except Exception:
        return {"mae": None, "rmse": None, "mape": None}
    mae = float(np.mean(np.abs(y_test - preds)))
    rmse = float(np.sqrt(np.mean((y_test - preds) ** 2)))
    mape_vals = []
    for actual, pred in zip(y_test, preds):
        if actual != 0:
            mape_vals.append(abs(actual - pred) / abs(actual))
    mape = float(np.mean(mape_vals)) if mape_vals else None
    return {"mae": mae, "rmse": rmse, "mape": mape}


def residual_sigma(model, X, y):
    if len(y) < 4:
        return 0.0
    try:
        preds = model.predict(X)
        residuals = y - preds
        return float(np.sqrt(np.mean(residuals ** 2)))
    except Exception:
        return 0.0


def forecast_series(values, periods, model_id, horizon):
    if len(values) < 8:
        return None

    available_lags = [lag for lag in (1, 2, 3, 6, 12) if len(values) > lag]
    if not available_lags:
        return None
    max_lag = max(available_lags)
    windows = [w for w in (3, 6, 12) if max_lag >= w]

    X, y = build_features(values, periods, available_lags, windows)
    if len(y) < 6:
        return None

    model = train_model(model_id, X, y)
    if model is None:
        return None

    metrics = model_metrics(model, X, y)
    try:
        model.fit(X, y)
    except Exception:
        return None
    sigma = residual_sigma(model, X, y)
    ci = 1.96 * sigma

    history = list(values)
    forecast = []
    last_period = periods[-1]
    for step in range(1, horizon + 1):
        next_period = add_months(last_period, step)
        X_next = build_next_features(history, next_period, available_lags, windows)
        pred = float(model.predict(X_next)[0])
        history.append(pred)
        forecast.append({
            "period": next_period,
            "value": pred,
            "lower": pred - ci,
            "upper": pred + ci
        })

    return {"forecast": forecast, "metrics": metrics}


def naive_forecast(values, periods, horizon):
    if not values:
        return None
    last = values[-1]
    last_period = periods[-1]
    forecast = []
    for step in range(1, horizon + 1):
        period = add_months(last_period, step)
        forecast.append({"period": period, "value": last, "lower": last, "upper": last})
    return {"forecast": forecast, "metrics": {"mae": None, "rmse": None, "mape": None}}


def main():
    if not DATA_PATH.exists():
        raise SystemExit(f"Missing data file: {DATA_PATH}")

    with DATA_PATH.open("r", encoding="utf-8") as f:
        data = json.load(f)

    warnings.filterwarnings(
        "ignore",
        message="X does not have valid feature names*"
    )

    series = {}
    for row in data:
        period = row.get("periodo")
        if not period:
            continue
        for key in iter_keys(row):
            entry = series.setdefault(key, {
                "filters": key_to_filters(key),
                "periods": defaultdict(lambda: [0.0, 0])
            })
            acc = entry["periods"][period]
            acc[0] += float(row["preco"])
            acc[1] += 1

    output = {
        "meta": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "target_period": TARGET_PERIOD,
            "max_horizon": MAX_HORIZON,
            "models": {
                "xgboost": {"label": "XGBoost"},
                "lightgbm": {"label": "LightGBM"},
                "random_forest": {"label": "Random Forest"},
                "naive": {"label": "Persistencia"}
            }
        },
        "series": {}
    }

    for key, entry in series.items():
        period_items = sorted(entry["periods"].items(), key=lambda x: x[0])
        periods = [p for p, _ in period_items]
        values = [v / c for _, (v, c) in period_items if c > 0]

        if len(values) < 8:
            continue

        last_period = periods[-1]
        horizon_to_target = months_between(last_period, TARGET_PERIOD)
        if horizon_to_target < 1:
            continue
        horizon = min(horizon_to_target, MAX_HORIZON)

        series_out = {
            "filters": entry["filters"],
            "last_period": last_period,
            "forecast_end": add_months(last_period, horizon),
            "models": {}
        }

        # naive baseline
        naive = naive_forecast(values, periods, horizon)
        if naive:
            series_out["models"]["naive"] = naive

        if len(values) >= 18:
            result = forecast_series(values, periods, "random_forest", horizon)
            if result:
                series_out["models"]["random_forest"] = result

        if len(values) >= 30:
            for model_id in ("xgboost", "lightgbm"):
                result = forecast_series(values, periods, model_id, horizon)
                if result:
                    series_out["models"][model_id] = result

        if series_out["models"]:
            output["series"][key] = series_out

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False)

    print(f"Wrote {OUTPUT_PATH} with {len(output['series'])} series")


if __name__ == "__main__":
    main()
