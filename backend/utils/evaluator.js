// --- Category based on score ---
const getCategory = (score) => {
  if (score >= 80) return { label: 'Strong Match', color: 'green' };
  if (score >= 60) return { label: 'Maybe',        color: 'yellow' };
  if (score >= 40) return { label: 'Weak Match',   color: 'orange' };
  return                  { label: 'Not Suitable', color: 'red' };
};

// --- Seniority detection from resume text ---
const getSeniorityLevel = (resumeText) => {
  const text = resumeText.toLowerCase();

  // Check for years of experience mentioned in resume
  const yearsMatch = text.match(/(\d+)\s*\+?\s*years?\s*(of\s*)?(experience|exp)/);
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1]);
    if (years >= 8)  return 'Senior';
    if (years >= 3)  return 'Mid-Level';
    return 'Junior';
  }

  // If no years mentioned, check for keywords
  if (text.includes('senior') || text.includes('lead') || text.includes('architect')) {
    return 'Senior';
  }
  if (text.includes('junior') || text.includes('intern') || text.includes('fresher') || text.includes('trainee')) {
    return 'Junior';
  }

  return 'Mid-Level'; // default
};

// --- Red flags detection ---
const getRedFlags = (resumeText, missingSkills) => {
  const flags = [];
  const text = resumeText.toLowerCase();

  // Too many missing critical skills
  if (missingSkills && missingSkills.length >= 4) {
    flags.push('High number of missing skills');
  }

  // Very short resume (less than 200 characters — likely empty or broken)
  if (resumeText.length < 200) {
    flags.push('Resume content too short or unreadable');
  }

  // No contact info detected
  if (!text.includes('@') && !text.includes('email')) {
    flags.push('No email address found');
  }

  // Employment gaps keyword
  if (text.includes('gap') || text.includes('career break')) {
    flags.push('Possible employment gap mentioned');
  }

  return flags;
};

// --- Highlights detection (good things) ---
const getHighlights = (resumeText) => {
  const highlights = [];
  const text = resumeText.toLowerCase();

  if (text.includes('github') || text.includes('portfolio')) {
    highlights.push('Has GitHub or portfolio link');
  }
  if (text.includes('open source') || text.includes('open-source')) {
    highlights.push('Open source contributions');
  }
  if (text.includes('award') || text.includes('achievement') || text.includes('winner')) {
    highlights.push('Has awards or achievements');
  }
  if (text.includes('certified') || text.includes('certification')) {
    highlights.push('Has certifications');
  }
  if (text.includes('published') || text.includes('research paper') || text.includes('patent')) {
    highlights.push('Published work or patents');
  }

  return highlights;
};

// --- Main evaluate function (combines everything) ---
const evaluateResume = (resumeText, scoreData) => {
  const category    = getCategory(scoreData.score);
  const seniority   = getSeniorityLevel(resumeText);
  const redFlags    = getRedFlags(resumeText, scoreData.missingSkills);
  const highlights  = getHighlights(resumeText);

  return {
    ...scoreData,       // spread original AI score data (score, matchedSkills, etc.)
    category,           // Strong Match / Maybe / Weak Match / Not Suitable
    seniority,          // Junior / Mid-Level / Senior
    redFlags,           // array of warning strings
    highlights,         // array of positive strings
    recommended: scoreData.score >= 60 // true/false — should we interview them?
  };
};

module.exports = { evaluateResume };