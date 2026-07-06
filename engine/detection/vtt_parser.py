# engine/detection/vtt_parser.py
# Scribe AI — VTT Caption Cleaner
# Strips timestamps, tags, and noise from raw YouTube .vtt files
# Output: clean plain text ready for scripture detection

import regex
import os

def parse_vtt(filepath: str) -> str:
    """
    Reads a raw .vtt caption file and returns clean sermon text.
    Removes timestamps, inline timing tags, metadata headers, and noise lines.
    """
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()

    cleaned = []
    seen = set()

    for line in lines:
        line = line.strip()

        # Skip empty lines
        if not line:
            continue

        # Skip VTT metadata headers
        if line.startswith("WEBVTT") or line.startswith("Kind:") or line.startswith("Language:"):
            continue

        # Skip timestamp lines
        if "-->" in line:
            continue

        # Strip inline timing tags like <00:00:09.840><c> and </c>
        line = regex.sub(r'<[^>]+>', '', line)
        line = line.strip()

        # Skip empty lines after stripping tags
        if not line:
            continue

        # Skip noise lines like [Music], [Applause], [Laughter]
        if regex.match(r'^\[.*\]$', line):
            continue

        # Skip duplicate lines (VTT repeats lines during word-by-word rendering)
        if line.lower() in seen:
            continue

        seen.add(line.lower())
        cleaned.append(line)

    return ' '.join(cleaned)


def parse_all_vtt(input_dir: str, output_dir: str):
    """
    Parses all .vtt files in input_dir and saves clean text files to output_dir.
    """
    os.makedirs(output_dir, exist_ok=True)

    files = [f for f in os.listdir(input_dir) if f.endswith('.vtt')]
    print(f"Found {len(files)} .vtt files to process.")

    for i, filename in enumerate(files, 1):
        input_path = os.path.join(input_dir, filename)
        output_filename = f"sermon_{i:03d}.txt"
        output_path = os.path.join(output_dir, output_filename)

        text = parse_vtt(input_path)

        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text)

        print(f"[{i}/{len(files)}] {filename} → {output_filename}")

    print(f"\nDone. {len(files)} transcripts saved to {output_dir}")


if __name__ == '__main__':
    parse_all_vtt('data/raw_transcripts', 'data/transcripts')