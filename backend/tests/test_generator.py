import pytest
from datetime import datetime
from api.services.ingestion.synthetic import SyntheticGenerator, SOURCES, REGIONS, PARAMETERS, LEAD_TIMES

def test_generator_constants():
    assert len(SOURCES) == 4
    assert set(SOURCES) == {"NWP", "ENSEMBLE", "AI_MODEL", "SATELLITE_AI"}
    
    assert len(REGIONS) == 6
    assert set(REGIONS) == {"Delhi", "Punjab", "Uttar Pradesh", "Rajasthan", "Maharashtra", "Bihar"}
    
    assert len(PARAMETERS) == 3
    assert set(PARAMETERS) == {"rainfall", "temperature", "wind"}
    
    assert len(LEAD_TIMES) == 5
    assert set(LEAD_TIMES) == {6, 12, 24, 48, 72}

def test_sensible_ranges():
    gen = SyntheticGenerator(base_seed=123)
    ts = datetime(2026, 1, 1)
    
    # Check true values
    rain = gen.generate_true_value("Delhi", "rainfall", ts)
    assert 0 <= rain <= 180
    
    temp = gen.generate_true_value("Delhi", "temperature", ts)
    assert 10 <= temp <= 45
    
    wind = gen.generate_true_value("Delhi", "wind", ts)
    assert 0 <= wind <= 100
    
    # Check forecasts are bounded reasonably (no negative wind/rain)
    f_rain = gen.generate_forecast("Delhi", ts, 24, "rainfall", "NWP", rain)
    assert f_rain.value >= 0

    f_wind = gen.generate_forecast("Delhi", ts, 24, "wind", "NWP", wind)
    assert f_wind.value >= 0

def test_reproducible_results():
    ts = datetime(2026, 6, 15)
    
    gen1 = SyntheticGenerator(base_seed=999)
    obs1, fcst1 = gen1.generate_dataset_for_day(ts)
    
    gen2 = SyntheticGenerator(base_seed=999)
    obs2, fcst2 = gen2.generate_dataset_for_day(ts)
    
    assert obs1[0].value == obs2[0].value
    assert fcst1[0].value == fcst2[0].value

def test_different_source_errors():
    gen = SyntheticGenerator(base_seed=111)
    ts = datetime(2026, 8, 1)
    region = "Punjab"
    lead = 24
    
    # We test over multiple runs to see average error properties
    errors = {s: [] for s in SOURCES}
    for i in range(100):
        # vary ts slightly to get different samples
        loop_ts = datetime(2026, 8, 1, i % 24)
        for src in SOURCES:
            # get_source_error returns the error directly
            err = gen.get_source_error(src, "temperature", region, lead, loop_ts)
            errors[src].append(err)
            
    # ENSEMBLE should have lower variance than NWP
    var_ensemble = sum((x - sum(errors["ENSEMBLE"])/100)**2 for x in errors["ENSEMBLE"]) / 100
    var_nwp = sum((x - sum(errors["NWP"])/100)**2 for x in errors["NWP"]) / 100
    
    assert var_ensemble < var_nwp
    
def test_idempotent_seed_logic():
    # Since we can't easily test DB idempotency in unit tests without setting up test DB,
    # we verify the generator always yields the exact same objects for the same seed/date.
    gen1 = SyntheticGenerator(base_seed=42)
    obs1, fcst1 = gen1.generate_dataset_for_day(datetime(2026, 1, 1))
    
    gen2 = SyntheticGenerator(base_seed=42)
    obs2, fcst2 = gen2.generate_dataset_for_day(datetime(2026, 1, 1))
    
    assert len(obs1) == len(obs2)
    assert obs1[5].value == obs2[5].value
    
    assert len(fcst1) == len(fcst2)
    assert fcst1[10].value == fcst2[10].value
    assert fcst1[10].source == fcst2[10].source
