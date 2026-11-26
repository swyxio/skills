# google-timesfm3-architecture.jpg

Google TimesFM 3 architecture diagram. Posted 10:52 AM · Aug 31, 2026 · 2M views · 182 replies · 1.4K reposts · 11K likes.

- **Patching: 32 points per patch.** Four input series over patches p0–p6, split into Context (p0–p2) and Horizon (p3–p6). The horizon is unknown ("?") for T1 and T2, empty for P1, and known for F1.
- **Middle:** a token grid (T1, T2, P1, F1 × tokens) with arrows for "Causal Temporal Attention" (across tokens) and "Full Variate Attention" (across series), between an "i/p residual block" and an "o/p residual block".
- **Right, "Final Predicted Targets":** T1 and T2 predicted over p3–p6.
- **Bottom pipeline:** "T1, T2, P1: tokenᵢ = [pᵢ]" and "F1: tokenᵢ = [pᵢ | pᵢ₊₁ | pᵢ₊₂]" → i/p residual block → "X N layers (alternating temporal + variate attention + FFN)" → o/p residual block.
- **Legend:** "blue: Target series T1 and T2, purple: past cov series P1, green: past-future cov series F1"
