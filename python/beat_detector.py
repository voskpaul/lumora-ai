import sys
import json
import librosa
import numpy as np

music = sys.argv[1]

y, sr = librosa.load(music, sr=None)

tempo, beats = librosa.beat.beat_track(
    y=y,
    sr=sr
)

# librosa compatibility
if isinstance(tempo, np.ndarray):
    tempo = tempo.item()

beat_times = librosa.frames_to_time(
    beats,
    sr=sr
).tolist()

result = {
    "tempo": float(tempo),
    "duration": float(
        librosa.get_duration(
            y=y,
            sr=sr
        )
    ),
    "beats": beat_times
}

print(json.dumps(result))