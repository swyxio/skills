# waterloo-masterclass-diagram.jpg

Architecture diagram set from the Baseten masterclass thread. Post metrics: 60 replies · 110 reposts · 1.6K likes · 534K views. Partly visible post text: "@Baseten @philipkiely and @waterloo_intern explain what actually happened…"

**Top row, left to right:**
- Transformer (GPT2): LayerNorm → Multi-Head Self-Attention (Q/K/V projections) → LayerNorm → MLP, ×N
- DeltaNet Transformer: RMSNorm → DeltaNet "Linear Attention Replacement" (Q/K/V proj, conv, L2 norm, delta rule) → SwiGLU, ×N
- Gated DeltaNet Transformer: the same, with alpha/beta gates
- Gated DeltaNet Transformer (mixed): Gated DeltaNet layers interleaved with MLP blocks

**Bottom row:**
- Kimi Linear Model Architecture: KDA blocks plus an MoE layer with Shared Expert and Routed Experts selected by a Router
- Kimi K3, alongside a "Simplified (No Residual Connection)" variant
- Kimi K3 with block-level residual connections (×3 and ×23 stacks)
