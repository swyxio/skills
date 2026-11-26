# ali-quantization-diagram.jpg

Side-by-side comparison from Ali's GLM 5.2 quantization post.

- **Left title (red):** "GLM 5.2 (Nvidia Quant)"
- **Right title (blue):** "GLM 5.2 (Our Quant)"

Each side repeats the GLM 5.2 MoE block (Shared + routed experts, Router, RMS, Attention with QK Norm and Rope, Token Embedding, Linear Output Layer) four times. Highlighted Linear layers show which weights each method quantizes: Nvidia's quant highlights the routed experts in green; "Our Quant" highlights a different, more selective set in blue, including some shared-expert layers.
