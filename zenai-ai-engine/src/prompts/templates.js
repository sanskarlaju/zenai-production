const TEMPLATES = {
  // Task Templates
  task: {
    bug: {
      title: "🐛 [BUG] {summary}",
      description: `
**Bug Description:**
{description}

**Steps to Reproduce:**
1. {step1}
2. {step2}
3. {step3}

**Expected Behavior:**
{expected}

**Actual Behavior:**
{actual}

**Environment:**
- Browser/Device: {environment}
- Version: {version}

**Screenshots/Logs:**
{attachments}

**Priority Justification:**
{priority_reason}
`,
      tags: ["bug", "needs-investigation"]
    },

    feature: {
      title: "✨ [FEATURE] {summary}",
      description: `
**Feature Description:**
{description}

**User Story:**
As a {user_type}, I want to {action} so that {benefit}.

**Acceptance Criteria:**
- [ ] {criteria1}
- [ ] {criteria2}
- [ ] {criteria3}

**Technical Considerations:**
{technical_notes}

**Dependencies:**
{dependencies}

**Success Metrics:**
{metrics}
`,
      tags: ["feature", "enhancement"]
    },

    refactor: {
      title: "♻️ [REFACTOR] {summary}",
      description: `
**Refactoring Goal:**
{goal}

**Current State:**
{current_state}

**Proposed Changes:**
{proposed_changes}

**Benefits:**
- {benefit1}
- {benefit2}

**Risks:**
{risks}

**Testing Strategy:**
{testing}
`,
      tags: ["refactor", "technical-debt"]
    }
  },

  // Meeting Templates
  meeting: {
    standup: {
      title: "Daily Standup - {date}",
      agenda: [
        "What did you accomplish yesterday?",
        "What are you working on today?",
        "Any blockers?"
      ],
      duration: "15 minutes"
    },

    sprint: {
      planning: {
        title: "Sprint Planning - Sprint {number}",
        agenda: [
          "Review sprint goal",
          "Prioritize backlog items",
          "Estimate effort",
          "Commit to sprint scope",
          "Identify dependencies and risks"
        ],
        duration: "2 hours"
      },

      review: {
        title: "Sprint Review - Sprint {number}",
        agenda: [
          "Demo completed work",
          "Gather stakeholder feedback",
          "Review sprint metrics",
          "Discuss what's next"
        ],
        duration: "1 hour"
      },

      retrospective: {
        title: "Sprint Retrospective - Sprint {number}",
        agenda: [
          "What went well?",
          "What could be improved?",
          "Action items for next sprint"
        ],
        duration: "1 hour"
      }
    }
  },

  // Project Templates
  project: {
    software: {
      name: "{project_name}",
      description: "Software development project",
      phases: [
        "Requirements Gathering",
        "Design & Architecture",
        "Development",
        "Testing & QA",
        "Deployment",
        "Maintenance"
      ],
      defaultTags: ["development", "software"]
    },

    marketing: {
      name: "{campaign_name}",
      description: "Marketing campaign",
      phases: [
        "Research & Strategy",
        "Creative Development",
        "Content Creation",
        "Campaign Launch",
        "Monitoring & Optimization",
        "Reporting"
      ],
      defaultTags: ["marketing", "campaign"]
    }
  },

  // Email Templates
  email: {
    projectUpdate: `
Subject: Project Update: {project_name} - {date}

Hi Team,

Here's our project update for {project_name}:

**Progress:**
- Overall completion: {progress}%
- Tasks completed: {completed_tasks}
- Tasks in progress: {in_progress_tasks}

**Highlights:**
{highlights}

**Upcoming Milestones:**
{milestones}

**Blockers & Risks:**
{blockers}

**Next Steps:**
{next_steps}

Questions or concerns? Let's discuss.

Best regards,
{sender_name}
`,

    statusReport: `
Subject: Weekly Status Report - {week_of}

**Summary:**
{summary}

**Completed:**
{completed_items}

**In Progress:**
{in_progress_items}

**Planned:**
{planned_items}

**Metrics:**
- Velocity: {velocity}
- Quality Score: {quality_score}
- Team Utilization: {utilization}

**Issues & Risks:**
{issues}

**Requests & Decisions Needed:**
{requests}
`
  }
};

// Template rendering function
const renderTemplate = (template, variables) => {
  let rendered = template;
  
  Object.keys(variables).forEach(key => {
    const placeholder = new RegExp(`{${key}}`, 'g');
    rendered = rendered.replace(placeholder, variables[key] || '');
  });
  
  return rendered;
};

module.exports = { TEMPLATES, renderTemplate };