from backend.ml_engine.evaluator import evaluate_model

actual = [0, 1, 1, 0]
predictions = [0, 1, 1, 0]

results = evaluate_model(actual, predictions)

print(results)
