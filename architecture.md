interview-intelligence/
│
├── backend/
│   │
│   ├── main.py
│   │
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
│   │   ├── emotion_detector.py
│   │   ├── resume_matcher.py
│   │   ├── email_service.py
│   │   └── report.py
│   │
│   ├── utils/
│   │   ├── file_handler.py
│   │   ├── video_utils.py
│   │   └── helpers.py
│   │
│   ├── models/
│   │   └── schemas.py
│   │
│   ├── uploads/
│   ├── outputs/
│   │
│   └── requirements.txt
│
├── sample_data/
│   └── demo_interview.mp3
│
├── README.md
└── .env