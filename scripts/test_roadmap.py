"""Unit tests for the MouseTrap master roadmap synchronization tool."""
import json
import unittest
from unittest.mock import MagicMock
import sync_roadmap


class RoadmapSyncTests(unittest.TestCase):
    def test_plan_covers_completed_releases_and_all_seven_future_epics(self):
        plan = sync_roadmap.build_plan()
        self.assertEqual(plan['roadmap'], 'docs/ROADMAP.md')
        milestone_keys = [m['key'] for m in plan['milestones']]
        self.assertEqual(milestone_keys, ['v1.0.0', 'v1.1.0', 'v1.2.0', 'v1.3.0', 'v1.4.0', 'v2.0.0'])
        epic_codes = [e['code'] for e in plan['epics']]
        self.assertEqual(epic_codes, ['V1.0', 'V1.1', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7'])
        board = sync_roadmap.format_board(plan)
        self.assertIn('[Epic E1] 3NF Database Normalization', board)
        self.assertIn('Ready / Next', board)

    def test_dry_run_never_invokes_gh_cli(self):
        code = sync_roadmap.main(['--dry-run'])
        self.assertEqual(code, 0)

    def test_apply_creates_labels_milestones_and_closes_completed_issues(self):
        calls = []

        def fake_runner(cmd, **kwargs):
            calls.append(cmd)
            response = MagicMock(returncode=0, stderr='', stdout='')
            if 'milestones?state=all' in ' '.join(cmd):
                response.stdout = '[]'
            elif '--method' in cmd and 'POST' in cmd:
                response.stdout = json.dumps({'number': len(calls)})
            elif 'issue' in cmd and 'list' in cmd:
                response.stdout = '[]'
            return response

        report = sync_roadmap.apply_to_github('rafaelpacinii/ecommerce-mousetrap', runner=fake_runner)
        self.assertEqual(report['milestones_synced'], 6)
        self.assertEqual(len(report['issues']), 9)
        closed_cmds = [c for c in calls if 'state=closed' in c]
        self.assertEqual(len(closed_cmds), 4)


if __name__ == '__main__':
    unittest.main()

