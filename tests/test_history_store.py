
from backend.database.history_store import load_history

history = load_history()

assert isinstance(history, list)
assert len(history) > 0

latest = history[-1]

assert "model_name" in latest
assert "n_estimators" in latest
assert "metrics" in latest

print("History store test passed!")
print("Total saved experiments:", len(history))
print("Latest experiment:", latest)
