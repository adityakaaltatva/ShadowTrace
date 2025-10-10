import pandas as pd
import numpy as np

def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Construct wallet-level engineered features."""
    df['fan_out_ratio'] = df['unique_outgoing'] / (df['num_out_tx'] + 1)
    df['fan_in_ratio']  = df['unique_incoming'] / (df['num_in_tx'] + 1)
    df['tx_volume_ratio'] = df['total_sent_eth'] / (df['total_received_eth'] + 1)
    df['activity_span'] = df['last_activity_days_ago'] - df['first_seen_age_days']
    df['risk_flag'] = df['sanction_flag'] | df['mixer_flag']
    df.replace([np.inf, -np.inf], 0, inplace=True)
    return df
