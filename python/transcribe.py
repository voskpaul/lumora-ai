import sys
from pathlib import Path

from faster_whisper import WhisperModel
from caption_builder import build_captions
from ass_builder import build_ass

def main():

    if len(sys.argv) < 3:
        print("Usage:")
        print("python transcribe.py input_audio output.srt")
        sys.exit(1)

    input_audio = sys.argv[1]
    output_srt = sys.argv[2]

    output_json = str(Path(output_srt).with_suffix(".json"))

    print("Loading Whisper model...")

    model = WhisperModel(
        "base",
        device="cpu",
        compute_type="int8"
    )

    segments, info = model.transcribe(
        input_audio,
        beam_size=5,
        word_timestamps=True,
        vad_filter=True
    )

    print(f"Language: {info.language}")

    segments = list(segments)

    srt_text, json_text = build_captions(
        segments,
        words_per_caption=3
    )

    with open(output_srt, "w", encoding="utf-8") as f:
        f.write(srt_text)

    with open(output_json, "w", encoding="utf-8") as f:
        f.write(json_text)

    output_ass = str(Path(output_srt).with_suffix(".ass"))

    build_ass(
        output_json,
        output_ass,
    )

    print("Exists after build:", Path(output_ass).exists())

    if Path(output_ass).exists():
        print("ASS SIZE:", Path(output_ass).stat().st_size)
    else:
        print("ASS WAS NOT CREATED")
    print(f"SRT saved  -> {output_srt}")
    print(f"JSON saved -> {output_json}")
    print(f"ASS saved  -> {output_ass}")
    print("Done.")


if __name__ == "__main__":
    main()