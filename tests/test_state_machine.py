"""
Tests for the Service State Machine.

Run with: pytest tests/test_state_machine.py -v
"""

import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from engine.state.service_state_machine import ServiceStateMachine, ServiceState


def test_initial_state_is_pre_service():
    machine = ServiceStateMachine()
    assert machine.get_current_state() == ServiceState.PRE_SERVICE


def test_transitions_to_worship():
    machine = ServiceStateMachine()
    machine.update_from_text("Alright church, let's stand and worship the Lord")
    assert machine.get_current_state() == ServiceState.WORSHIP


def test_transitions_to_sermon():
    machine = ServiceStateMachine()
    machine.update_from_text("Turn with me to the book of John chapter 3")
    assert machine.get_current_state() == ServiceState.SERMON


def test_transitions_to_prayer():
    machine = ServiceStateMachine()
    machine.update_from_text("Let's pray. Bow your heads with me")
    assert machine.get_current_state() == ServiceState.PRAYER


def test_transitions_to_announcements():
    machine = ServiceStateMachine()
    machine.update_from_text("Before we continue, a few announcements")
    assert machine.get_current_state() == ServiceState.ANNOUNCEMENTS


def test_unmatched_text_does_not_change_state():
    machine = ServiceStateMachine()
    machine.update_from_text("random unrelated sentence with no keywords")
    assert machine.get_current_state() == ServiceState.PRE_SERVICE


def test_state_does_not_change_on_repeat_phrase():
    machine = ServiceStateMachine()
    machine.update_from_text("let's stand and worship")
    first_change_time = machine.get_history()[-1][1]
    machine.update_from_text("let's stand and worship again")
    second_change_time = machine.get_history()[-1][1]
    # Should still be WORSHIP, and history should NOT have grown
    assert machine.get_current_state() == ServiceState.WORSHIP
    assert len(machine.get_history()) == 2  # PRE_SERVICE -> WORSHIP only


def test_full_service_flow():
    machine = ServiceStateMachine()
    machine.update_from_text("let's stand and worship")
    assert machine.get_current_state() == ServiceState.WORSHIP

    machine.update_from_text("open your bibles to Matthew 5")
    assert machine.get_current_state() == ServiceState.SERMON

    machine.update_from_text("let's pray together")
    assert machine.get_current_state() == ServiceState.PRAYER

    machine.update_from_text("a few announcements before you go")
    assert machine.get_current_state() == ServiceState.ANNOUNCEMENTS

    history = machine.get_history()
    assert len(history) == 5  # PRE_SERVICE + 4 transitions