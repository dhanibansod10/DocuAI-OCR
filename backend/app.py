from flask import Flask, request, jsonify
from flask_cors import CORS
import pytesseract
from PIL import Image
import language_tool_python
import cv2
import numpy as np

# ── App setup ──────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)  # allows requests from React dev server (localhost:5173 / 3000)

# ── Tesseract path (Windows — adjust if on Mac/Linux) ──────────────
# Mac/Linux: usually no need to set this if installed via brew/apt
# Windows:   set the path to your tesseract.exe
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# ── Grammar tool (downloads language model on first run) ───────────
tool = language_tool_python.LanguageTool("en-US")


# ══════════════════════════════════════════════════════════════════════
#  IMAGE PREPROCESSING  — improves OCR accuracy significantly
# ══════════════════════════════════════════════════════════════════════
def preprocess_image(pil_img):
    """
    Convert PIL image → greyscale → Gaussian blur → adaptive threshold.
    Returns a numpy array ready for pytesseract.
    """
    img_array = np.array(pil_img.convert("RGB"))          # ensure 3-channel
    gray      = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
    blur      = cv2.GaussianBlur(gray, (5, 5), 0)
    processed = cv2.adaptiveThreshold(
        blur, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        11, 2
    )
    return processed


# ══════════════════════════════════════════════════════════════════════
#  ROUTES
# ══════════════════════════════════════════════════════════════════════

@app.route("/")
def home():
    return jsonify({"status": "DocuAI backend running 🚀"})


@app.route("/ocr", methods=["POST"])
def ocr():
    """
    Accepts: multipart/form-data  { image: <file> }
    Returns: { text: "..." }
    """
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    try:
        file      = request.files["image"]
        pil_img   = Image.open(file.stream)
        processed = preprocess_image(pil_img)

        # OEM 3 = default LSTM engine, PSM 6 = uniform block of text
        config = r"--oem 3 --psm 6"
        text   = pytesseract.image_to_string(processed, config=config)

        return jsonify({"text": text.strip()})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/correct", methods=["POST"])
def correct():
    """
    Accepts: application/json  { text: "..." }
    Returns: { corrected_text: "..." }
    """
    data = request.get_json(silent=True)

    if not data or "text" not in data:
        return jsonify({"error": "No text provided"}), 400

    if not data["text"].strip():
        return jsonify({"error": "Text is empty"}), 400

    try:
        raw      = data["text"]
        matches  = tool.check(raw)
        corrected = language_tool_python.utils.correct(raw, matches)
        return jsonify({"corrected_text": corrected})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ══════════════════════════════════════════════════════════════════════
#  RUN
# ══════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    # debug=True gives hot-reload; set to False in production
    app.run(debug=True, port=5000)
