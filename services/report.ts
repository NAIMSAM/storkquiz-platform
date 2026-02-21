
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QuizSession, StudentResponse } from '../types';

export const generateSessionReport = (session: QuizSession, responses: StudentResponse[]) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- HEADER ---
    // Logo placeholder text (real logo needs base64)
    doc.setFontSize(22);
    doc.setTextColor(6, 182, 212); // Cyan-500
    doc.text("StorkQuiz AI", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Rapport de Session - ${new Date().toLocaleDateString()}`, 14, 26);

    // Line separator
    doc.setDrawColor(200);
    doc.line(14, 30, pageWidth - 14, 30);

    // --- SESSION INFO ---
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(session.title, 14, 40);

    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(`Nombre de questions : ${session.questions.length}`, 14, 48);
    doc.text(`Nombre de participants : ${new Set(responses.map(r => r.studentName)).size}`, 14, 54);

    // --- LEADERBOARD TABLE ---
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("🏆 Classement Général", 14, 70);

    // Calculate scores
    const scores: Record<string, number> = {};
    responses.forEach(r => {
        if (r.isCorrect) {
            scores[r.studentName] = (scores[r.studentName] || 0) + 1;
        } else {
            scores[r.studentName] = (scores[r.studentName] || 0);
        }
    });

    const leaderboard = Object.entries(scores)
        .sort(([, a], [, b]) => b - a)
        .map(([name, score], index) => [
            (index + 1).toString(),
            name,
            `${score} / ${session.questions.length}`,
            `${Math.round((score / session.questions.length) * 100)}%`
        ]);

    autoTable(doc, {
        startY: 75,
        head: [['Rang', 'Participant', 'Score', 'Réussite']],
        body: leaderboard,
        theme: 'grid',
        headStyles: { fillColor: [6, 182, 212] }, // Cyan
        styles: { fontSize: 10 }
    });

    // --- QUESTIONS STATS TABLE ---
    // @ts-ignore
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("📊 Statistiques par Question", 14, finalY);

    const questionStats = session.questions.map((q, idx) => {
        const qResponses = responses.filter(r => r.questionId === q.id);
        const correctCount = qResponses.filter(r => r.isCorrect).length;
        const totalCount = qResponses.length;
        const successRate = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

        return [
            `Q${idx + 1}`,
            q.question,
            `${successRate}%`
        ];
    });

    autoTable(doc, {
        startY: finalY + 5,
        head: [['#', 'Question', 'Succès Global']],
        body: questionStats,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59] }, // Slate-800
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 30, halign: 'center' }
        }
    });

    // Save
    doc.save(`Rapport_Session_${session.id}.pdf`);
};
