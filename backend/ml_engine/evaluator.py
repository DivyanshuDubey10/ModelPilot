from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

def evaluate_model(y_test, predictions):
    return{
        "accuracy": accuracy_score(y_test, predictions),
        "precision": precision_score(y_test, predictions, zero_division=0),
        "recall": recall_score(y_test, predictions, zero_division=0),
        "f1": f1_score(y_test, predictions, zero_division=0),
    }