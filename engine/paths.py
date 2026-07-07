"""
Path Resolution Utility — Scribe AI

Resolves file paths correctly whether Scribe AI is running:
1. From source (python -m engine.pipeline) — paths relative to project root
2. As a packaged PyInstaller .exe — paths relative to the folder
   containing the executable (data/ ships as a sibling folder, not
   bundled inside the .exe, for fast startup and easy volunteer access)

Every module that reads/writes project data (databases, models, etc.)
should use get_data_path() instead of hardcoding "data/..." paths.
"""

import os
import sys


def get_base_dir() -> str:
    """
    Returns the base directory Scribe AI should resolve all data
    paths relative to.
    """
    if getattr(sys, "frozen", False):
        # Running as a packaged .exe — use the folder containing it.
        return os.path.dirname(sys.executable)
    else:
        # Running from source — use the project root
        # (two levels up from this file: engine/paths.py -> project root)
        return os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def get_data_path(*parts: str) -> str:
    """
    Returns an absolute path inside the project's data/ folder,
    correctly resolved for both source and packaged execution.

    Example: get_data_path("bible.db") -> ".../data/bible.db"
    """
    return os.path.join(get_base_dir(), "data", *parts)