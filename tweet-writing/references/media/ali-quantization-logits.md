# ali-quantization-logits.jpg

Two hand-drawn logit charts from Ali's GLM 5.2 quantization post.

**Left: "Logits of GLM 5.2 — With Other Quant"**
- Prompt: "Cat sat on the [Door] ✗"
- Annotation: "Predicts Door (wrong)"
- The red quantized distribution is shifted right of the original black curve.

**Right: "Logits of GLM 5.2 — With Our Quant"**
- Prompt: "Cat sat on the [Mat] ✓"
- Annotation: "Predicts Mat (right)"
- The green quantized distribution closely tracks the original curve.

X-axis on both: -3, -2 Road, -1 Shoulder, 0 Mat, 1 Door, 2 Floor, 3.
