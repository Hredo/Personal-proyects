"""Rubric-based evaluation system for technical interviews."""

from typing import Optional
import json


class Rubric:
    """Defines scoring criteria for a competency."""

    def __init__(
        self,
        name: str,
        weight: float,
        max_score: int = 25,
        criteria: dict[str, str] | None = None,
    ):
        self.name = name
        self.weight = weight
        self.max_score = max_score
        self.criteria = criteria or {}

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "weight": self.weight,
            "max_score": self.max_score,
            "criteria": self.criteria,
        }


class RubricsEngine:
    """Evaluates answers against multiple competencies with weighted scoring."""

    # Predefined rubric set for technical interviews
    DEFAULT_RUBRICS = [
        Rubric(
            name="Architecture & Design",
            weight=0.25,
            max_score=25,
            criteria={
                "25": "Excellent system design with clear patterns and scalability",
                "19": "Good architecture with minor design issues",
                "13": "Basic structure with some design considerations",
                "7": "Weak design, lacks clarity",
                "0": "No clear design or structure",
            },
        ),
        Rubric(
            name="Technical Complexity",
            weight=0.25,
            max_score=25,
            criteria={
                "25": "Demonstrates deep technical understanding",
                "19": "Shows solid technical knowledge",
                "13": "Addresses basic technical aspects",
                "7": "Limited technical depth",
                "0": "Lacks technical substance",
            },
        ),
        Rubric(
            name="Communication",
            weight=0.25,
            max_score=25,
            criteria={
                "25": "Crystal clear explanation, well-structured",
                "19": "Clear communication with minor issues",
                "13": "Reasonable explanation, somewhat unclear",
                "7": "Unclear or disorganized",
                "0": "Incomprehensible",
            },
        ),
        Rubric(
            name="Problem-Solving",
            weight=0.25,
            max_score=25,
            criteria={
                "25": "Innovative, optimal solution with edge cases handled",
                "19": "Good solution with minor gaps",
                "13": "Acceptable solution, some issues",
                "7": "Incomplete or inefficient solution",
                "0": "No clear solution",
            },
        ),
    ]

    def __init__(self, rubrics: list[Rubric] | None = None):
        self.rubrics = rubrics or self.DEFAULT_RUBRICS

    def evaluate(self, answer: str, rubric_scores: dict[str, int] | None = None) -> dict:
        """
        Evaluate an answer across all rubrics.

        Args:
            answer: The user's answer text
            rubric_scores: Optional pre-calculated scores per rubric (for testing)
                          If None, scores are estimated based on answer length/content

        Returns:
            dict with total_score, competencies breakdown, and feedback
        """
        if rubric_scores is None:
            # Estimate scores based on answer characteristics
            rubric_scores = self._estimate_scores(answer)

        competencies = []
        total_weighted_score = 0

        for rubric in self.rubrics:
            score = rubric_scores.get(rubric.name, 13)  # Default mid-range
            score = min(max(score, 0), rubric.max_score)  # Clamp to valid range

            competencies.append(
                {
                    "name": rubric.name,
                    "score": score,
                    "max_score": rubric.max_score,
                    "percentage": int((score / rubric.max_score) * 100),
                    "weight": rubric.weight,
                }
            )

            total_weighted_score += (score / rubric.max_score) * 100 * rubric.weight

        return {
            "total_score": int(total_weighted_score),
            "competencies": competencies,
            "feedback": self._generate_feedback(competencies, answer),
        }

    def _estimate_scores(self, answer: str) -> dict[str, int]:
        """Estimate scores based on answer length and content characteristics."""
        length = len(answer.split())
        code_lines = answer.count("\n") + 1 if "\n" in answer else 1

        # Simple heuristic: longer, detailed answers score higher
        base_score = min(25, 5 + length // 20)

        # Code presence suggests technical depth
        if "def " in answer or "class " in answer or "{" in answer:
            base_score = min(25, base_score + 5)

        # Technical terms boost score
        tech_keywords = [
            "algorithm",
            "optimization",
            "cache",
            "complexity",
            "design pattern",
            "scalable",
        ]
        keyword_count = sum(1 for kw in tech_keywords if kw.lower() in answer.lower())
        base_score = min(25, base_score + keyword_count * 2)

        return {
            "Architecture & Design": base_score,
            "Technical Complexity": base_score,
            "Communication": min(25, length // 10),
            "Problem-Solving": base_score,
        }

    def _generate_feedback(self, competencies: list[dict], answer: str) -> str:
        """Generate constructive feedback based on competency scores."""
        strengths = [c["name"] for c in competencies if c["percentage"] >= 80]
        weaknesses = [c["name"] for c in competencies if c["percentage"] < 50]

        feedback_parts = []

        if strengths:
            feedback_parts.append(f"✓ Fortalezas: {', '.join(strengths)}")

        if weaknesses:
            feedback_parts.append(
                f"⚠ Áreas de mejora: {', '.join(weaknesses)}. "
                "Considera explicar con más detalle o incluir más contexto técnico."
            )

        if not answer.strip():
            feedback_parts.append("📝 Por favor, proporciona una respuesta más completa.")

        return " | ".join(feedback_parts) if feedback_parts else "Respuesta aceptada."

    def to_dict(self) -> dict:
        """Export rubric definitions."""
        return {"rubrics": [r.to_dict() for r in self.rubrics]}
