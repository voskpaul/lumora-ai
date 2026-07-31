import json


def format_time(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)

    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"


def build_captions(segments, words_per_caption = 8):
    srt = ""
    json_words = []

    caption_words = []
    caption_start = None

    index = 1

    for segment in segments:
        if not hasattr(segment, "words"):
            continue

        for word in segment.words:

            json_words.append({
                "word": word.word.strip(),
                "start": round(word.start, 3),
                "end": round(word.end, 3)
            })

            if caption_start is None:
                caption_start = word.start

            caption_words.append(word)

            if (caption_words[-1].end - caption_start) >= 2.5:

                caption_end = caption_words[-1].end

                text = " ".join(
                    w.word.strip() for w in caption_words
                )

                srt += f"{index}\n"
                srt += (
                    f"{format_time(caption_start)} --> "
                    f"{format_time(caption_end)}\n"
                )
                srt += text + "\n\n"

                index += 1

                caption_words = []
                caption_start = None

    if caption_words:

        caption_end = caption_words[-1].end

        text = " ".join(
            w.word.strip() for w in caption_words
        )

        srt += f"{index}\n"
        srt += (
            f"{format_time(caption_start)} --> "
            f"{format_time(caption_end)}\n"
        )
        srt += text + "\n\n"

    return srt, json.dumps(json_words, indent=2)