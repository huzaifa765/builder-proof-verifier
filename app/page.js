"use client";

import { useState } from "react";
import { createClient } from "genlayer-js";
import { testnetBradbury } from "genlayer-js/chains";

const CONTRACT_ADDRESS = "0x955E63b344A23Ca1bAA763Cf1eAf2a5aC69Cd334";

const readClient = createClient({ chain: testnetBradbury });

export default function Home() {
  const [activeTab, setActiveTab] = useState("submit");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  const [proofId, setProofId] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [summary, setSummary] = useState("");

  const [checkId, setCheckId] = useState("");
  const [verdict, setVerdict] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [judgeId, setJudgeId] = useState("");
  const [totalSubmissions, setTotalSubmissions] = useState(null);

  const connectWallet = async () => {
    if (!window.ethereum) {
      showMessage("MetaMask not found. Please install it.", "error");
      return;
    }
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setWalletAddress(accounts[0]);
    showMessage("Wallet connected!");
  };

  const getWalletClient = async () => {
    if (!window.ethereum) throw new Error("MetaMask not found");
    await window.ethereum.request({ method: "eth_requestAccounts" });
    return createClient({
      chain: testnetBradbury,
      request: window.ethereum.request.bind(window.ethereum),
    });
  };

  const showMessage = (msg, type = "success") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 6000);
  };

  const handleSubmitProof = async () => {
    if (!proofId || !summary) {
      showMessage("Proof ID and Summary are required", "error");
      return;
    }
    try {
      setLoading(true);
      const client = await getWalletClient();
      const tx = await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: "submit_proof",
        args: [proofId, githubUrl, demoUrl, summary],
      });
      showMessage(`✅ Proof submitted! TX: ${tx.slice(0, 20)}...`);
      setProofId(""); setGithubUrl(""); setDemoUrl(""); setSummary("");
    } catch (err) {
      showMessage(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleJudgeProof = async () => {
    if (!judgeId) { showMessage("Enter Proof ID", "error"); return; }
    try {
      setLoading(true);
      const client = await getWalletClient();
      const tx = await client.writeContract({
        address: CONTRACT_ADDRESS,
        functionName: "judge_proof",
        args: [judgeId],
      });
      showMessage(`⚡ AI judging started! Takes 2-3 mins. TX: ${tx.slice(0, 20)}...`);
    } catch (err) {
      showMessage(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerdict = async () => {
    if (!checkId) { showMessage("Enter Proof ID", "error"); return; }
    try {
      setLoading(true);
      setVerdict(null); setSubmission(null);
      const sub = await readClient.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_submission",
        args: [checkId],
      });
      const ver = await readClient.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_verdict",
        args: [checkId],
      });
      const total = await readClient.readContract({
        address: CONTRACT_ADDRESS,
        functionName: "get_total",
        args: [],
      });
      setTotalSubmissions(total?.toString());
      setSubmission(sub ? JSON.parse(sub) : null);
      setVerdict(ver ? JSON.parse(ver) : null);
      if (!sub) showMessage("No submission found for this ID", "error");
    } catch (err) {
      showMessage(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const getVerdictBadge = (raw) => {
    if (!raw) return { color: "gray", label: "Unknown" };
    try {
      const p = JSON.parse(raw);
      const v = p.verdict || "";
      if (v.includes("SHIPPED")) return { color: "#22c55e", label: "✅ SHIPPED" };
      if (v.includes("WEAK")) return { color: "#eab308", label: "⚠️ WEAK" };
      if (v.includes("FAKE")) return { color: "#ef4444", label: "❌ FAKE" };
      if (v.includes("NEEDS")) return { color: "#3b82f6", label: "🔍 NEEDS MORE EVIDENCE" };
      return { color: "#6b7280", label: v };
    } catch { return { color: "#6b7280", label: "Parsing error" }; }
  };

  const parseVerdict = (raw) => {
    try { return JSON.parse(raw); } catch { return null; }
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #0a0f0a 100%)", color: "white", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Navbar */}
      <nav style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0 40px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "64px", backdropFilter: "blur(10px)", background: "rgba(0,0,0,0.4)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg, #f97316, #ea580c)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>🔍</div>
          <span style={{ fontWeight: "700", fontSize: "18px", background: "linear-gradient(90deg, #f97316, #fb923c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>BuilderProofVerifier</span>
          <span style={{ background: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", color: "#f97316", fontSize: "11px", padding: "2px 8px", borderRadius: "20px", fontWeight: "600" }}>BRADBURY TESTNET</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {totalSubmissions !== null && (
            <span style={{ color: "#6b7280", fontSize: "13px" }}>Total Proofs: <span style={{ color: "#f97316", fontWeight: "600" }}>{totalSubmissions}</span></span>
          )}
          <button onClick={connectWallet} style={{ background: walletAddress ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg, #f97316, #ea580c)", border: walletAddress ? "1px solid rgba(34,197,94,0.3)" : "none", color: walletAddress ? "#22c55e" : "white", padding: "8px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
            {walletAddress ? `✓ ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Connect Wallet"}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "60px 20px 40px", position: "relative" }}>
        <div style={{ position: "absolute", top: "0", left: "50%", transform: "translateX(-50%)", width: "600px", height: "200px", background: "radial-gradient(ellipse, rgba(249,115,22,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", padding: "6px 16px", borderRadius: "20px", marginBottom: "20px" }}>
          <span style={{ width: "6px", height: "6px", background: "#22c55e", borderRadius: "50%", display: "inline-block", animation: "pulse 2s infinite" }} />
          <span style={{ fontSize: "12px", color: "#f97316", fontWeight: "600" }}>Powered by GenLayer AI</span>
        </div>
        <h1 style={{ fontSize: "48px", fontWeight: "800", margin: "0 0 16px", lineHeight: "1.1" }}>
          AI-Powered Builder
          <br />
          <span style={{ background: "linear-gradient(90deg, #f97316, #fb923c, #fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Proof Verification</span>
        </h1>
        <p style={{ color: "#9ca3af", fontSize: "18px", maxWidth: "500px", margin: "0 auto 40px", lineHeight: "1.6" }}>
          Submit your builder proof. Multiple AI validators analyze your work and reach consensus on-chain.
        </p>

        {/* Stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: "40px", marginBottom: "50px" }}>
          {[
            { label: "AI Validators", value: "5+" },
            { label: "Network", value: "Bradbury" },
            { label: "Verdicts", value: "On-Chain" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#f97316" }}>{s.value}</div>
              <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Message */}
      {message && (
        <div style={{ maxWidth: "700px", margin: "0 auto 20px", padding: "0 20px" }}>
          <div style={{ background: messageType === "error" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)", border: `1px solid ${messageType === "error" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`, color: messageType === "error" ? "#fca5a5" : "#86efac", padding: "12px 16px", borderRadius: "10px", fontSize: "14px" }}>
            {message}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "0 20px 60px" }}>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "4px", marginBottom: "24px", border: "1px solid rgba(255,255,255,0.06)" }}>
          {[
            { key: "submit", icon: "📤", label: "Submit Proof" },
            { key: "judge", icon: "⚖️", label: "Judge Proof" },
            { key: "check", icon: "🔎", label: "Check Verdict" },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "600", transition: "all 0.2s", background: activeTab === tab.key ? "linear-gradient(135deg, #f97316, #ea580c)" : "transparent", color: activeTab === tab.key ? "white" : "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "32px", backdropFilter: "blur(10px)" }}>

          {/* Submit Tab */}
          {activeTab === "submit" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "700", margin: "0 0 6px" }}>Submit Builder Proof</h2>
                <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>Provide evidence of your work. AI validators will review your GitHub and demo.</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  { label: "Proof ID *", value: proofId, set: setProofId, placeholder: "e.g. basestaking_001", type: "input" },
                  { label: "GitHub Repository URL", value: githubUrl, set: setGithubUrl, placeholder: "https://github.com/yourname/project", type: "input" },
                  { label: "Live Demo URL", value: demoUrl, set: setDemoUrl, placeholder: "https://yourproject.netlify.app", type: "input" },
                ].map((f) => (
                  <div key={f.label}>
                    <label style={{ fontSize: "13px", color: "#9ca3af", fontWeight: "500", display: "block", marginBottom: "6px" }}>{f.label}</label>
                    <input value={f.value} onChange={(e) => f.set(e.target.value)} placeholder={f.placeholder} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 14px", color: "white", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontSize: "13px", color: "#9ca3af", fontWeight: "500", display: "block", marginBottom: "6px" }}>Project Summary *</label>
                  <textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Describe what you built, key features, tech stack, and why it matters..." rows={4} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 14px", color: "white", fontSize: "14px", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                </div>
                <button onClick={handleSubmitProof} disabled={loading} style={{ width: "100%", background: loading ? "rgba(249,115,22,0.5)" : "linear-gradient(135deg, #f97316, #ea580c)", border: "none", borderRadius: "10px", padding: "14px", color: "white", fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", marginTop: "8px" }}>
                  {loading ? "⏳ Submitting to blockchain..." : "📤 Submit Proof"}
                </button>
              </div>
            </div>
          )}

          {/* Judge Tab */}
          {activeTab === "judge" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "700", margin: "0 0 6px" }}>Judge a Proof</h2>
                <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>Trigger AI consensus. Multiple validators independently analyze the proof and agree on a verdict.</p>
              </div>
              <div style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "#fb923c", lineHeight: "1.6" }}>
                  ⚡ <strong>How it works:</strong> GenLayer's AI validators fetch your GitHub, analyze the code, and use LLM reasoning to reach consensus. This takes 2-3 minutes.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontSize: "13px", color: "#9ca3af", fontWeight: "500", display: "block", marginBottom: "6px" }}>Proof ID to Judge *</label>
                  <input value={judgeId} onChange={(e) => setJudgeId(e.target.value)} placeholder="e.g. basestaking_001" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 14px", color: "white", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
                </div>
                <button onClick={handleJudgeProof} disabled={loading} style={{ width: "100%", background: loading ? "rgba(249,115,22,0.5)" : "linear-gradient(135deg, #f97316, #ea580c)", border: "none", borderRadius: "10px", padding: "14px", color: "white", fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer" }}>
                  {loading ? "⏳ Sending to validators..." : "⚖️ Judge This Proof"}
                </button>
              </div>
            </div>
          )}

          {/* Check Tab */}
          {activeTab === "check" && (
            <div>
              <div style={{ marginBottom: "24px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: "700", margin: "0 0 6px" }}>Check Verdict</h2>
                <p style={{ color: "#6b7280", fontSize: "14px", margin: 0 }}>View the AI consensus verdict for any submitted proof.</p>
              </div>
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                <input value={checkId} onChange={(e) => setCheckId(e.target.value)} placeholder="Enter Proof ID" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 14px", color: "white", fontSize: "14px", outline: "none" }} />
                <button onClick={handleCheckVerdict} disabled={loading} style={{ background: "linear-gradient(135deg, #f97316, #ea580c)", border: "none", borderRadius: "8px", padding: "10px 20px", color: "white", fontSize: "14px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}>
                  {loading ? "..." : "Check →"}
                </button>
              </div>

              {submission && (
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
                  <p style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 12px" }}>Submission Details</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
                    <div style={{ display: "flex", gap: "8px" }}><span style={{ color: "#6b7280", minWidth: "80px" }}>Proof ID:</span><span style={{ color: "#e5e7eb" }}>{submission.proof_id}</span></div>
                    <div style={{ display: "flex", gap: "8px" }}><span style={{ color: "#6b7280", minWidth: "80px" }}>GitHub:</span><a href={submission.github_url} target="_blank" rel="noreferrer" style={{ color: "#f97316", textDecoration: "none" }}>{submission.github_url || "N/A"}</a></div>
                    <div style={{ display: "flex", gap: "8px" }}><span style={{ color: "#6b7280", minWidth: "80px" }}>Demo:</span><a href={submission.demo_url} target="_blank" rel="noreferrer" style={{ color: "#f97316", textDecoration: "none" }}>{submission.demo_url || "N/A"}</a></div>
                    <div style={{ display: "flex", gap: "8px" }}><span style={{ color: "#6b7280", minWidth: "80px" }}>Summary:</span><span style={{ color: "#e5e7eb" }}>{submission.summary}</span></div>
                  </div>
                </div>
              )}

              {verdict && verdict.judged && (() => {
                const p = parseVerdict(verdict.verdict_raw);
                const badge = getVerdictBadge(verdict.verdict_raw);
                return (
                  <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${badge.color}33`, borderRadius: "12px", padding: "20px" }}>
                    <p style={{ fontSize: "12px", color: "#6b7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 16px" }}>AI Consensus Verdict</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                      <span style={{ background: `${badge.color}22`, border: `1px solid ${badge.color}55`, color: badge.color, padding: "6px 16px", borderRadius: "20px", fontSize: "14px", fontWeight: "700" }}>{badge.label}</span>
                      {p && <span style={{ color: "#9ca3af", fontSize: "14px" }}>Score: <strong style={{ color: "white" }}>{p.score}/100</strong></span>}
                      {p && <span style={{ color: "#9ca3af", fontSize: "14px" }}>Confidence: <strong style={{ color: "white" }}>{p.confidence}</strong></span>}
                    </div>
                    {p && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
                        <div>
                          <p style={{ color: "#6b7280", margin: "0 0 6px", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>Evidence Quality: {p.evidence_quality}</p>
                        </div>
                        {p.reasons?.length > 0 && (
                          <div>
                            <p style={{ color: "#6b7280", margin: "0 0 8px", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>Reasons</p>
                            {p.reasons.map((r, i) => (
                              <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "4px", color: "#d1d5db" }}>
                                <span style={{ color: "#f97316" }}>→</span> {r}
                              </div>
                            ))}
                          </div>
                        )}
                        {p.risk_flags?.length > 0 && (
                          <div>
                            <p style={{ color: "#6b7280", margin: "0 0 8px", fontSize: "12px", fontWeight: "600", textTransform: "uppercase" }}>Risk Flags</p>
                            {p.risk_flags.map((f, i) => (
                              <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "4px", color: "#fca5a5" }}>
                                <span>⚠️</span> {f}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {verdict && !verdict.judged && (
                <div style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: "10px", padding: "14px", color: "#fde68a", fontSize: "14px" }}>
                  ⏳ Not judged yet — go to "Judge Proof" tab to trigger AI consensus.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "40px", color: "#374151", fontSize: "13px" }}>
          Built on <span style={{ color: "#f97316" }}>GenLayer</span> Bradbury Testnet · Contract: {CONTRACT_ADDRESS.slice(0, 10)}...{CONTRACT_ADDRESS.slice(-6)}
        </div>
      </div>
    </div>
  );
}