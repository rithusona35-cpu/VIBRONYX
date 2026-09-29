"""
Unit Test Suite: Class Mapping, Severity, and Color Parity
Validates that model class indices match SIH 26008 specification:
0 = Belt Splice
1 = Deep Scratch
2 = Longitudinal Tear
3 = Normal Belt
4 = Slight Scratch
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath("."))
from unified_preprocessor import (
    MineGuardInferenceEngine,
    EXPECTED_CLASSES,
    DISPLAY_NAMES,
    CLASS_COLORS,
    CLASS_SEVERITY
)

class TestClassMapping(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        model_path = os.path.abspath("models/final_sih_model.pt")
        cls.engine = MineGuardInferenceEngine(model_path, device='cpu')

    def test_class_names_parity(self):
        """Model internal class names must match EXPECTED_CLASSES."""
        model_names = self.engine.model.names
        self.assertEqual(len(model_names), 5)
        for cls_id, expected_name in EXPECTED_CLASSES.items():
            self.assertEqual(
                model_names[cls_id].lower(),
                expected_name.lower(),
                f"Class {cls_id} name mismatch: {model_names[cls_id]} != {expected_name}"
            )

    def test_severity_assignments(self):
        """Belt Splice and Longitudinal Tear must be CRITICAL."""
        self.assertEqual(CLASS_SEVERITY['belt splice'], 'CRITICAL')
        self.assertEqual(CLASS_SEVERITY['longitudinal tear'], 'CRITICAL')
        self.assertEqual(CLASS_SEVERITY['deep scratch'], 'WARNING')
        self.assertEqual(CLASS_SEVERITY['slight scratch'], 'INFO')
        self.assertEqual(CLASS_SEVERITY['normal belt'], 'HEALTHY')

    def test_display_names(self):
        """Display names must have proper casing."""
        self.assertEqual(DISPLAY_NAMES[0], 'Belt Splice')
        self.assertEqual(DISPLAY_NAMES[1], 'Deep Scratch')
        self.assertEqual(DISPLAY_NAMES[2], 'Longitudinal Tear')
        self.assertEqual(DISPLAY_NAMES[3], 'Normal Belt')
        self.assertEqual(DISPLAY_NAMES[4], 'Slight Scratch')

if __name__ == '__main__':
    unittest.main()
