export const InternalLinkingStructure = {
  header: [
    { name: 'Dashboard', path: '/' },
    { name: 'Syllabus', path: '/subjects' },
    { name: 'Flashcards', path: '/recall' },
  ],
  footer: [
    { name: 'Performance Stats', path: '/stats' },
    { name: 'App Settings', path: '/settings' },
  ],
  contextual: {
    subjects_to_recall: "After defining subjects, navigate to /recall to start active recall.",
    home_to_subjects: "Begin by adding a new subject at /subjects.",
  }
};