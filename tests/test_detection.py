import sys
import os
import regex

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from engine.detection.scripture_detector import detect_scripture_references

def load_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def load_ground_truth(path):
    with open(path, 'r', encoding='utf-8') as f:
        return [line.strip().lower() for line in f if line.strip()]

def normalize(ref):
    ref = ref.strip().lower()
    match = regex.search(r'chapter\s*(\d+)\s*verse\s*(\d+)', ref)
    if match:
        book = ref[:match.start()].strip()
        chapter = match.group(1)
        verse = match.group(2)
        ref = f"{book} {chapter}:{verse}"
    return ref

def evaluate(detected, ground_truth):
    detected_normalized = [normalize(d['reference']) for d in detected]
    gt_normalized = [normalize(g) for g in ground_truth]

    true_positives = sum(1 for d in detected_normalized if any(g in d or d in g for g in gt_normalized))
    false_positives = len(detected_normalized) - true_positives
    false_negatives = len(gt_normalized) - true_positives

    precision = true_positives / (true_positives + false_positives) if detected_normalized else 0
    recall = true_positives / (true_positives + false_negatives) if gt_normalized else 0
    fpr = false_positives / (false_positives + true_positives) if detected_normalized else 0

    return {
        'precision': round(precision * 100, 2),
        'recall': round(recall * 100, 2),
        'false_positive_rate': round(fpr * 100, 2),
        'true_positives': true_positives,
        'false_positives': false_positives,
        'false_negatives': false_negatives,
    }

if __name__ == '__main__':
    transcript = load_file('data/transcripts/sermon_01.txt')
    ground_truth = load_ground_truth('data/ground_truth/sermon_01_ground_truth.txt')

    detected = detect_scripture_references(transcript)

    print('\n--- DETECTED REFERENCES ---')
    for d in detected:
        print(f"  {d['reference']}  (position {d['position']})")

    print('\n--- GROUND TRUTH ---')
    for g in ground_truth:
        print(f"  {g}")

    scores = evaluate(detected, ground_truth)

    print('\n--- MILESTONE 1 RESULTS ---')
    print(f"  Precision:          {scores['precision']}%  (target: >85%)")
    print(f"  Recall:             {scores['recall']}%  (target: >80%)")
    print(f"  False Positive Rate:{scores['false_positive_rate']}%  (target: <10%)")
    print(f"  True Positives:     {scores['true_positives']}")
    print(f"  False Positives:    {scores['false_positives']}")
    print(f"  False Negatives:    {scores['false_negatives']}")