import os
import sys
import unittest

def main():
    test_loader = unittest.TestLoader()
    test_suite = test_loader.discover(start_dir='tests', pattern='test_*.py')
    
    runner = unittest.TextTestRunner(verbosity=2)
    print("=" * 60)
    print("RUNNING MODULAR UNIT TEST SUITE (PHASE 14)")
    print("=" * 60)
    result = runner.run(test_suite)
    
    print("\n" + "=" * 60)
    print(f"TESTS RUN: {result.testsRun}")
    print(f"ERRORS: {len(result.errors)}")
    print(f"FAILURES: {len(result.failures)}")
    print("=" * 60)
    if result.wasSuccessful():
        print("✅ ALL UNIT TESTS PASSED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("❌ SOME UNIT TESTS FAILED!")
        sys.exit(1)

if __name__ == '__main__':
    main()
