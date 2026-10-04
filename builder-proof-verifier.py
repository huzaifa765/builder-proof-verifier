# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json

class BuilderProofVerifier(gl.Contract):

    owner: str
    total_submissions: u256
    submissions: TreeMap[str, str]
    verdicts: TreeMap[str, str]

    def __init__(self) -> None:
        self.owner = str(gl.message.sender_address)
        self.total_submissions = u256(0)
        self.submissions = TreeMap()
        self.verdicts = TreeMap()

    @gl.public.write
    def submit_proof(
        self,
        proof_id: str,
        github_repo: str,
        commit_hash: str,
        demo_url: str,
        summary: str
    ) -> None:
        if not proof_id or not summary or not github_repo or not commit_hash:
            raise Exception("proof_id, github_repo, commit_hash and summary are required")

        submission = json.dumps({
            "proof_id": proof_id,
            "github_repo": github_repo,
            "commit_hash": commit_hash,
            "demo_url": demo_url,
            "summary": summary,
            "submitter": str(gl.message.sender_address),
            "status": "PENDING"
        })
        self.submissions[proof_id] = submission
        self.total_submissions = u256(int(self.total_submissions) + 1)

    @gl.public.write
    def judge_proof(self, proof_id: str) -> None:
        submission_raw = self.submissions.get(proof_id, "")
        if not submission_raw:
            raise Exception("Submission not found")

        submission = json.loads(submission_raw)

        github_repo = submission.get("github_repo", "")
        commit_hash = submission.get("commit_hash", "")

        # Build immutable raw GitHub URL using specific commit hash
        # e.g. https://github.com/user/repo -> https://api.github.com/repos/user/repo/commits/HASH
        repo_path = github_repo.replace("https://github.com/", "")
        raw_tree_url = f"https://api.github.com/repos/{repo_path}/git/trees/{commit_hash}?recursive=1"
        commit_url = f"https://api.github.com/repos/{repo_path}/commits/{commit_hash}"

        def get_leader_result() -> str:
            # Fetch commit details — immutable proof
            commit_data = ""
            try:
                response = gl.nondet.web.get(commit_url)
                commit_data = response.body.decode("utf-8")[:2000]
            except:
                commit_data = "Commit data unavailable"

            # Fetch file tree at that commit — immutable snapshot
            tree_data = ""
            try:
                response2 = gl.nondet.web.get(raw_tree_url)
                tree_data = response2.body.decode("utf-8")[:2000]
            except:
                tree_data = "Tree data unavailable"

            prompt = f"""You are an impartial GenLayer validator reviewing a builder proof submission.

Builder Summary: {submission['summary']}
GitHub Repository: {github_repo}
Commit Hash (immutable): {commit_hash}

Commit Details fetched from GitHub API:
{commit_data}

Repository File Tree at this commit:
{tree_data}

Your task:
1. Check if the commit hash is real and matches an actual commit in the repository
2. Verify the repository contains actual code files (not empty or boilerplate only)
3. Check if the files match what the builder claimed in their summary
4. Assess the quality and genuineness of the work

Return ONLY this exact JSON:
{{"verdict": "SHIPPED", "score": 80, "evidence_quality": "HIGH", "commit_verified": true, "file_count": 5, "reasons": ["reason1", "reason2"], "risk_flags": [], "confidence": "HIGH"}}

verdict must be: SHIPPED, WEAK, FAKE, or NEEDS_MORE_EVIDENCE
score: integer 0-100
evidence_quality: LOW, MEDIUM, or HIGH
commit_verified: true if commit hash exists and matches repo, false otherwise
file_count: estimated number of code files found
confidence: LOW, MEDIUM, or HIGH"""

            return gl.nondet.exec_prompt(prompt)

        def validator_fn(leader_result: str) -> bool:
            # Validator independently fetches same immutable commit and verifies
            independent_data = ""
            try:
                response = gl.nondet.web.get(commit_url)
                independent_data = response.body.decode("utf-8")[:1000]
            except:
                independent_data = "unavailable"

            prompt = f"""You are an independent GenLayer validator.

The leader validator reviewed this builder proof:
Repository: {github_repo}
Commit Hash: {commit_hash}
Builder Summary: {submission['summary']}

Leader verdict: {leader_result}

You independently fetched the same commit:
{independent_data}

Does the leader verdict correctly reflect what the commit evidence shows?
Reply with only: true or false"""

            output = gl.nondet.exec_prompt(prompt)
            return "true" in output.strip().lower()

        result = gl.eq_principle.nondet(get_leader_result, validator_fn)

        self.verdicts[proof_id] = json.dumps({
            "proof_id": proof_id,
            "verdict_raw": result,
            "commit_hash": commit_hash,
            "judged": True
        })

    @gl.public.view
    def get_submission(self, proof_id: str) -> str:
        return self.submissions.get(proof_id, "")

    @gl.public.view
    def get_verdict(self, proof_id: str) -> str:
        return self.verdicts.get(proof_id, "")

    @gl.public.view
    def get_total(self) -> u256:
        return self.total_submissions

    @gl.public.view
    def get_owner(self) -> str:
        return self.owner
