# engine/audio/audio_engine.py
# Scribe AI — Live Audio Engine
# Stress Test Fix: Clear buffer after detection, 2-second chunks

import sounddevice as sd
import numpy as np
import queue
import threading
from faster_whisper import WhisperModel
from engine.paths import get_base_dir
import os

LOCAL_MODEL_PATH = os.path.join(get_base_dir(), "models", "faster-whisper-small")


class AudioEngine:
    def __init__(self, on_transcript, device_index=None):
        self.on_transcript = on_transcript
        self.device_index = device_index
        self.sample_rate = 16000
        self.chunk_seconds = 5
        self.audio_queue = queue.Queue()
        self.running = False
        self.text_buffer = ""

        print(f"Loading Whisper model from: {LOCAL_MODEL_PATH}")
        self.model = WhisperModel(LOCAL_MODEL_PATH, device="cpu", compute_type="int8")
        print("Whisper model loaded. Ready to listen.")

    def _audio_callback(self, indata, frames, time, status):
        if status:
            print(f"Audio status: {status}")
        self.audio_queue.put(indata.copy())

    def _process_audio(self):
        buffer = []
        buffer_duration = 0

        while self.running:
            try:
                chunk = self.audio_queue.get(timeout=1)
                buffer.append(chunk)
                buffer_duration += len(chunk) / self.sample_rate

                if buffer_duration >= self.chunk_seconds:
                    audio_data = np.concatenate(buffer, axis=0).flatten()
                    buffer = []
                    buffer_duration = 0

                    segments, _ = self.model.transcribe(
                        audio_data,
                        language="en",
                        beam_size=1,
                        vad_filter=True,
                    )

                    transcript = " ".join(s.text for s in segments).strip()

                    if transcript:
                        combined = (self.text_buffer + " " + transcript).strip()
                        print(f"Transcript: {transcript}")
                        detected = self.on_transcript(combined)

                        if detected:
                            # Clear buffer after successful detection
                            self.text_buffer = ""
                        else:
                            # Keep last 60 chars as context for next chunk
                            self.text_buffer = transcript[-60:] if len(transcript) > 60 else transcript
                    else:
                        self.text_buffer = ""

            except queue.Empty:
                continue

    def start(self):
        self.running = True
        self.process_thread = threading.Thread(target=self._process_audio, daemon=True)
        self.process_thread.start()
        print("Listening... Press Ctrl+C to stop.")
        self.stream = sd.InputStream(
            samplerate=self.sample_rate,
            channels=1,
            dtype="float32",
            device=self.device_index,
            callback=self._audio_callback,
        )
        self.stream.start()

    def stop(self):
        self.running = False
        if hasattr(self, "stream"):
            self.stream.stop()
            self.stream.close()
        print("Audio engine stopped.")