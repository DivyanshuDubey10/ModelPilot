import pandas as pd 
from backend.ml_engine.preprocessor import prepare_data

df = pd.DataFrame({
    "amount": [500,1200,800],
    "merchant": ["Amazon", "Flipkart", "Amazon"],
    "fraud": [0, 1, 0]
})
X,y = prepare_data(df, "fraud")
print(X)

print(y)