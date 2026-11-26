# ali-quantization-code.jpg

Diagram and config excerpt from Ali's GLM 5.2 quantization post.

**Left, architecture diagram ("GLM 5.2"):** Token Embedding → RMS → Attention (with QK Norm and Rope inputs) → residual add → RMS 2 → Router → three expert blocks labeled "Shared", "Routed", "Routed" (each: Linear → Silu → × with Linear → Linear) → sum → Linear Output Layer. The MoE block is marked "MOE ×78". Green-highlighted Linear layers in the routed experts mark the quantized layers.

**Right, config excerpt (lines 15–50):** a list of layer patterns kept out of quantization, alternating
`"model.layers.N.mlp.shared_experts*"` and `"model.layers.N.self_attn*"` for N = 10 through 27, plus `"model.layers.2.*"`.
