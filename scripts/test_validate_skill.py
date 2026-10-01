"""Focused metadata and CLI contract tests; run with unittest discovery."""
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from validate_skill import validate_skill


class ValidatorTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.skill = Path(self.temp.name) / "sample"
        self.skill.mkdir()

    def write_skill(self, frontmatter):
        (self.skill / "SKILL.md").write_text("---\n" + frontmatter + "\n---\n# Example\n")

    def test_standard_metadata(self):
        self.write_skill('name: sample\ndescription: Example\ncompatibility: Python\nmetadata:\n  version: "1.0"')
        self.assertEqual(validate_skill(self.skill), [])

    def test_duplicate_keys(self):
        for extra in ["name: other", "description: Other", 'metadata:\n  version: "1"\n  version: "2"']:
            with self.subTest(extra=extra):
                self.write_skill("name: sample\ndescription: Example\n" + extra)
                self.assertIn("duplicate key", " ".join(validate_skill(self.skill)))

    def test_invalid_metadata(self):
        for frontmatter in ["name: [", "name: sample", "name: other\ndescription: Example", "name: sample\ndescription: Example\nversion: 1", "name: sample\ndescription: Example\nmetadata:\n  version: 1"]:
            with self.subTest(frontmatter=frontmatter):
                self.write_skill(frontmatter)
                self.assertTrue(validate_skill(self.skill))

    def test_cli_failure_status(self):
        self.write_skill("name: sample\ndescription: Example\nname: sample")
        result = subprocess.run([sys.executable, str(Path(__file__).with_name("validate_skill.py")), str(self.skill)], capture_output=True, text=True)
        self.assertEqual(result.returncode, 1)
        self.assertIn("duplicate key", result.stdout)


if __name__ == "__main__":
    unittest.main()
