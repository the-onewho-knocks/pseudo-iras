from datetime import datetime, timezone


def build_report(
    session_id: str,
    transcript: str,
    audio_metrics: dict,
    ai_scores: dict,
    job_role: str = "Unknown"
) -> dict:
    """Assemble all analysis results into a single unified report dict."""
    overall_score = ai_scores.get("overall_score", _compute_fallback_score(ai_scores))

    summary = {
        "overall_score":   overall_score,
        "job_role":        job_role,
        "recommended":     ai_scores.get("recommended_for_role", False),
        "speech_pace_wpm": audio_metrics.get("speech_pace_wpm", 0),
        "filler_rate_pct": audio_metrics.get("filler_word_analysis", {}).get("filler_rate", 0),
        "word_count":      audio_metrics.get("word_count", 0),
        "assessment":      ai_scores.get("summary", "")
    }

    return {
        "session_id":    session_id,
        "generated_at":  datetime.now(timezone.utc).isoformat(),
        "job_role":      job_role,
        "overall_score": overall_score,
        "summary":       summary,
        "transcript":    transcript,
        "ai_scores":     ai_scores,
        "audio_metrics": audio_metrics,
        "version":       "1.0"
    }


def _compute_fallback_score(ai_scores: dict) -> int:
    scores = ai_scores.get("scores", {})
    if not scores:
        return 0
    values = [v for v in scores.values() if isinstance(v, (int, float))]
    if not values:
        return 0
    return round(sum(values) / len(values) * 10)  # scale 1–10 → 10–100


def format_report_for_display(report: dict) -> dict:
    """Return a presentation-friendly version stripped of raw transcript."""
    return {
        "session_id":    report["session_id"],
        "generated_at":  report["generated_at"],
        "job_role":      report["job_role"],
        "overall_score": report["overall_score"],
        "summary":       report["summary"],
        "scores":        report.get("ai_scores", {}).get("scores", {}),
        "strengths":     report.get("ai_scores", {}).get("strengths", []),
        "weaknesses":    report.get("ai_scores", {}).get("weaknesses", []),
        "tips":          report.get("ai_scores", {}).get("improvement_tips", []),
        "audio": {
            "pace_wpm":     report.get("audio_metrics", {}).get("speech_pace_wpm"),
            "filler_words": report.get("audio_metrics", {}).get("filler_word_analysis", {}),
            "duration_sec": report.get("audio_metrics", {}).get("duration_seconds")
        }
    }