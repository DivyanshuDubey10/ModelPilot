from backend.database.history_store import load_history


def test_load_history():
    history = load_history()
    assert isinstance(history, list)
    if history:
        latest = history[-1]
        assert "model_name" in latest
        assert "n_estimators" in latest
        assert "metrics" in latest


if __name__ == "__main__":
    test_load_history()
    print("History store test passed!")
