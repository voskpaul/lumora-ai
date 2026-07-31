import json


HEADER = r"""[Script Info]
ScriptType: v4.00+
PlayResX: 720
PlayResY: 1280
WrapStyle: 2
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding

Style: Normal,Bebas Neue,68,&H00FFFFFF,&H0000FFFF,&H00000000,&H78000000,1,0,0,0,100,100,0,0,1,4,1,2,70,70,140,1

Style: Highlight,Bebas Neue,68,&H0000FFFF,&H0000FFFF,&H00000000,&H78000000,1,0,0,0,100,100,0,0,1,4,1,2,70,70,140,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""


def ass_time(seconds: float):
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f"{h}:{m:02}:{s:05.2f}"


def build_ass(json_path, ass_path):
    with open(json_path, "r", encoding="utf8") as f:
        words = json.load(f)

    lines = [HEADER]

    for w in words:
        print(w["word"], w["start"], w["end"])

        start = ass_time(w["start"])
        end = ass_time(w["end"] + 1.2)

        duration_ms = int((w["end"] - w["start"]) * 1000)

        text = w["word"].upper()

        line = f"Dialogue: 0,{start},{end},Normal,,0,0,0,,{text}\n"

        lines.append(line)

    with open(ass_path, "w", encoding="utf8") as f:
        f.writelines(lines)

    print(f"ASS saved -> {ass_path}")