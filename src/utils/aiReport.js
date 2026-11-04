// AI cavabına 👎 hesabatının mətni (components/AIRating → POST /api/feedback, kind:'ai').
// Admin paneldə pre-wrap ilə göstərilir; ümumi uzunluq server limitindən (12 000) azdır.
export function aiReportText({ reason, note, question, answer }) {
  return [
    `[${reason}]${note ? ` ${note.trim()}` : ''}`,
    `— Sual:\n${String(question || '').trim().slice(0, 2000)}`,
    `— Cavab:\n${String(answer || '').trim().slice(0, 9000)}`,
  ].join('\n\n')
}
