import pandas as pd

def load_raw_data(path: str) -> pd.DataFrame:
    """Load raw wallet or transaction dataset."""
    df = pd.read_csv(path)
    return df

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Basic cleaning and NA handling."""
    df = df.drop_duplicates()
    df = df.fillna({
        'mixer_flag': 0,
        'osint_confidence': 0,
        'bridge_interactions': 0
    })
    return df
