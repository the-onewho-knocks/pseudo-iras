# Pseudo-IRAS

Pseudo-IRAS is an AI-powered Interview Review and Assessment System designed to evaluate interview performance through speech analytics, AI-driven scoring, resume matching, and automated report generation.

The platform enables candidates, recruiters, and educators to analyze interview recordings, identify strengths and weaknesses, measure communication effectiveness, and generate actionable feedback reports.

---

## Features

### Interview Analysis

- Upload audio or video interview recordings
- Automatic speech-to-text transcription
- AI-generated interview evaluation
- Communication assessment
- Confidence scoring
- Technical knowledge analysis
- Problem-solving evaluation
- Role-specific recommendations

### Audio Analytics

- Speech pace (Words Per Minute)
- Filler word detection
- Vocabulary diversity analysis
- Pause analysis
- Speaking pattern insights

### Resume Matching

- Resume upload support
- PDF and DOCX parsing
- Skill extraction
- Job-role matching
- Missing skill identification
- Match score generation
- Personalized recommendations

### Reporting

- Detailed interview reports
- Candidate scorecards
- Strength and weakness analysis
- Improvement suggestions
- Hiring recommendations

### Dashboard

- Performance overview
- Score visualization
- Radar charts
- Audio analytics
- Interview summaries

---

## Architecture

```text
pseudo-iras/
│
├── backend/
│   ├── routes/
│   │   ├── upload.py
│   │   ├── analyze.py
│   │   ├── dashboard.py
│   │   ├── email.py
│   │   └── resume.py
│   │
│   ├── services/
│   │   ├── transcription.py
│   │   ├── analyzer.py
│   │   ├── audio_metrics.py
│   │   ├── resume_matcher.py
│   │   ├── email_service.py
│   │   └── report.py
│   │
│   ├── utils/
│   │   ├── file_handler.py
│   │   └── video_utils.py
│   │
│   ├── models/
│   │   └── schemas.py
│   │
│   ├── uploads/
│   └── outputs/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── context/
│   │   └── api/
│   │
│   └── public/
│
└── README.md
```

---

## Tech Stack

### Backend

- FastAPI
- Python
- Groq Whisper
- Groq Llama 3.3 70B
- Pydantic
- Jinja2
- PDFPlumber
- Python-Docx
- FFmpeg

### Frontend

- React
- Vite
- JavaScript
- Context API

---

## Installation

### Clone Repository

```bash
git clone https://github.com/your-username/pseudo-iras.git
cd pseudo-iras
```

### Create Virtual Environment

```bash
python -m venv .venv
```

### Activate Environment

Windows:

```bash
.venv\Scripts\activate
```

Linux/Mac:

```bash
source .venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Environment Variables

Create a `.env` file inside the project root.

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
FROM_EMAIL=your_email@gmail.com

FFMPEG_PATH=ffmpeg
```

---

## Running the Backend

Navigate to the backend directory:

```bash
cd backend
```

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

Server will be available at:

```text
http://localhost:8000
```

API Documentation:

```text
http://localhost:8000/docs
```

---

## Running the Frontend

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Frontend will be available at:

```text
http://localhost:5173
```

---

## API Endpoints

### Upload

```http
POST /api/upload
```

Upload interview audio or video files.

### Analyze

```http
POST /api/analyze
```

Generate AI-powered interview analysis.

### Dashboard

```http
GET /api/dashboard/{session_id}
```

Retrieve interview analytics.

### Resume Matching

```http
POST /api/resume
```

Analyze resume against a target job role.

### Email Report

```http
POST /api/email
```

Send generated reports through email.

---

## Analysis Metrics

The platform evaluates candidates using:

- Communication Clarity
- Technical Knowledge
- Problem Solving
- Confidence
- Cultural Fit
- Leadership Potential
- Conciseness
- Relevance of Answers

Additional analytics include:

- Overall Score
- Speech Pace
- Filler Word Rate
- Vocabulary Diversity
- Interview Summary
- Strengths
- Weaknesses
- Improvement Recommendations

---

## Future Improvements

- Real-time interview analysis
- Video emotion detection
- Multi-language support
- Historical performance tracking
- Candidate benchmarking
- Recruiter analytics dashboard
- Cloud storage integration
- Export reports as PDF

---

## License

This project is licensed under the MIT License.
